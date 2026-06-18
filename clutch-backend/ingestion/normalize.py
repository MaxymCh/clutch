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

# Chemins relatifs au dossier public du front (clutch-frontend/public/games).
GAME_CATALOG: list[dict[str, Any]] = [
    {"id": "val", "name": "Valorant", "short": "Valorant", "tag": "VAL", "sort_order": 0, "bg_url": "/games/bg/val.jpg", "logo_url": "/games/icons/val.svg", "full_logo_url": "/games/full-logo/val.svg"},
    {"id": "lol", "name": "League of Legends", "short": "LoL", "tag": "LOL", "sort_order": 1, "bg_url": "/games/bg/lol.jpg", "logo_url": "/games/icons/lol.svg", "full_logo_url": "/games/full-logo/lol.png"},
    {"id": "cs2", "name": "Counter-Strike 2", "short": "CS2", "tag": "CS2", "sort_order": 2, "bg_url": "/games/bg/cs2.jpg", "logo_url": "/games/icons/cs2.svg", "full_logo_url": "/games/full-logo/cs2.svg"},
    {"id": "dota", "name": "Dota 2", "short": "Dota 2", "tag": "DOTA", "sort_order": 3, "bg_url": "/games/bg/dota.jpg", "logo_url": "/games/icons/dota.svg", "full_logo_url": "/games/full-logo/dota.svg"},
    {"id": "rl", "name": "Rocket League", "short": "Rocket L.", "tag": "RL", "sort_order": 4, "bg_url": "/games/bg/rl.jpg", "logo_url": "/games/icons/rl.svg", "full_logo_url": "/games/full-logo/rl.png"},
    {"id": "ow", "name": "Overwatch 2", "short": "Overwatch", "tag": "OW", "sort_order": 5, "bg_url": "/games/bg/ow.jpg", "logo_url": "/games/icons/ow.svg", "full_logo_url": "/games/full-logo/ow.svg"},
    {"id": "apex", "name": "Apex Legends", "short": "Apex", "tag": "APEX", "sort_order": 6, "bg_url": "/games/bg/apex.jpg", "logo_url": "/games/icons/apex.svg", "full_logo_url": "/games/full-logo/apex.png"},
    {"id": "r6", "name": "Rainbow Six Siege", "short": "R6", "tag": "R6", "sort_order": 7, "bg_url": "/games/bg/r6.jpg", "logo_url": "/games/icons/r6.svg", "full_logo_url": "/games/full-logo/r6.png"},
    {"id": "pubg", "name": "PUBG Mobile", "short": "PUBG", "tag": "PUBG", "sort_order": 8, "bg_url": "/games/bg/pubg.png", "logo_url": "/games/icons/pubg-mobile.svg", "full_logo_url": "/games/full-logo/pubg-mobile.png"},
    {"id": "fn", "name": "Fortnite", "short": "Fortnite", "tag": "FN", "sort_order": 9, "bg_url": "/games/bg/fortnite.png", "logo_url": "/games/icons/fortnite.svg", "full_logo_url": "/games/full-logo/fortnite.png"},
    {"id": "ff", "name": "Free Fire", "short": "Free Fire", "tag": "FF", "sort_order": 10, "bg_url": "/games/bg/free-fire.png", "logo_url": "/games/icons/free-fire.svg", "full_logo_url": "/games/full-logo/free-fire.svg"},
    {"id": "mlbb", "name": "Mobile Legends", "short": "MLBB", "tag": "MLBB", "sort_order": 11, "bg_url": "/games/bg/mobile-legends.png", "logo_url": "/games/icons/mobile-legends.svg", "full_logo_url": "/games/full-logo/mobile-legends.png"},
    {"id": "hok", "name": "Honor of Kings", "short": "HoK", "tag": "HOK", "sort_order": 12, "bg_url": "/games/bg/honor-of-king.png", "logo_url": "/games/icons/honor-of-king.svg", "full_logo_url": "/games/full-logo/honor-of-king.png"},
    {"id": "sf6", "name": "Street Fighter 6", "short": "SF6", "tag": "SF6", "sort_order": 13, "bg_url": "/games/bg/street-fighter.jpg", "logo_url": "/games/icons/street-fighter.svg", "full_logo_url": "/games/full-logo/street-fighter.svg"},
    {"id": "tk8", "name": "Tekken 8", "short": "Tekken 8", "tag": "TK8", "sort_order": 14, "bg_url": "/games/bg/tekken-8.jpg", "logo_url": "/games/icons/tekken-8.svg", "full_logo_url": "/games/full-logo/tekken-8.svg"},
    {"id": "bo7", "name": "Call of Duty: BO7", "short": "CoD BO7", "tag": "COD", "sort_order": 15, "bg_url": "/games/bg/bo7.png", "logo_url": "/games/icons/bo7.svg", "full_logo_url": "/games/full-logo/bo7.svg"},
    {"id": "tft", "name": "Teamfight Tactics", "short": "TFT", "tag": "TFT", "sort_order": 16, "bg_url": "/games/bg/tt.png", "logo_url": "/games/icons/tft.svg", "full_logo_url": "/games/full-logo/tft.svg"},
]

