"""Seed de démo complet : calendrier de matchs + communauté de pronostiqueurs.

Objectif (dev/démo uniquement) : peupler la base avec des données réalistes
alors que le catalogue ingéré ne contient que l'EWC 2025 (matchs tous passés) :

- un calendrier de matchs `seed-*` étalé d'une date de départ jusqu'à fin
  juillet (3 à 4 matchs par jour), avec statut déduit de l'heure courante
  (`done` au passé, `live` autour de maintenant, `upcoming` au futur) ;
- une communauté de pronostiqueurs `seed-u-*` aux niveaux variés, qui ont
  pronostiqué une grande partie des matchs (résultats déjà scorés pour les
  matchs terminés, pronos en attente pour les matchs à venir) ;
- quelques groupes `seed-g-*` (global, par jeu, par équipe) avec des membres.

⚠️ Outil de DÉV : touche au catalog (matches) ET à la communauté (users,
predictions, groups). Toutes les entités créées sont préfixées `seed-` pour
être nettoyées proprement (`--replace`) sans toucher aux données réelles.

Lancement (local) :
    python -m ingestion.seed_demo                 # purge + reseed (défaut)
    python -m ingestion.seed_demo --no-replace    # ajoute sans purger
    python -m ingestion.seed_demo --start-date 2026-05-25 --end-date 2026-07-31

Lancement (Docker) :
    docker compose run --rm api python -m ingestion.seed_demo
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import random
import selectors
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.models.catalog import Match, Player, utcnow
from app.models.community import (
    Group,
    GroupMembership,
    Prediction,
    User,
    UserPreferences,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("clutch.seed.demo")

# Préfixes d'identifiants : tout ce qui commence par là est « du seed » et peut
# être purgé sans risque pour les données réelles (utilisateur de session, etc.).
MATCH_PREFIX = "seed-"
USER_PREFIX = "seed-u-"
GROUP_PREFIX = "seed-g-"

# Graine RNG fixe → données reproductibles d'un run à l'autre (idempotent avec --replace).
DEFAULT_RNG_SEED = 1076817

DEFAULT_START_DATE = date(2026, 5, 25)
DEFAULT_END_DATE = date(2026, 7, 31)
DEFAULT_USER_COUNT = 42

WINS_NEEDED = {"BO1": 1, "BO3": 2, "BO5": 3}

# Cartes plausibles par jeu (les scores de manche sont générés ensuite).
MAP_POOLS: dict[str, list[str]] = {
    "val": ["Ascent", "Bind", "Haven", "Lotus", "Split", "Sunset", "Breeze", "Icebox", "Abyss"],
    "cs2": ["Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis", "Dust2", "Train"],
    # LoL : « manches » = parties, pas de cartes nommées (cf. front).
    "lol": [],
}

# Nombre de joueurs par camp sur un scoreboard.
ROSTER_SIZE = 5

# Postes LoL (par index de roster). Enum stable du jeu.
LOL_ROLES = ["Top", "Jungle", "Mid", "Bot", "Support"]

# Jeux pour lesquels on fabrique un scoreboard joueur (modèle de stats connu).
# RL/R6 : modèle trop différent et aucune donnée LPDB → matchs sans scoreboard.
SCOREBOARD_GAMES = {"val", "cs2", "lol", "dota"}

# Pools de « picks » dérivés des VRAIS matchs Liquipedia déjà en base (cf.
# `_load_pick_pools`) — aucun nom codé en dur ni d'appel CDN :
#   - "val_agents"  : agents Valorant réellement joués (set → liste) ;
#   - "dota_heroes" : héros Dota 2 réellement joués ;
#   - "lol_by_role" : poste → champions LoL réellement joués à ce poste.
# Si un pool est vide (jeu sans données), le scoreboard n'aura pas de pick.
ASSETS: dict[str, list[str]] = {"val_agents": [], "dota_heroes": []}
ASSETS_LOL_BY_ROLE: dict[str, list[str]] = {}

# Créneaux locaux (DISPLAY_TZ) des matchs d'une journée.
DAY_SLOTS = ["13:00", "15:30", "18:00", "20:30"]

# Pseudos de pronostiqueurs (assemblés ci-dessous) et pays.
HANDLE_PREFIXES = [
    "Shadow", "Neo", "Frost", "Blaze", "Ghost", "Pixel", "Turbo", "Vortex",
    "Cyber", "Rapid", "Nova", "Echo", "Storm", "Iron", "Lunar", "Solar",
    "Crypto", "Hyper", "Onyx", "Zen", "Volt", "Ember", "Drift", "Aero",
]
HANDLE_SUFFIXES = [
    "Sniper", "Wolf", "King", "Ace", "Reaper", "Fox", "Hawk", "Viper",
    "Ninja", "Titan", "Phantom", "Raven", "Blade", "Striker", "Mage", "Knight",
]
COUNTRIES = ["FR", "FR", "FR", "BE", "DE", "KR", "US", "BR", "SE", "PL", "ES", "GB", "CN", "CA", "NL", "DK", "UA"]

GROUP_EMOJIS = ["🔥", "🎮", "🏆", "⚡", "🐉", "👑", "🎯", "💥"]


# --- Helpers temps -----------------------------------------------------------


def _local_to_utc(day: date, hhmm: str, tz: ZoneInfo) -> datetime:
    """Combine une date + un créneau local (DISPLAY_TZ) → instant UTC stocké."""
    hh, mm = (int(x) for x in hhmm.split(":"))
    local = datetime.combine(day, time(hh, mm), tzinfo=tz)
    return local.astimezone(timezone.utc)


def _status_for(start_utc: datetime, now: datetime) -> str:
    """`done` si bien passé, `live` autour de maintenant, sinon `upcoming`."""
    if start_utc < now - timedelta(hours=3):
        return "done"
    if start_utc <= now + timedelta(minutes=30):
        return "live"
    return "upcoming"


# --- Génération du calendrier ------------------------------------------------


def _phase_and_bo(progress: float, rng: random.Random) -> tuple[str, str]:
    """Phase + format selon l'avancement du tournoi (0 = début, 1 = fin)."""
    if progress < 0.55:
        return f"Groupe {rng.choice('ABCD')}", rng.choice(["BO1", "BO1", "BO3"])
    if progress < 0.80:
        return "Quart de finale", rng.choice(["BO3", "BO5"])
    if progress < 0.92:
        return "Demi-finale", "BO5"
    if progress < 0.97:
        return "Petite finale", "BO3"
    return "Finale", "BO5"


