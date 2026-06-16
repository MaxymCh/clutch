"""Schémas du domaine esport — COPIE FIDÈLE de `clutch-frontend/src/types/esports.ts`.

Ne rien renommer, ne rien ajouter au JSON de sortie : le front fait foi.
"""

from typing import Literal

from app.schemas.base import ApiModel

# Valeurs EXACTES du front (esports.ts)
GameId = Literal[
    "val", "lol", "cs2", "dota", "rl", "ow",
    "apex", "r6", "pubg", "fn", "ff", "mlbb", "hok", "sf6", "tk8", "bo7", "tft",
]
MatchStatus = Literal["upcoming", "live", "done"]
BestOf = Literal["BO1", "BO3", "BO5"]


class GameOut(ApiModel):
    """Miroir de `Game` (front)."""

    id: GameId
    name: str
    short: str
    tag: str
    bg_url: str  # JSON : bgUrl
    logo_url: str | None = None  # JSON : logoUrl
    full_logo_url: str | None = None  # JSON : fullLogoUrl


class TeamOut(ApiModel):
    """Miroir de `Team` (front)."""

    id: str
    name: str
    tag: str
    country_code: str  # JSON : countryCode
    logo_url: str | None = None  # JSON : logoUrl


class PlayerOut(ApiModel):
    """Miroir de `Player` (front) — joueur d'un roster d'équipe."""

    id: str
    name: str
    country_code: str  # JSON : countryCode
    role: str | None = None


class StreamOut(ApiModel):
    """Miroir de `Stream` (front) — lien de diffusion d'un match."""

    platform: str
    url: str


class VetoStepOut(ApiModel):
    """Miroir de `VetoStep` (front) — une étape du veto des cartes."""

    order: int
    type: Literal["ban", "pick", "decider"]
    team: Literal["a", "b"] | None = None  # None pour la decider
    map: str


class MapPlayerOut(ApiModel):
    """Miroir de `MapPlayer` (front) — stats d'un joueur sur une carte."""

    side: Literal["a", "b"]
    name: str
    country_code: str  # JSON : countryCode
    kills: int
    deaths: int
    assists: int
    acs: float | None = None  # Valorant
    adr: float | None = None  # Valorant / CS2
    hs: float | None = None  # % headshots (Valorant)
    agent: str | None = None  # Valorant
    champion: str | None = None  # League of Legends
    role: str | None = None  # poste LoL ("Top", "Mid", "Support"…)
    hero: str | None = None  # Dota 2
    gpm: float | None = None  # gold/min (Dota 2)
    xpm: float | None = None  # xp/min (Dota 2)
    lasthits: float | None = None  # last hits / CS (Dota 2)  # JSON : lasthits
    networth: float | None = None  # or total (Dota 2)
    level: float | None = None  # niveau du héros (Dota 2)


class MapScoreOut(ApiModel):
    """Miroir de `MapScore` (front)."""

    name: str
    score_a: int  # JSON : scoreA
    score_b: int  # JSON : scoreB
    winner: Literal["a", "b"] | None = None
    live: bool | None = None
    players: list[MapPlayerOut] | None = None  # scoreboard par joueur


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
    streams: list[StreamOut] | None = None  # liens de diffusion (streamurls LPDB)
    veto: list[VetoStepOut] | None = None  # veto des cartes (extradata.mapveto)