# GameId front → wiki Liquipedia
WIKI_BY_GAME: dict[str, str] = {
    "val": "valorant",
    "lol": "leagueoflegends",
    "cs2": "counterstrike",
    "dota": "dota2",
    "rl": "rocketleague",
    "ow": "overwatch",
    "apex": "apexlegends",
    "r6": "rainbowsix",
    "pubg": "pubg",
    "fn": "fortnite",
    "ff": "freefire",
    "mlbb": "mobilelegends",
    "hok": "honorofkings",
    "sf6": "fighters",
    # Tekken 8 n'a pas de wiki LPDB dédié : tournois EWC sur le wiki fighters.
    "tk8": "fighters",
    "bo7": "callofduty",
    # Slug LPDB = « tft », pas « teamfighttactics » (404 sur /tournament).
    "tft": "tft",
}
GAME_BY_WIKI: dict[str, str] = {wiki: game for game, wiki in WIKI_BY_GAME.items()}
BR_GAMES: frozenset[str] = frozenset({"pubg", "fn", "ff", "apex"})
MOBA_PARTIE_GAMES: frozenset[str] = frozenset({"mlbb", "hok", "lol", "dota"})
MOBA_DRAFT_GAMES: frozenset[str] = frozenset({"mlbb", "hok"})
GAMES_BY_WIKI: dict[str, list[str]] = {}
for _game_id, _wiki in WIKI_BY_GAME.items():
    GAMES_BY_WIKI.setdefault(_wiki, []).append(_game_id)

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
    """Statut front : done si terminé, upcoming sinon (le live est calculé côté front)."""
    if str(finished) == "1":
        return "done"
    return "upcoming"


def normalize_opponent(opponent: dict[str, Any]) -> dict[str, Any] | None:
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
    teamtemplate = opponent.get("teamtemplate")
    logo_url = teamtemplate.get("imageurl") if isinstance(teamtemplate, dict) else None
    return {
        "id": slugify(template or name),
        "name": display,
        "tag": derive_tag(display),
        "template": template,
        "logo_url": logo_url,
    }