def _series_score(best_of: str, rng: random.Random) -> tuple[int, int, str]:
    """Score de série + côté vainqueur ('a'|'b') cohérents avec le format."""
    needed = WINS_NEEDED[best_of]
    loser = 0 if needed == 1 else rng.randint(0, needed - 1)
    winner_side = rng.choice(["a", "b"])
    return (needed, loser, winner_side) if winner_side == "a" else (loser, needed, winner_side)


def _map_score(game_id: str, map_name: str, winner: str, rng: random.Random) -> dict:
    """Score d'une manche réaliste pour le jeu (vainqueur imposé)."""
    if game_id == "lol":
        win_k, lose_k = rng.randint(18, 34), rng.randint(4, 19)
        a, b = (win_k, lose_k) if winner == "a" else (lose_k, win_k)
        return {"name": map_name, "scoreA": a, "scoreB": b, "winner": winner}
    # val / cs2 : manche à 13, perdant 3..11 (OT occasionnel 14-12 / 16-14).
    if rng.random() < 0.12:
        win_r, lose_r = rng.choice([(14, 12), (16, 14), (13, 11)])
    else:
        win_r, lose_r = 13, rng.randint(3, 11)
    a, b = (win_r, lose_r) if winner == "a" else (lose_r, win_r)
    return {"name": map_name, "scoreA": a, "scoreB": b, "winner": winner}


def _partition(total: int, parts: int, rng: random.Random) -> list[int]:
    """Découpe `total` en `parts` entiers >= 0 dont la somme vaut `total`."""
    if parts <= 0:
        return []
    cuts = sorted(rng.randint(0, total) for _ in range(parts - 1))
    result: list[int] = []
    prev = 0
    for cut in cuts:
        result.append(cut - prev)
        prev = cut
    result.append(total - prev)
    return result


