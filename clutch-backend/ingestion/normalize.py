"""Normalisation LPDB → modèle commun (= forme exacte du contrat front).

Règles d'or :
- AUCUNE donnée inventée : champs optionnels omis si la source ne les
  fournit pas (`viewers` n'existe pas côté LPDB → toujours None).
- Heures normalisées en UTC (stockage) — la conversion d'affichage vers
  DISPLAY_TZ appartient à l'API.
- Best effort documenté : tag d'équipe via teamtemplate (shortname), sinon
  dérivé du nom ; pays via la table COUNTRY_TO_ISO, sinon "EU"/"XX".
"""

import re
from datetime import datetime, timezone
from typing import Any

# --- Catalogue des jeux : données de CONTRAT (front), pas Liquipedia --------
# Copie de GAMES/GAME_ORDER du front (src/api/mocks/catalog.ts).

GAME_CATALOG: list[dict[str, Any]] = [
    {"id": "val", "name": "Valorant", "short": "Valorant", "tag": "VAL", "sort_order": 0},
    {"id": "lol", "name": "League of Legends", "short": "LoL", "tag": "LOL", "sort_order": 1},
    {"id": "cs2", "name": "Counter-Strike 2", "short": "CS2", "tag": "CS2", "sort_order": 2},
    {"id": "dota", "name": "Dota 2", "short": "Dota 2", "tag": "DOTA", "sort_order": 3},
    {"id": "rl", "name": "Rocket League", "short": "Rocket L.", "tag": "RL", "sort_order": 4},
    {"id": "ow", "name": "Overwatch 2", "short": "Overwatch", "tag": "OW", "sort_order": 5},
]

# GameId front → wiki Liquipedia
WIKI_BY_GAME: dict[str, str] = {
    "val": "valorant",
    "lol": "leagueoflegends",
    "cs2": "counterstrike",
    "dota": "dota2",
    "rl": "rocketleague",
    "ow": "overwatch",
}
GAME_BY_WIKI: dict[str, str] = {wiki: game for game, wiki in WIKI_BY_GAME.items()}

# --- Phases : libellés FR comme dans les fixtures du front -------------------

PHASE_FR: dict[str, str] = {
    "group stage": "Phase de groupes",
    "groups": "Phase de groupes",
    "group": "Phase de groupes",
    "play-in": "Play-in",
    "playoffs": "Phase finale",
    "round of 16": "Huitième de finale",
    "quarterfinals": "Quart de finale",
    "quarterfinal": "Quart de finale",
    "semifinals": "Demi-finale",
    "semifinal": "Demi-finale",
    "third place match": "Petite finale",
    "final": "Finale",
    "finals": "Finale",
    "grand final": "Grande Finale",
    "grand finals": "Grande Finale",
}

# --- Pays : nom Liquipedia → ISO 3166-1 alpha-2 ------------------------------
# Couvre les nations courantes de l'esport ; "Europe" → "EU" comme le front.

COUNTRY_TO_ISO: dict[str, str] = {
    "france": "FR", "germany": "DE", "spain": "ES", "italy": "IT", "portugal": "PT",
    "united kingdom": "GB", "ireland": "IE", "netherlands": "NL", "belgium": "BE",
    "sweden": "SE", "denmark": "DK", "norway": "NO", "finland": "FI", "iceland": "IS",
    "poland": "PL", "czech republic": "CZ", "czechia": "CZ", "slovakia": "SK",
    "austria": "AT", "switzerland": "CH", "hungary": "HU", "romania": "RO",
    "bulgaria": "BG", "greece": "GR", "croatia": "HR", "serbia": "RS",
    "ukraine": "UA", "russia": "RU", "belarus": "BY", "turkey": "TR",
    "kazakhstan": "KZ", "armenia": "AM", "georgia": "GE",
    "united states": "US", "canada": "CA", "mexico": "MX", "brazil": "BR",
    "argentina": "AR", "chile": "CL", "peru": "PE", "colombia": "CO",
    "south korea": "KR", "korea": "KR", "china": "CN", "japan": "JP",
    "taiwan": "TW", "hong kong": "HK", "mongolia": "MN",
    "vietnam": "VN", "thailand": "TH", "indonesia": "ID", "malaysia": "MY",
    "singapore": "SG", "philippines": "PH", "india": "IN", "pakistan": "PK",
    "saudi arabia": "SA", "united arab emirates": "AE", "qatar": "QA",
    "kuwait": "KW", "bahrain": "BH", "jordan": "JO", "israel": "IL",
    "egypt": "EG", "morocco": "MA", "algeria": "DZ", "tunisia": "TN",
    "south africa": "ZA", "australia": "AU", "new zealand": "NZ",
    "europe": "EU",
}