def _round_or_none(value: Any) -> float | int | None:
    """Stat numérique LPDB → int si entier, sinon arrondi 1 décimale ; None sinon."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return int(number) if number.is_integer() else round(number, 1)


# Postes LoL LPDB (minuscules) → libellé du front + ordre d'affichage.
LOL_ROLE_LABELS: dict[str, str] = {
    "top": "Top",
    "jungle": "Jungle",
    "mid": "Mid",
    "middle": "Mid",
    "bottom": "Bot",
    "bot": "Bot",
    "adc": "Bot",
    "support": "Support",
}
LOL_ROLE_ORDER: dict[str, int] = {"Top": 0, "Jungle": 1, "Mid": 2, "Bot": 3, "Support": 4}


def normalize_participants(
    raw_game: dict[str, Any], player_country: dict[str, str], game_id: str = ""
) -> list[dict[str, Any]] | None:
    """match2games[i].participants → scoreboard par joueur du front.

    Clé LPDB "<opp>_<player>" : opp 1 = équipe A, opp 2 = équipe B. On capte
    les stats génériques (K/D/A) + les spécificités par jeu quand elles existent :
    - Valorant : ACS, ADR, HS, agent ;
    - League of Legends : champion (`character`), poste (`role`) ;
    - Dota 2 : héros (`character`), GPM, XPM, last hits, net worth, niveau.
    `player_country` (nom canonique → ISO) ajoute le drapeau.
    """
    participants = raw_game.get("participants")
    if not isinstance(participants, dict) or not participants:
        return None

    players: list[dict[str, Any]] = []
    for key, p in participants.items():
        if not isinstance(p, dict):
            continue
        side = "a" if str(key).startswith("1_") else "b" if str(key).startswith("2_") else None
        if side is None:
            continue
        canonical = str(p.get("player") or p.get("displayName") or "").strip()
        name = str(p.get("displayName") or p.get("player") or "").strip()
        if not name:
            continue
        entry: dict[str, Any] = {
            "side": side,
            "name": name,
            "countryCode": player_country.get(canonical.lower(), "XX"),
            "kills": int(_round_or_none(p.get("kills")) or 0),
            "deaths": int(_round_or_none(p.get("deaths")) or 0),
            "assists": int(_round_or_none(p.get("assists")) or 0),
        }
        # Spécifiques par jeu : omis si absents (jamais de valeur fabriquée).
        acs = _round_or_none(p.get("acs"))
        if acs is not None:
            entry["acs"] = acs
        adr = _round_or_none(p.get("adr"))
        if adr is not None:
            entry["adr"] = adr
        hs = _round_or_none(p.get("hs"))
        if hs is not None:
            entry["hs"] = hs
        agent = p.get("agent")
        if isinstance(agent, str) and agent.strip():
            entry["agent"] = agent.strip()
        # "character" = champion (LoL) ou héros (Dota 2) ; MLBB utilise "champion".
        character = p.get("character") or p.get("champion")
        if isinstance(character, str) and character.strip():
            entry["hero" if game_id == "dota" else "champion"] = character.strip()
        role = p.get("role")
        if isinstance(role, str) and role.strip():
            entry["role"] = LOL_ROLE_LABELS.get(role.strip().lower(), role.strip().title())
        # Dota 2 : économie/farm par joueur.
        for src, dst in (("gpm", "gpm"), ("xpm", "xpm"), ("lasthits", "lasthits"), ("gold", "networth"), ("level", "level")):
            value = _round_or_none(p.get(src))
            if value is not None:
                entry[dst] = value
        players.append(entry)

    if not players:
        return None
    # Tri : équipe A puis B. À l'intérieur : ordre des postes (LoL), net worth
    # décroissant (Dota), sinon ACS/kills décroissant.
    if game_id == "lol" and any("role" in e for e in players):
        players.sort(key=lambda e: (e["side"], LOL_ROLE_ORDER.get(e.get("role", ""), 99)))
    elif game_id == "dota":
        players.sort(key=lambda e: (e["side"], -(e.get("networth") or e.get("gpm") or e["kills"])))
    else:
        players.sort(key=lambda e: (e["side"], -(e.get("acs") or e["kills"])))
    return players


def _extract_game_extras(extra: Any, raw: dict, game_id: str) -> dict[str, Any]:
    """Données spécifiques au jeu depuis extradata + champs top-level du game."""
    result: dict[str, Any] = {}

    if isinstance(extra, dict):
        if game_id == "dota":
            ha = [extra[f"team1hero{i}"] for i in range(1, 6) if extra.get(f"team1hero{i}")]
            hb = [extra[f"team2hero{i}"] for i in range(1, 6) if extra.get(f"team2hero{i}")]
            ba = [extra[f"team1ban{i}"] for i in range(1, 8) if extra.get(f"team1ban{i}")]
            bb = [extra[f"team2ban{i}"] for i in range(1, 8) if extra.get(f"team2ban{i}")]
            if ha:
                result["heroesA"] = ha
            if hb:
                result["heroesB"] = hb
            if ba:
                result["bansA"] = ba
            if bb:
                result["bansB"] = bb
            side_a = str(extra.get("team1side") or "").lower()
            side_b = str(extra.get("team2side") or "").lower()
            if side_a:
                result["sideA"] = side_a
            if side_b:
                result["sideB"] = side_b

        elif game_id in MOBA_DRAFT_GAMES:
            ca = [extra[f"team1champion{i}"] for i in range(1, 6) if extra.get(f"team1champion{i}")]
            cb = [extra[f"team2champion{i}"] for i in range(1, 6) if extra.get(f"team2champion{i}")]
            ba = [extra[f"team1ban{i}"] for i in range(1, 6) if extra.get(f"team1ban{i}")]
            bb = [extra[f"team2ban{i}"] for i in range(1, 6) if extra.get(f"team2ban{i}")]
            if ca:
                result["heroesA"] = ca
            if cb:
                result["heroesB"] = cb
            if ba:
                result["bansA"] = ba
            if bb:
                result["bansB"] = bb
            side_a = str(extra.get("team1side") or "").lower()
            side_b = str(extra.get("team2side") or "").lower()
            if side_a:
                result["sideA"] = side_a
            if side_b:
                result["sideB"] = side_b

        elif game_id == "cs2":
            t1halfs = extra.get("t1halfs")
            t1sides = extra.get("t1sides")
            t2halfs = extra.get("t2halfs")
            t2sides = extra.get("t2sides")
            if isinstance(t1halfs, dict) and isinstance(t1sides, dict):
                result["halvesA"] = [
                    {"side": str(t1sides.get(k, "?")), "score": int(t1halfs[k])}
                    for k in sorted(t1halfs, key=lambda x: int(x))
                ]
            if isinstance(t2halfs, dict) and isinstance(t2sides, dict):
                result["halvesB"] = [
                    {"side": str(t2sides.get(k, "?")), "score": int(t2halfs[k])}
                    for k in sorted(t2halfs, key=lambda x: int(x))
                ]

        elif game_id == "ow":
            bans_a = [extra[f"team1ban{i}"] for i in range(1, 5) if extra.get(f"team1ban{i}")]
            bans_b = [extra[f"team2ban{i}"] for i in range(1, 5) if extra.get(f"team2ban{i}")]
            if bans_a:
                result["bansA"] = bans_a
            if bans_b:
                result["bansB"] = bans_b

        elif game_id == "r6":
            t1halfs = extra.get("t1halfs")   # {"atk": "1", "def": "1"}
            t2halfs = extra.get("t2halfs")   # {"atk": "5", "def": "2"}
            t1firstside_raw = extra.get("t1firstside")  # {"rt": "def"}
            first_side = None
            if isinstance(t1firstside_raw, dict):
                first_side = str(t1firstside_raw.get("rt") or "").lower() or None
            if isinstance(t1halfs, dict) and isinstance(t2halfs, dict):
                sides = (["atk", "def"] if first_side == "atk"
                         else ["def", "atk"] if first_side == "def"
                         else ["atk", "def"])
                result["halvesA"] = [{"side": s, "score": int(t1halfs.get(s) or 0)} for s in sides if s in t1halfs]
                result["halvesB"] = [{"side": sides[1] if i == 0 else sides[0], "score": int(t2halfs.get(s) or 0)}
                                     for i, s in enumerate(sides) if s in t2halfs]
            # Bans d'opérateurs
            t1bans = extra.get("t1bans")
            t1bantypes = extra.get("t1bantypes")
            t2bans = extra.get("t2bans")
            t2bantypes = extra.get("t2bantypes")
            if isinstance(t1bans, dict) and isinstance(t1bantypes, dict):
                bans_a = [
                    {"name": str(t1bans[k]), "type": str(t1bantypes.get(k, "?"))}
                    for k in sorted(t1bans, key=lambda x: int(x))
                    if str(t1bans.get(k) or "").strip()
                ]
                if bans_a:
                    result["opBansA"] = bans_a
            if isinstance(t2bans, dict) and isinstance(t2bantypes, dict):
                bans_b = [
                    {"name": str(t2bans[k]), "type": str(t2bantypes.get(k, "?"))}
                    for k in sorted(t2bans, key=lambda x: int(x))
                    if str(t2bans.get(k) or "").strip()
                ]
                if bans_b:
                    result["opBansB"] = bans_b

    # Champs top-level génériques
    mode = str(raw.get("mode") or "").strip()
    if mode:
        result["mode"] = mode
    game_length = str(raw.get("length") or "").strip()
    if game_length:
        result["length"] = game_length
    vod = str(raw.get("vod") or "").strip()
    if vod:
        result["vod"] = vod

    return result


def _map_label(game_id: str, map_name: str, index: int) -> str:
    """Libellé de carte/partie : MLBB/LoL/Dota → « Partie N », sinon « Carte N »."""
    if map_name.strip():
        return map_name.strip()
    unit = "Partie" if game_id in MOBA_PARTIE_GAMES else "Carte"
    return f"{unit} {index + 1}"


def _mlbb_champions_from_opponents(game_opps: list[Any], side_idx: int) -> list[str]:
    if side_idx >= len(game_opps) or not isinstance(game_opps[side_idx], dict):
        return []
    champs: list[str] = []
    for slot in game_opps[side_idx].get("players") or []:
        if isinstance(slot, dict) and slot.get("champion"):
            champs.append(str(slot["champion"]).strip())
    return champs


def _mlbb_champions_from_extradata(extra: dict[str, Any], team_num: int) -> list[str]:
    return [
        str(extra[f"team{team_num}champion{i}"]).strip()
        for i in range(1, 6)
        if extra.get(f"team{team_num}champion{i}")
    ]


def normalize_mlbb_players(
    raw_game: dict[str, Any],
    opp_a: dict[str, Any],
    opp_b: dict[str, Any],
    player_country: dict[str, str],
) -> list[dict[str, Any]] | None:
    """match2games[i] MLBB → scoreboard avec champion par joueur (sans stats LPDB)."""
    game_opps = raw_game.get("opponents") or []
    extra = raw_game.get("extradata") if isinstance(raw_game.get("extradata"), dict) else {}
    players: list[dict[str, Any]] = []

    for side_idx, (side, opp) in enumerate([("a", opp_a), ("b", opp_b)]):
        champs = _mlbb_champions_from_opponents(game_opps, side_idx)
        if not champs and extra:
            champs = _mlbb_champions_from_extradata(extra, side_idx + 1)
        roster = opp.get("match2players") or []
        for i, champ in enumerate(champs[:5]):
            rp = roster[i] if i < len(roster) and isinstance(roster[i], dict) else {}
            canonical = str(rp.get("name") or rp.get("displayname") or "").strip().lower()
            name = str(rp.get("displayname") or rp.get("name") or champ).strip()
            players.append({
                "side": side,
                "name": name,
                "countryCode": player_country.get(canonical, "XX") if canonical else "XX",
                "kills": 0,
                "deaths": 0,
                "assists": 0,
                "champion": champ,
            })

    return players or None


def _build_team_lookup(opponents: list[Any]) -> dict[int, dict[str, Any]]:
    """Index match2opponents → {name, tag, logoUrl} pour les jeux BR."""
    result: dict[int, dict[str, Any]] = {}
    for i, opp in enumerate(opponents):
        if not isinstance(opp, dict):
            continue
        teamtemplate = opp.get("teamtemplate") or {}
        name = (opp.get("name") or "").replace("_", " ").strip()
        template = (opp.get("template") or "").strip()
        display = name or template
        logo_url = teamtemplate.get("imageurl") if isinstance(teamtemplate, dict) else None
        tag_val = (teamtemplate.get("shortname") if isinstance(teamtemplate, dict) else None) or derive_tag(display)
        result[i] = {"name": display, "tag": tag_val, "logoUrl": logo_url}
    return result


def _build_br_overall_standings(
    opponents: list[Any],
    extradata: Any,
    games: list[Any] | None = None,
) -> list[dict[str, Any]]:
    """Classement général BR.

    Stratégie 1 (prioritaire) : agrégation depuis match2games[i].opponents —
    la même source que le détail par partie, donc toujours cohérente.
    Stratégie 2 (fallback) : extradata.placementinfo, si les parties ne sont
    pas renseignées (ex. données partielles LPDB).
    Retourne [] si aucune donnée n'est disponible (match à venir).
    """
    lookup = _build_team_lookup(opponents)

    # --- Stratégie 1 : agrégation des parties ---
    if games:
        agg: dict[int, dict[str, Any]] = {
            i: {
                "name": t["name"],
                "tag": t["tag"],
                "logoUrl": t.get("logoUrl"),
                "totalPoints": 0,
                "killPoints": 0,
                "placementPoints": 0,
            }
            for i, t in lookup.items()
            if t.get("name") and t["name"].lower() != "tbd"
        }
        name_to_idx = {t["name"]: i for i, t in lookup.items()}
        games_with_data = 0

        for raw in games:
            if not isinstance(raw, dict):
                continue
            game_opps = raw.get("opponents") or []
            if not game_opps:
                continue
            game_standings = _build_br_game_standings(game_opps, lookup)
            if not game_standings:
                continue
            games_with_data += 1
            for entry in game_standings:
                idx = name_to_idx.get(entry["name"])
                if idx is not None and idx in agg:
                    agg[idx]["totalPoints"] += entry["totalPoints"]
                    agg[idx]["killPoints"] += entry["killPoints"]
                    agg[idx]["placementPoints"] += entry["placementPoints"]

        if games_with_data > 0:
            standings = list(agg.values())
            standings.sort(key=lambda x: (-x["totalPoints"], -x["killPoints"]))
            for rank, s in enumerate(standings, 1):
                s["placement"] = rank
            return standings

    # --- Stratégie 2 : placementinfo (fallback) ---
    placementinfo: dict = {}
    if isinstance(extradata, dict):
        placementinfo = extradata.get("placementinfo") or {}
    if not placementinfo:
        return []

    standings: list[dict[str, Any]] = []
    for i, opp in enumerate(opponents):
        if not isinstance(opp, dict):
            continue
        teamtemplate = opp.get("teamtemplate") or {}
        name = (opp.get("name") or "").replace("_", " ").strip()
        template = (opp.get("template") or "").strip()
        display = name or template
        if not display or display.lower() == "tbd":
            continue
        logo_url = teamtemplate.get("imageurl") if isinstance(teamtemplate, dict) else None
        tag_val = (teamtemplate.get("shortname") if isinstance(teamtemplate, dict) else None) or derive_tag(display)
        pi = placementinfo.get(str(i + 1)) or {}
        kill_pts = _as_int(pi.get("killPoints")) or 0
        place_pts = _as_int(pi.get("placementPoints")) or 0
        total = kill_pts + place_pts if (kill_pts or place_pts) else (_as_int(opp.get("score")) or 0)
        placement_lpdb = _as_int(pi.get("placement") or opp.get("placement"))
        standings.append({
            "_placement_lpdb": placement_lpdb,
            "name": display,
            "tag": tag_val,
            "logoUrl": logo_url,
            "totalPoints": total,
            "killPoints": kill_pts,
            "placementPoints": place_pts,
        })

    if any(s["_placement_lpdb"] is not None for s in standings):
        standings.sort(key=lambda x: x["_placement_lpdb"] or 999)
    else:
        standings.sort(key=lambda x: (-x["totalPoints"], -x["killPoints"]))
    for rank, s in enumerate(standings, 1):
        s["placement"] = rank
        del s["_placement_lpdb"]
    return standings


def _build_br_game_standings(
    game_opponents: list[Any], team_lookup: dict[int, dict[str, Any]]
) -> list[dict[str, Any]]:
    """match2games[i].opponents → classement d'une partie BR (index → équipe via team_lookup)."""
    standings: list[dict[str, Any]] = []
    for j, game_opp in enumerate(game_opponents):
        if not isinstance(game_opp, dict):
            continue
        team = team_lookup.get(j)
        if not team:
            continue
        breakdown = game_opp.get("scoreBreakdown") or {}
        kill_pts = _as_int(breakdown.get("killPoints")) or 0
        place_pts = _as_int(breakdown.get("placePoints")) or 0
        # Priorité : breakdown.totalPoints (y compris 0) ; sinon kill+place ; sinon opp.score
        _raw_total = breakdown.get("totalPoints")
        _parsed_total = _as_int(_raw_total) if _raw_total is not None else None
        total = (
            _parsed_total
            if _parsed_total is not None
            else (kill_pts + place_pts if (kill_pts or place_pts) else None)
                or _as_int(game_opp.get("score"))
                or 0
        )
        placement_lpdb = _as_int(game_opp.get("placement"))
        standings.append({
            "_placement_lpdb": placement_lpdb,
            "name": team["name"],
            "tag": team["tag"],
            "logoUrl": team.get("logoUrl"),
            "totalPoints": total,
            "killPoints": kill_pts,
            "placementPoints": place_pts,
        })

    if any(s["_placement_lpdb"] is not None for s in standings):
        standings.sort(key=lambda x: x["_placement_lpdb"] or 999)
    else:
        standings.sort(key=lambda x: (-x["totalPoints"], -x["killPoints"]))

    for rank, s in enumerate(standings, 1):
        s["placement"] = rank
        del s["_placement_lpdb"]

    return standings