def _side_scoreboard(
    game_id: str,
    side: str,
    roster: list[dict],
    picks: list[str | None],
    *,
    is_winner: bool,
    team_kills: int | None,
    rng: random.Random,
) -> list[dict]:
    """Stat-line par joueur d'un camp, calquée sur les vrais joueurs du roster.

    `picks` = agent (Valorant) ou champion (LoL) par joueur, dans l'ordre.
    """
    players = roster[:ROSTER_SIZE]

    if game_id in ("lol", "dota"):
        # Les kills des joueurs somment aux kills d'équipe de la partie.
        kills = _partition(team_kills or 0, len(players), rng)
    elif game_id == "cs2":
        kills = [rng.randint(15, 27) if is_winner else rng.randint(8, 19) for _ in players]
    else:  # val
        kills = [rng.randint(16, 27) if is_winner else rng.randint(10, 20) for _ in players]

    rows: list[dict] = []
    for i, player in enumerate(players):
        k = kills[i]
        deaths = rng.randint(0, 7) if game_id in ("lol", "dota") else max(0, rng.randint(8, 16) - (3 if is_winner else 0))
        assists = rng.randint(2, 9) if game_id not in ("lol", "dota") else rng.randint(2, 18)
        row: dict = {
            "side": side,
            "name": player["name"],
            "countryCode": player["country_code"],
            "kills": k,
            "deaths": deaths,
            "assists": assists,
        }
        pick = picks[i] if i < len(picks) else None
        if game_id == "val":
            row["acs"] = round(k * 11 + rng.uniform(40, 110), 1)
            row["adr"] = round(rng.uniform(115, 175), 1)
            row["hs"] = round(rng.uniform(18, 42), 1)
            row["agent"] = pick
        elif game_id == "cs2":
            row["adr"] = round(rng.uniform(55, 105), 1)
        elif game_id == "lol":
            row["role"] = LOL_ROLES[i % len(LOL_ROLES)]
            row["champion"] = pick
        elif game_id == "dota":
            # Cores (positions 1-2) farment plus que les supports (4-5).
            core = i < 3
            row["hero"] = pick
            row["gpm"] = rng.randint(480, 820) if core else rng.randint(260, 460)
            row["xpm"] = rng.randint(500, 900) if core else rng.randint(300, 540)
            row["lasthits"] = rng.randint(180, 420) if core else rng.randint(20, 130)
            row["networth"] = rng.randint(14000, 32000) if core else rng.randint(7000, 15000)
            row["level"] = rng.randint(18, 30) if is_winner else rng.randint(15, 27)
        rows.append(row)
    return rows


def _map_players(
    game_id: str,
    roster_a: list[dict],
    roster_b: list[dict],
    picks_a: list[str | None],
    picks_b: list[str | None],
    *,
    winner: str,
    map_a: int,
    map_b: int,
    rng: random.Random,
) -> list[dict]:
    """Scoreboard complet d'une manche (5 joueurs par camp), vrais rosters."""
    if game_id not in SCOREBOARD_GAMES or not roster_a or not roster_b:
        return []
    return _side_scoreboard(
        game_id, "a", roster_a, picks_a, is_winner=winner == "a", team_kills=map_a, rng=rng
    ) + _side_scoreboard(
        game_id, "b", roster_b, picks_b, is_winner=winner == "b", team_kills=map_b, rng=rng
    )


def _picks_for(roster: list[dict], game_id: str, rng: random.Random) -> list[str | None]:
    """Agents (Valorant) ou champions (LoL) par joueur, tirés des pools RÉELS.

    Les pools viennent des vrais matchs Liquipedia (`_load_pick_pools`). Pour
    LoL, le champion est cohérent avec le poste (un champion réellement joué à
    ce poste). None pour les jeux sans pick (CS2…) ou pool vide.
    """
    if game_id in ("val", "dota"):
        pool = ASSETS["val_agents" if game_id == "val" else "dota_heroes"]
        if not pool:
            return [None] * len(roster)
        return rng.sample(pool, min(len(roster), len(pool)))

    if game_id == "lol":
        picks: list[str | None] = []
        used: set[str] = set()
        for i in range(len(roster)):
            role = LOL_ROLES[i % len(LOL_ROLES)]
            bucket = [c for c in ASSETS_LOL_BY_ROLE.get(role, []) if c not in used]
            choice = rng.choice(bucket) if bucket else None
            if choice:
                used.add(choice)
            picks.append(choice)
        return picks

    return [None] * len(roster)


