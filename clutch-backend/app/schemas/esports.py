"""Schémas du domaine esport — COPIE FIDÈLE de `clutch-frontend/src/types/esports.ts`.

Ne rien renommer, ne rien ajouter au JSON de sortie : le front fait foi.
"""

from typing import Literal

from app.schemas.base import ApiModel

# Valeurs EXACTES du front (esports.ts)
GameId = Literal["val", "lol", "cs2", "dota", "rl", "ow"]
MatchStatus = Literal["upcoming", "live", "done"]
BestOf = Literal["BO1", "BO3", "BO5"]


class GameOut(ApiModel):
    """Miroir de `Game` (front)."""

    id: GameId
    name: str
    short: str
    tag: str
    bg_url: str  # JSON : bgUrl


class TeamOut(ApiModel):
    """Miroir de `Team` (front)."""

    id: str
    name: str
    tag: str
    country_code: str  # JSON : countryCode
    logo_url: str | None = None  # JSON : logoUrl


class MapScoreOut(ApiModel):
    """Miroir de `MapScore` (front)."""

    name: str
    score_a: int  # JSON : scoreA
    score_b: int  # JSON : scoreB
    winner: Literal["a", "b"] | None = None
    live: bool | None = None


class MatchOut(ApiModel):
    """Miroir de `Match` (front).

    `date`/`time` sont calculées par le service depuis le timestamp UTC en
    base, converties dans DISPLAY_TZ. `oddsA` n'existe pas côté backend
    (décision actée : aucune valeur fabriquée).
    """

    id: str
    game_id: GameId  # JSON : gameId
    team_a: TeamOut  # JSON : teamA (équipe EMBARQUÉE, jamais un id)
    team_b: TeamOut  # JSON : teamB
    status: MatchStatus
    phase: str
    best_of: BestOf  # JSON : bestOf
    date: str  # "YYYY-MM-DD" dans DISPLAY_TZ
    time: str  # "HH:mm" dans DISPLAY_TZ
    score_a: int | None = None  # JSON : scoreA
    score_b: int | None = None  # JSON : scoreB
    maps: list[MapScoreOut] | None = None
    current_map_label: str | None = None  # JSON : currentMapLabel
    viewers: str | None = None