def normalize_maps(
    games: list[Any] | None,
    match_status: str,
    player_country: dict[str, str] | None = None,
    game_id: str = "",
    br_team_lookup: dict[int, dict[str, Any]] | None = None,
    opponents: list[Any] | None = None,
    team_a_name: str | None = None,
    team_b_name: str | None = None,
) -> list[dict[str, Any]] | None:
    """match2games → MapScore[] du front. Seules les cartes jouées/en cours
    sortent ; la carte en cours (match live) porte live=true, pas de winner.
    Chaque carte embarque son scoreboard joueur (`players`) si disponible."""
    if not games:
        return None
    player_country = player_country or {}

    maps: list[dict[str, Any]] = []
    live_marked = False
    for index, raw in enumerate(games):
        if not isinstance(raw, dict):
            continue

        if str(raw.get("status") or "").lower() == "notplayed":
            continue
        if str(raw.get("resulttype") or "").lower() == "np":
            continue

        # --- Jeux Battle Royale : classement par partie ---
        if br_team_lookup is not None:
            game_opps = raw.get("opponents") or []
            if not game_opps:
                continue
            game_standings = _build_br_game_standings(game_opps, br_team_lookup)
            if not game_standings:
                continue
            entry_a = next((s for s in game_standings if s["name"] == team_a_name), None) if team_a_name else None
            entry_b = next((s for s in game_standings if s["name"] == team_b_name), None) if team_b_name else None
            if entry_a and entry_b:
                winner_br = "a" if entry_a["placement"] < entry_b["placement"] else "b"
            else:
                winner_br = "a" if entry_a else "b"
            maps.append({
                "name": str(raw.get("map") or f"Partie {index + 1}"),
                "scoreA": entry_a["totalPoints"] if entry_a else 0,
                "scoreB": entry_b["totalPoints"] if entry_b else 0,
                "winner": winner_br,
                "standings": game_standings,
            })
            continue

        # --- Jeux 1v1 standard ---
        scores = raw.get("scores") or []
        score_a = _as_int(scores[0]) if len(scores) > 0 else None
        score_b = _as_int(scores[1]) if len(scores) > 1 else None
        winner = str(raw.get("winner") or "")
        players = normalize_participants(raw, player_country, game_id)
        if game_id in MOBA_DRAFT_GAMES and opponents and len(opponents) >= 2:
            moba_players = normalize_mlbb_players(
                raw,
                opponents[0] if isinstance(opponents[0], dict) else {},
                opponents[1] if isinstance(opponents[1], dict) else {},
                player_country,
            )
            if not players and moba_players:
                players = moba_players

        extras = _extract_game_extras(raw.get("extradata"), raw, game_id)
        label = _map_label(game_id, str(raw.get("map") or ""), index)

        if winner in ("1", "2"):
            if score_a is None and score_b is None:
                score_a = 1 if winner == "1" else 0
                score_b = 1 if winner == "2" else 0
            entry: dict[str, Any] = {
                "name": label,
                "scoreA": score_a if score_a is not None else 0,
                "scoreB": score_b if score_b is not None else 0,
                "winner": "a" if winner == "1" else "b",
                **extras,
            }
            if players:
                entry["players"] = players
            maps.append(entry)
        elif match_status != "done" and not live_marked and score_a is not None and score_b is not None:
            # Première carte non décidée avec un score : c'est la carte en cours.
            entry = {
                "name": label,
                "scoreA": score_a,
                "scoreB": score_b,
                "live": True,
                **extras,
            }
            if players:
                entry["players"] = players
            maps.append(entry)
            live_marked = True

    return maps or None