def _build_maps(
    game_id: str,
    score_a: int,
    score_b: int,
    roster_a: list[dict],
    roster_b: list[dict],
    rng: random.Random,
) -> list[dict]:
    """Manches respectant le score de série, scoreboard par joueur inclus."""
    winner_side = "a" if score_a > score_b else "b"
    winners = ["a"] * score_a + ["b"] * score_b
    rng.shuffle(winners)
    # La dernière manche est forcément remportée par le vainqueur de la série.
    winners.remove(winner_side)
    winners.append(winner_side)

    # Picks (agents/champions) fixés pour la série : un joueur garde le sien.
    picks_a = _picks_for(roster_a, game_id, rng)
    picks_b = _picks_for(roster_b, game_id, rng)

    pool = MAP_POOLS.get(game_id) or []
    names = rng.sample(pool, len(winners)) if len(pool) >= len(winners) else []
    maps: list[dict] = []
    for i, w in enumerate(winners):
        name = names[i] if names else f"Game {i + 1}"
        m = _map_score(game_id, name, w, rng)
        m["players"] = _map_players(
            game_id, roster_a, roster_b, picks_a, picks_b,
            winner=w, map_a=m["scoreA"], map_b=m["scoreB"], rng=rng,
        )
        maps.append(m)
    return maps


def _viewers(rng: random.Random) -> str:
    return f"{rng.randint(8, 220)}K"


def _streams(game_id: str, rng: random.Random) -> list[dict]:
    return [{"platform": "Twitch", "url": f"https://twitch.tv/clutch_{game_id}"}]


def _match_id(game_id: str, team_a: str, team_b: str, start_utc: datetime) -> str:
    slot = start_utc.strftime("%Y%m%d%H%M")
    return f"{MATCH_PREFIX}{game_id}-{team_a}-{team_b}-{slot}"[:128]


def build_matches(
    teams_by_game: dict[str, list[str]],
    rosters: dict[str, list[dict]],
    *,
    start: date,
    end: date,
    now: datetime,
    tz: ZoneInfo,
    rng: random.Random,
) -> list[dict]:
    """Construit les payloads de matchs (3-4/jour) de `start` à `end` inclus."""
    games = [g for g, teams in teams_by_game.items() if len(teams) >= 2]
    if not games:
        raise ValueError("Aucun jeu n'a au moins deux équipes en base : ingestion requise d'abord.")

    total_days = (end - start).days + 1
    payloads: list[dict] = []
    day = start
    day_index = 0
    while day <= end:
        progress = day_index / max(total_days - 1, 1)
        n = rng.choice([3, 3, 4])
        slots = sorted(rng.sample(DAY_SLOTS, n))
        for slot in slots:
            game_id = rng.choice(games)
            team_a, team_b = rng.sample(teams_by_game[game_id], 2)
            roster_a = rosters.get(team_a, [])
            roster_b = rosters.get(team_b, [])
            start_utc = _local_to_utc(day, slot, tz)
            phase, best_of = _phase_and_bo(progress, rng)
            status = _status_for(start_utc, now)

            payload: dict = {
                "id": _match_id(game_id, team_a, team_b, start_utc),
                "game_id": game_id,
                "team_a_id": team_a,
                "team_b_id": team_b,
                "status": status,
                "phase": phase,
                "best_of": best_of,
                "start_time_utc": start_utc,
                "score_a": None,
                "score_b": None,
                "maps": None,
                "current_map_label": None,
                "viewers": None,
                "streams": _streams(game_id, rng),
                "veto": None,
                "extradata": None,
                "updated_at": utcnow(),
            }

            if status == "done":
                a, b, _ = _series_score(best_of, rng)
                payload.update(score_a=a, score_b=b, maps=_build_maps(game_id, a, b, roster_a, roster_b, rng))
            elif status == "live":
                a, b, winner = _series_score(best_of, rng)
                # Série en cours : on n'affiche que les manches déjà jouées.
                full = _build_maps(game_id, a, b, roster_a, roster_b, rng)
                played = max(1, len(full) - 1)
                live_maps = full[:played]
                last = live_maps[-1]
                last["live"] = True
                last.pop("winner", None)
                done_a = sum(1 for m in live_maps[:-1] if m.get("winner") == "a")
                done_b = sum(1 for m in live_maps[:-1] if m.get("winner") == "b")
                payload.update(
                    score_a=done_a,
                    score_b=done_b,
                    maps=live_maps,
                    current_map_label=f"{last['name']} · {last['scoreA']}–{last['scoreB']}",
                    viewers=_viewers(rng),
                )

            payloads.append(payload)
        day += timedelta(days=1)
        day_index += 1
    return payloads