def slugify(value: str) -> str:
    """Identifiant stable et URL-safe à partir d'un nom/template Liquipedia."""
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "unknown"


def translate_phase(section: str | None, fallback: str | None = None) -> str:
    """Section LPDB (EN) → libellé FR du front ; sinon valeur source telle quelle."""
    if section and section.strip():
        cleaned = section.strip()
        lowered = cleaned.lower()
        if lowered in PHASE_FR:
            return PHASE_FR[lowered]
        # "Group A" / "Group B"… → "Groupe A"
        group = re.fullmatch(r"group\s+(\w+)", lowered)
        if group:
            return f"Groupe {group.group(1).upper()}"
        return cleaned
    if fallback and fallback.strip():
        return fallback.strip()
    return "Tournoi"


def country_to_iso(country: str | None, region: str | None = None) -> str:
    """Nom de pays LPDB → ISO alpha-2. Best effort : Europe → EU, inconnu → XX."""
    if country and country.strip().lower() in COUNTRY_TO_ISO:
        return COUNTRY_TO_ISO[country.strip().lower()]
    if region and region.strip().lower() in ("europe", "eu", "cis"):
        return "EU"
    return "XX"


def derive_tag(name: str) -> str:
    """Tag de secours dérivé du nom (utilisé tant que le shortname Liquipedia
    n'a pas été récupéré via /teamtemplate). Ex. "Team Falcons" → "TF"."""
    words = [w for w in re.split(r"[^A-Za-z0-9]+", name) if w]
    if not words:
        return "??"
    if len(words) == 1:
        return words[0][:4].upper()
    return "".join(w[0] for w in words[:4]).upper()


def to_best_of(bestof: int | None, games_count: int) -> str:
    """LPDB bestof (int) → enum front "BO1"|"BO3"|"BO5".

    Best effort si absent : déduit du nombre de manches listées, défaut BO3
    (les BO de l'EWC sont 1/3/5 ; valeur loguée par l'appelant si dérivée).
    """
    if bestof in (1, 3, 5):
        return f"BO{bestof}"
    if games_count in (1, 3, 5):
        return f"BO{games_count}"
    return "BO3"


def _as_int(value: Any) -> int | None:
    """Scores LPDB : int, str, ou sentinelles (-1, "") → None."""
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def _ensure_utc(value: Any) -> datetime | None:
    """LPDB renvoie des datetimes naïfs réputés UTC → aware UTC."""
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str) and value:
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return None


def compute_status(finished: Any, start_utc: datetime | None, now: datetime) -> str:
    """Statut front : done si terminé, live si commencé, sinon upcoming."""
    if str(finished) == "1":
        return "done"
    if start_utc and start_utc <= now:
        return "live"
    return "upcoming"


def normalize_opponent(opponent: dict[str, Any]) -> dict[str, str] | None:
    """match2opponents[i] → équipe du contrat (id, name, tag provisoire).

    None si l'opposant n'est pas encore connu (placeholder Liquipedia) :
    le match sera ingéré quand le bracket sera publié.
    """
    name = (opponent.get("name") or "").replace("_", " ").strip()
    template = (opponent.get("template") or "").strip()
    if template.lower() == "tbd" or name.lower() == "tbd":
        return None
    if not name and not template:
        return None
    display = name or template
    return {
        "id": slugify(template or name),
        "name": display,
        "tag": derive_tag(display),
        "template": template,
    }