# --- Streams : libellés de plateforme lisibles -------------------------------

PLATFORM_LABELS: dict[str, str] = {
    "twitch": "Twitch",
    "youtube": "YouTube",
    "trovo": "Trovo",
    "kick": "Kick",
    "afreeca": "AfreecaTV",
    "afreecatv": "AfreecaTV",
    "soop": "SOOP",
    "bilibili": "Bilibili",
    "huya": "Huya",
    "douyu": "Douyu",
    "facebook": "Facebook",
    "tiktok": "TikTok",
    "nimotv": "Nimo TV",
}


def _platform_label(key: str, url: str) -> str:
    """Plateforme lisible depuis la clé LPDB (ex. "twitch_en_1") ou l'URL."""
    base = re.split(r"[_\d]", key.lower(), maxsplit=1)[0]
    if base in PLATFORM_LABELS:
        return PLATFORM_LABELS[base]
    host = re.search(r"https?://(?:www\.)?([^/.]+)", url)
    if host and host.group(1).lower() in PLATFORM_LABELS:
        return PLATFORM_LABELS[host.group(1).lower()]
    return base.capitalize() or "Stream"


def normalize_streams(stream: Any) -> list[dict[str, str]] | None:
    """Champ LPDB `stream` (streamurls=true) → [{platform, url}] du front.

    Best effort : on ne garde que les valeurs qui sont des URLs http(s),
    dédupliquées, en conservant l'ordre source. Jamais d'URL fabriquée.
    """
    if not isinstance(stream, dict):
        return None

    streams: list[dict[str, str]] = []
    seen: set[str] = set()

    def collect(key: str, value: Any) -> None:
        if isinstance(value, str) and value.startswith(("http://", "https://")):
            if value not in seen:
                seen.add(value)
                streams.append({"platform": _platform_label(key, value), "url": value})
        elif isinstance(value, dict):
            for sub in value.values():
                collect(key, sub)
        elif isinstance(value, list):
            for sub in value:
                collect(key, sub)

    for key, value in stream.items():
        collect(str(key), value)

    return streams or None