# --- Génération de la communauté ---------------------------------------------


def build_users(count: int, rng: random.Random) -> list[User]:
    """Crée `count` pronostiqueurs aux pseudos uniques et niveaux variés."""
    users: list[User] = []
    seen: set[str] = set()
    while len(users) < count:
        name = f"{rng.choice(HANDLE_PREFIXES)}{rng.choice(HANDLE_SUFFIXES)}"
        if rng.random() < 0.6:
            name += str(rng.randint(1, 99))
        if name in seen:
            continue
        seen.add(name)
        idx = len(users)
        tag = name[:4].upper()
        users.append(
            User(
                id=f"{USER_PREFIX}{idx:03d}",
                name=name[:64],
                tag=tag,
                country_code=rng.choice(COUNTRIES),
                points=0,
                streak=0,
            )
        )
    return users


def _prediction_scoreline(best_of: str, pick: str, exact_target: tuple[int, int] | None, rng: random.Random) -> tuple[int, int]:
    """Score pronostiqué valide (vainqueur atteint le quota, perdant en dessous).

    Si `exact_target` est fourni et compatible avec `pick`, on le reproduit
    tel quel (prono « score exact »).
    """
    needed = WINS_NEEDED[best_of]
    if exact_target is not None:
        ta, tb = exact_target
        target_winner = "a" if ta > tb else "b"
        if target_winner == pick:
            return ta, tb
    loser = 0 if needed == 1 else rng.randint(0, needed - 1)
    return (needed, loser) if pick == "a" else (loser, needed)


def build_predictions(
    users: list[User],
    matches: list[dict],
    rng: random.Random,
) -> list[Prediction]:
    """Pronos par utilisateur : forte couverture, niveau propre à chacun.

    - `skill` ∈ [0.45, 0.85] = proba de désigner le bon vainqueur (done) ;
    - une fraction des bons pronos vise le score exact (25 pts).
    """
    predictions: list[Prediction] = []
    done_matches = [m for m in matches if m["status"] == "done"]
    open_matches = [m for m in matches if m["status"] in ("upcoming", "live")]

    for user in users:
        skill = rng.uniform(0.45, 0.85)
        done_cov = rng.uniform(0.70, 0.96)
        open_cov = rng.uniform(0.40, 0.80)

        for match in done_matches:
            if rng.random() > done_cov:
                continue
            actual_winner = "a" if match["score_a"] > match["score_b"] else "b"
            pick = actual_winner if rng.random() < skill else ("b" if actual_winner == "a" else "a")
            exact_target = (match["score_a"], match["score_b"]) if (pick == actual_winner and rng.random() < skill * 0.4) else None
            sa, sb = _prediction_scoreline(match["best_of"], pick, exact_target, rng)
            predictions.append(
                Prediction(user_id=user.id, match_id=match["id"], pick=pick, score_a=sa, score_b=sb)
            )

        for match in open_matches:
            if rng.random() > open_cov:
                continue
            pick = rng.choice(["a", "b"])
            sa, sb = _prediction_scoreline(match["best_of"], pick, None, rng)
            predictions.append(
                Prediction(user_id=user.id, match_id=match["id"], pick=pick, score_a=sa, score_b=sb)
            )
    return predictions


def build_groups(
    users: list[User],
    teams_by_game: dict[str, list[str]],
    rng: random.Random,
) -> list[tuple[Group, list[str]]]:
    """Quelques groupes (global ou périmètre multi-jeux) + leurs membres.

    Le périmètre d'un groupe est une liste de gameIds (`game_ids_csv`, colonne
    DB `game_id`) ; vide/None = tous les jeux. Plus de périmètre par équipe.
    """
    available = set(teams_by_game)
    # (nom, périmètre = liste de gameIds ; None/[] = tous les jeux)
    specs: list[tuple[str, list[str] | None]] = [
        ("La Ligue des Clutchers", None),
        ("Valorant Only", ["val"]),
        ("FPS Masters", ["val", "cs2"]),
        ("Bureau eSport", None),
    ]

    groups: list[tuple[Group, list[str]]] = []
    for i, (name, scope) in enumerate(specs):
        games = [g for g in (scope or []) if g in available]
        csv = ",".join(games) if games else None
        size = rng.randint(6, min(16, len(users)))
        members = rng.sample([u.id for u in users], size)
        group = Group(
            id=f"{GROUP_PREFIX}{i:02d}",
            name=name,
            emoji=rng.choice(GROUP_EMOJIS),
            code=f"CLTCH-SEED{i}",
            game_ids_csv=csv,
        )
        groups.append((group, members))
    return groups