def normalize_maps(games: list[Any] | None, match_status: str) -> list[dict[str, Any]] | None:
    """match2games → MapScore[] du front. Seules les cartes jouées/en cours
    sortent ; la carte en cours (match live) porte live=true, pas de winner."""
    if not games:
        return None

    maps: list[dict[str, Any]] = []
    live_marked = False
    for index, raw in enumerate(games):
        if not isinstance(raw, dict):
            continue
        scores = raw.get("scores") or []
        score_a = _as_int(scores[0]) if len(scores) > 0 else None
        score_b = _as_int(scores[1]) if len(scores) > 1 else None
        winner = str(raw.get("winner") or "")

        if winner in ("1", "2"):
            entry: dict[str, Any] = {
                "name": str(raw.get("map") or f"Carte {index + 1}"),
                "scoreA": score_a if score_a is not None else 0,
                "scoreB": score_b if score_b is not None else 0,
                "winner": "a" if winner == "1" else "b",
            }
            maps.append(entry)
        elif match_status == "live" and not live_marked and score_a is not None and score_b is not None:
            # Première carte non décidée avec un score : c'est la carte en cours.
            maps.append(
                {
                    "name": str(raw.get("map") or f"Carte {index + 1}"),
                    "scoreA": score_a,
                    "scoreB": score_b,
                    "live": True,
                }
            )
            live_marked = True

    return maps or None


def current_map_label(maps: list[dict[str, Any]] | None) -> str | None:
    """Libellé de la carte en cours, même format que le front : "Split · 11–9"."""
    if not maps:
        return None
    for entry in maps:
        if entry.get("live"):
            return f"{entry['name']} · {entry['scoreA']}–{entry['scoreB']}"
    return None


def normalize_match(record: dict[str, Any], game_id: str, now: datetime) -> dict[str, Any] | None:
    """Enregistrement LPDB /match → dict prêt pour l'upsert ORM.

    Retourne None si l'enregistrement est inexploitable (équipes manquantes,
    pas de date) — jamais de données fabriquées pour combler.
    """
    opponents = record.get("match2opponents") or []
    if len(opponents) < 2:
        return None
    team_a = normalize_opponent(opponents[0])
    team_b = normalize_opponent(opponents[1])
    if not team_a or not team_b:
        return None

    start_utc = _ensure_utc(record.get("date"))
    if start_utc is None:
        return None

    match2id = str(record.get("match2id") or "").strip()
    if not match2id:
        return None

    status = compute_status(record.get("finished"), start_utc, now)
    games = record.get("match2games") or []
    maps = normalize_maps(games, status)

    score_a = _as_int(opponents[0].get("score"))
    score_b = _as_int(opponents[1].get("score"))
    if status == "upcoming":
        score_a = score_b = None

    return {
        "id": f"{game_id}_{slugify(match2id)}",
        "game_id": game_id,
        "team_a": team_a,
        "team_b": team_b,
        "status": status,
        "phase": translate_phase(record.get("section"), record.get("tickername")),
        "best_of": to_best_of(record.get("bestof"), len(games)),
        "start_time_utc": start_utc,
        "score_a": score_a,
        "score_b": score_b,
        "maps": maps,
        "current_map_label": current_map_label(maps) if status == "live" else None,
        # LPDB ne fournit pas d'audience : champ optionnel, jamais inventé.
        "viewers": None,
        "extradata": {
            "wiki": record.get("wiki"),
            "pagename": record.get("pagename"),
            "tournament": record.get("tournament"),
            "lpdb_status": record.get("status"),
            "raw_section": record.get("section"),
        },
    }