def normalize_veto(extradata: Any) -> list[dict[str, Any]] | None:
    """extradata.mapveto LPDB → timeline veto du front [{order, type, team, map}].

    Chaque étape LPDB porte team1/team2 (l'action de chaque équipe) ou un
    `decider`. On aplatit : team1 = équipe A, team2 = équipe B, dans l'ordre.
    """
    if not isinstance(extradata, dict):
        return None
    mapveto = extradata.get("mapveto")
    if not isinstance(mapveto, dict) or not mapveto:
        return None

    steps: list[dict[str, Any]] = []
    # Clés numériques ("1","2"…) : on respecte l'ordre du veto.
    for key in sorted(mapveto, key=lambda k: int(k) if str(k).isdigit() else 0):
        step = mapveto[key]
        if not isinstance(step, dict):
            continue
        kind = str(step.get("type") or "").strip().lower()
        if kind == "decider":
            decider = str(step.get("decider") or "").strip()
            if decider:
                steps.append({"order": len(steps), "type": "decider", "team": None, "map": decider})
            continue
        if kind not in ("ban", "pick"):
            continue
        team1 = str(step.get("team1") or "").strip()
        team2 = str(step.get("team2") or "").strip()
        if team1:
            steps.append({"order": len(steps), "type": kind, "team": "a", "map": team1})
        if team2:
            steps.append({"order": len(steps), "type": kind, "team": "b", "map": team2})

    return steps or None


