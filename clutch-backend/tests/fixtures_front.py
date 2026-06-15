"""Fixtures du FRONT, recopiées à l'identique depuis
`clutch-frontend/src/api/mocks/` — preuve de parité du contrat.

⚠️ Ne pas « corriger » ces valeurs : elles sont la référence. Seule
exception documentée : `oddsA` (présent dans le mock front, OMIS par l'API
sur décision actée — le front fait `match.oddsA ?? 50`).
"""

# Match m6 tel que servi par le mock front (matches.ts, live complet)
FRONT_MATCH_M6 = {
    "id": "m6",
    "gameId": "val",
    "teamA": {"id": "flcn", "name": "Team Falcons", "tag": "FLCN", "countryCode": "SA"},
    "teamB": {"id": "t1", "name": "T1", "tag": "T1", "countryCode": "KR"},
    "status": "live",
    "phase": "Demi-finale",
    "bestOf": "BO5",
    "date": "2026-07-11",
    "time": "18:00",
    "scoreA": 2,
    "scoreB": 1,
    "maps": [
        {"name": "Ascent", "scoreA": 13, "scoreB": 6, "winner": "a"},
        {"name": "Bind", "scoreA": 9, "scoreB": 13, "winner": "b"},
        {"name": "Lotus", "scoreA": 13, "scoreB": 10, "winner": "a"},
        {"name": "Split", "scoreA": 11, "scoreB": 9, "live": True},
    ],
    "currentMapLabel": "Split · 11–9",
    "viewers": "74K",
    "oddsA": 58,
}

# Match m17 tel que servi par le mock front (upcoming, champs minimaux)
FRONT_MATCH_M17 = {
    "id": "m17",
    "gameId": "cs2",
    "teamA": {"id": "navi", "name": "Natus Vincere", "tag": "NAVI", "countryCode": "UA"},
    "teamB": {"id": "faze", "name": "FaZe Clan", "tag": "FAZE", "countryCode": "US"},
    "status": "upcoming",
    "phase": "Grande Finale",
    "bestOf": "BO5",
    "date": "2026-07-14",
    "time": "20:00",
    "oddsA": 50,
}

# Équipe et jeu tels que servis par le mock front (catalog.ts)
FRONT_TEAM_FLCN = {"id": "flcn", "name": "Team Falcons", "tag": "FLCN", "countryCode": "SA"}
FRONT_GAME_VAL = {"id": "val", "name": "Valorant", "short": "Valorant", "tag": "VAL"}

# Seul écart autorisé entre mock front et API (décision actée)
OMITTED_BY_API = {"oddsA"}