# --- Orchestration -----------------------------------------------------------


def _load_pick_pools(session: Session) -> None:
    """Construit les pools de picks à partir des VRAIS matchs Liquipedia en base.

    Parcourt les scoreboards (`maps[].players`) des matchs ingérés (non-seed) :
    - agents Valorant réellement joués → `ASSETS["val_agents"]` ;
    - champions LoL par poste réellement joué → `ASSETS_LOL_BY_ROLE`.
    Aucun nom codé en dur : si Liquipedia ajoute un agent/champion, il entrera
    dans les pools à la prochaine ingestion.
    """
    rows = session.execute(
        select(Match.maps).where(~Match.id.like(f"{MATCH_PREFIX}%"), Match.maps.is_not(None))
    ).all()

    agents: set[str] = set()
    heroes: set[str] = set()
    by_role: dict[str, set[str]] = {role: set() for role in LOL_ROLES}
    for (maps,) in rows:
        for game in maps or []:
            for player in game.get("players") or []:
                agent = player.get("agent")
                if isinstance(agent, str) and agent:
                    agents.add(agent)
                hero = player.get("hero")
                if isinstance(hero, str) and hero:
                    heroes.add(hero)
                champion = player.get("champion")
                role = player.get("role")
                if isinstance(champion, str) and champion and role in by_role:
                    by_role[role].add(champion)

    ASSETS["val_agents"] = sorted(agents)
    ASSETS["dota_heroes"] = sorted(heroes)
    ASSETS_LOL_BY_ROLE.clear()
    ASSETS_LOL_BY_ROLE.update({role: sorted(champs) for role, champs in by_role.items()})
    logger.info(
        "Pools de picks (Liquipedia) : %d agents Valorant, %d héros Dota, champions LoL par poste %s.",
        len(agents),
        len(heroes),
        {role: len(champs) for role, champs in by_role.items()},
    )


def _load_teams_by_game(session: Session) -> dict[str, list[str]]:
    """Associe chaque jeu à ses équipes via les matchs existants (catalog)."""
    rows = session.execute(
        select(Match.game_id, Match.team_a_id, Match.team_b_id).where(~Match.id.like(f"{MATCH_PREFIX}%"))
    ).all()
    by_game: dict[str, set[str]] = {}
    for game_id, a, b in rows:
        by_game.setdefault(game_id, set()).update((a, b))
    return {g: sorted(teams) for g, teams in by_game.items()}


def _load_rosters(session: Session) -> dict[str, list[dict]]:
    """Roster réel (ingéré de Liquipedia) par équipe : 5 premiers joueurs."""
    rows = session.execute(
        select(Player.team_id, Player.name, Player.country_code).order_by(
            Player.team_id, Player.sort_order
        )
    ).all()
    by_team: dict[str, list[dict]] = {}
    for team_id, name, country_code in rows:
        bucket = by_team.setdefault(team_id, [])
        if len(bucket) < ROSTER_SIZE:
            bucket.append({"name": name, "country_code": country_code})
    return by_team


def _purge_seed(session: Session) -> None:
    """Supprime toutes les entités `seed-*` (matchs, pronos, groupes, users)."""
    session.execute(delete(Prediction).where(Prediction.match_id.like(f"{MATCH_PREFIX}%")))
    session.execute(delete(Prediction).where(Prediction.user_id.like(f"{USER_PREFIX}%")))
    session.execute(delete(GroupMembership).where(GroupMembership.group_id.like(f"{GROUP_PREFIX}%")))
    session.execute(delete(GroupMembership).where(GroupMembership.user_id.like(f"{USER_PREFIX}%")))
    session.execute(delete(Group).where(Group.id.like(f"{GROUP_PREFIX}%")))
    session.execute(delete(UserPreferences).where(UserPreferences.user_id.like(f"{USER_PREFIX}%")))
    session.execute(delete(User).where(User.id.like(f"{USER_PREFIX}%")))
    session.execute(delete(Match).where(Match.id.like(f"{MATCH_PREFIX}%")))