def player_countries(opponents: list[Any]) -> dict[str, str]:
    """Nom canonique du joueur (minuscule) → ISO, depuis match2players[].flag.

    Sert à attacher le drapeau aux lignes du scoreboard (participants), qui ne
    portent pas la nationalité.
    """
    mapping: dict[str, str] = {}
    for opponent in opponents:
        if not isinstance(opponent, dict):
            continue
        for player in opponent.get("match2players") or []:
            if not isinstance(player, dict):
                continue
            canonical = str(player.get("name") or player.get("displayname") or "").strip().lower()
            if canonical:
                mapping[canonical] = country_to_iso(player.get("flag"))
    return mapping


def normalize_match_players(
    opponent: dict[str, Any], team_id: str, game_id: str = ""
) -> list[dict[str, Any]]:
    """match2opponents[i].match2players → roster du front (joueurs ayant joué).

    Source unique du roster : les joueurs réellement alignés en match EWC
    (déjà présents dans la réponse /match → aucune requête supplémentaire).

    `game_id` rattache l'effectif à un jeu : une équipe peut aligner un roster
    distinct par titre (ex. Vitality en CS2 et en Valorant).
    """
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, player in enumerate(opponent.get("match2players") or []):
        if not isinstance(player, dict):
            continue
        name = str(player.get("displayname") or player.get("name") or "").strip()
        canonical = str(player.get("name") or name).strip()
        if not name:
            continue
        pid = f"{team_id}:{slugify(canonical or name)}"
        if pid in seen:
            continue
        seen.add(pid)
        out.append(
            {
                "id": pid,
                "team_id": team_id,
                "game_id": game_id or None,
                "name": name,
                "country_code": country_to_iso(player.get("flag")),
                "role": None,
                "sort_order": index,
            }
        )
    return out


def current_map_label(maps: list[dict[str, Any]] | None) -> str | None:
    """Libellé de la carte en cours, même format que le front : "Split · 11–9"."""
    if not maps:
        return None
    for entry in maps:
        if entry.get("live"):
            return f"{entry['name']} · {entry['scoreA']}–{entry['scoreB']}"
    return None


def _scoreline_from_winner(best_of: str, winner: str) -> tuple[int, int]:
    """Construit un score de série minimal à partir du vainqueur LPDB.

    Utile quand LPDB marque un match fini avec un vainqueur explicite mais
    remonte un score 0-0 (cas forfait / victoire administrative).
    """
    wins_needed = {"BO1": 1, "BO3": 2, "BO5": 3}.get(best_of, 2)
    return (wins_needed, 0) if winner == "1" else (0, wins_needed)