def _upsert_match(session: Session, payload: dict) -> None:
    existing = session.get(Match, str(payload["id"]))
    if existing is None:
        session.add(Match(**payload))
        return
    for key, value in payload.items():
        setattr(existing, key, value)


async def _run_scoring() -> int:
    """Score les pronos des matchs `done` (barème + streak officiels)."""
    from app.core.db import SessionLocal
    from app.services.scoring import score_finished_matches

    async with SessionLocal() as session:
        return await score_finished_matches(session)


def _score_finished() -> int:
    """Exécute le scoring async sur un SelectorEventLoop.

    Le moteur async de l'API utilise psycopg async, incompatible avec le
    ProactorEventLoop par défaut de Windows : on force un SelectorEventLoop.
    """
    loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
    try:
        return loop.run_until_complete(_run_scoring())
    finally:
        loop.close()


def seed_demo(
    *,
    start: date,
    end: date,
    user_count: int,
    replace: bool,
    rng_seed: int,
) -> dict[str, int]:
    settings = get_settings()
    tz = ZoneInfo(settings.display_tz)
    now = datetime.now(timezone.utc)
    rng = random.Random(rng_seed)

    engine = create_engine(settings.database_url, pool_pre_ping=True)
    session_local = sessionmaker(engine)

    with session_local() as session:
        if replace:
            _purge_seed(session)
            session.flush()

        teams_by_game = _load_teams_by_game(session)
        if not teams_by_game:
            raise ValueError("Catalog vide : lance d'abord l'ingestion (teams/matches).")
        rosters = _load_rosters(session)
        # Pools de picks (agents/champions) dérivés des vrais matchs ingérés.
        _load_pick_pools(session)

        matches = build_matches(teams_by_game, rosters, start=start, end=end, now=now, tz=tz, rng=rng)
        for payload in matches:
            _upsert_match(session, payload)

        users = build_users(user_count, rng)
        session.add_all(users)
        session.add_all([UserPreferences(user_id=u.id, onboarded=True) for u in users])
        # `Prediction` n'a pas de relationship() vers `User` (FK colonne seule) :
        # l'unit-of-work n'ordonne pas users avant pronos → flush explicite.
        session.flush()

        predictions = build_predictions(users, matches, rng)
        session.add_all(predictions)

        groups = build_groups(users, teams_by_game, rng)
        for group, member_ids in groups:
            session.add(group)
            session.add_all([GroupMembership(group_id=group.id, user_id=uid) for uid in member_ids])

        session.commit()

    scored = _score_finished()

    status_counts: dict[str, int] = {}
    for m in matches:
        status_counts[m["status"]] = status_counts.get(m["status"], 0) + 1

    stats = {
        "matches": len(matches),
        "done": status_counts.get("done", 0),
        "live": status_counts.get("live", 0),
        "upcoming": status_counts.get("upcoming", 0),
        "users": len(users),
        "predictions": len(predictions),
        "groups": len(groups),
        "scored": scored,
    }
    logger.info(
        "Seed démo terminé : %(matches)d matchs (%(done)d done / %(live)d live / "
        "%(upcoming)d upcoming), %(users)d users, %(predictions)d pronos "
        "(%(scored)d scorés), %(groups)d groupes.",
        stats,
    )
    return stats


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed de démo complet (matchs + communauté)")
    parser.add_argument("--start-date", type=date.fromisoformat, default=DEFAULT_START_DATE, help="Premier jour de matchs (YYYY-MM-DD)")
    parser.add_argument("--end-date", type=date.fromisoformat, default=DEFAULT_END_DATE, help="Dernier jour de matchs (YYYY-MM-DD)")
    parser.add_argument("--users", type=int, default=DEFAULT_USER_COUNT, help="Nombre de pronostiqueurs à créer")
    parser.add_argument("--seed", type=int, default=DEFAULT_RNG_SEED, help="Graine RNG (reproductibilité)")
    parser.add_argument("--no-replace", dest="replace", action="store_false", help="Ne purge pas les données seed existantes avant d'insérer")
    parser.set_defaults(replace=True)
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    if args.end_date < args.start_date:
        parser.error("--end-date doit être >= --start-date")
    if args.users < 1:
        parser.error("--users doit être >= 1")

    seed_demo(
        start=args.start_date,
        end=args.end_date,
        user_count=args.users,
        replace=args.replace,
        rng_seed=args.seed,
    )


if __name__ == "__main__":
    main()