def normalize_match(record: dict[str, Any], game_id: str, now: datetime) -> dict[str, Any] | None:
    """Enregistrement LPDB /match → dict prêt pour l'upsert ORM.

    Retourne None si l'enregistrement est inexploitable (équipes manquantes,
    pas de date) — jamais de données fabriquées pour combler.
    """
    opponents = record.get("match2opponents") or []
    is_br = game_id in BR_GAMES
    if len(opponents) < 2:
        return None

    # --- Sélection teamA/teamB : par classement (BR) ou ordre source (standard) ---
    br_team_lookup: dict[int, dict[str, Any]] | None = None
    br_overall_standings: list[dict[str, Any]] | None = None
    if is_br:
        br_team_lookup = _build_team_lookup(opponents)
        br_overall_standings = _build_br_overall_standings(
            opponents,
            record.get("extradata"),
            games=record.get("match2games") or [],
        )
        if len(br_overall_standings) >= 2:
            top1_name = br_overall_standings[0]["name"]
            top2_name = br_overall_standings[1]["name"]
            opp_a = next(
                (o for o in opponents if (o.get("name") or "").replace("_", " ").strip() == top1_name),
                opponents[0],
            )
            opp_b = next(
                (o for o in opponents if (o.get("name") or "").replace("_", " ").strip() == top2_name),
                opponents[1],
            )
        else:
            opp_a, opp_b = opponents[0], opponents[1]
    else:
        opp_a, opp_b = opponents[0], opponents[1]

    team_a = normalize_opponent(opp_a)
    team_b = normalize_opponent(opp_b)
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
    countries = player_countries(opponents)
    team_a_name = (opp_a.get("name") or "").replace("_", " ").strip() if is_br else None
    team_b_name = (opp_b.get("name") or "").replace("_", " ").strip() if is_br else None
    maps = normalize_maps(
        games, status, countries, game_id,
        br_team_lookup=br_team_lookup,
        opponents=opponents,
        team_a_name=team_a_name,
        team_b_name=team_b_name,
    )
    best_of = to_best_of(record.get("bestof"), len(games))
    raw_winner = str(record.get("winner") or "")

    score_a = _as_int(opp_a.get("score"))
    score_b = _as_int(opp_b.get("score"))
    forfeit_inferred = False

    if is_br:
        result_a = result_b = None
        opponent_statuses = [str((opp.get("status") or "")).upper() for opp in opponents]
        opp_a_status = str((opp_a.get("status") or "")).upper()
        opp_b_status = str((opp_b.get("status") or "")).upper()
        if opp_a_status == "FF":
            forfeiting_side: str | None = "a"
        elif opp_b_status == "FF":
            forfeiting_side = "b"
        else:
            forfeiting_side = None
        if status == "upcoming" and (start_utc is None or start_utc > now):
            score_a = score_b = None
        elif status == "done":
            tie_like = score_a == score_b
            if tie_like and raw_winner in ("1", "2"):
                score_a, score_b = _scoreline_from_winner(best_of, raw_winner)
                forfeit_inferred = True
    else:
        result_a = (opp_a.get("status") or "").strip().upper() or None
        result_b = (opp_b.get("status") or "").strip().upper() or None
        opponent_statuses = [str((opponents[i].get("status") or "")).upper() for i in range(2)]
        if status == "upcoming" and (start_utc is None or start_utc > now):
            score_a = score_b = None
            result_a = result_b = None
        elif status == "done":
            tie_like = score_a == score_b
            if tie_like and raw_winner in ("1", "2"):
                score_a, score_b = _scoreline_from_winner(best_of, raw_winner)
                forfeit_inferred = True
        forfeiting_side = None
        if opponent_statuses[0] == "FF":
            forfeiting_side = "a"
        elif opponent_statuses[1] == "FF":
            forfeiting_side = "b"

    extra: dict[str, Any] = {
        "wiki": record.get("wiki"),
        "pagename": record.get("pagename"),
        "tournament": record.get("tournament"),
        "lpdb_finished": record.get("finished"),
        "lpdb_winner": record.get("winner"),
        "lpdb_status": record.get("status"),
        "lpdb_opponent_statuses": opponent_statuses,
        "forfeiting_side": forfeiting_side,
        "raw_section": record.get("section"),
        "forfeit_inferred": forfeit_inferred,
    }
    if is_br:
        extra["format"] = "br"
        if br_overall_standings:
            extra["standings"] = br_overall_standings

    # Pour les formats BR : upsert de toutes les équipes/joueurs, pas seulement top 2.
    br_extra_opponents: list[dict[str, Any]] = []
    if is_br:
        for opp in opponents:
            if opp is opp_a or opp is opp_b:
                continue
            team = normalize_opponent(opp)
            if not team:
                continue
            br_extra_opponents.append({
                "team": team,
                "players": normalize_match_players(opp, team["id"], game_id),
            })

    return {
        "id": f"{game_id}_{slugify(match2id)}",
        "game_id": game_id,
        "team_a": team_a,
        "team_b": team_b,
        "team_a_players": normalize_match_players(opp_a, team_a["id"], game_id),
        "team_b_players": normalize_match_players(opp_b, team_b["id"], game_id),
        "br_extra_opponents": br_extra_opponents or None,
        "status": status,
        "phase": translate_phase(record.get("section"), record.get("tickername")),
        "best_of": best_of,
        "start_time_utc": start_utc,
        "score_a": score_a,
        "score_b": score_b,
        "result_a": result_a,
        "result_b": result_b,
        "maps": maps,
        "current_map_label": current_map_label(maps),
        "viewers": None,
        "streams": normalize_streams(record.get("stream")),
        "veto": normalize_veto(record.get("extradata")),
        "extradata": extra,
    }
