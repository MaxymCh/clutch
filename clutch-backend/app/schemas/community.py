"""Schémas communauté — COPIE FIDÈLE de `clutch-frontend/src/types/community.ts`."""

from typing import Literal

from pydantic import Field

from app.schemas.base import ApiModel
from app.schemas.esports import MatchOut

Pick = Literal["a", "b"]


class UserOut(ApiModel):
    """Miroir de `User` (front)."""

    id: str
    name: str
    tag: str
    country_code: str  # JSON : countryCode
    points: int
    global_rank: int  # JSON : globalRank (calculé, tri points desc)
    streak: int


class GroupMemberOut(ApiModel):
    """Miroir de `GroupMember` (front). `isMe` est relatif au demandeur."""

    name: str
    tag: str
    points: int
    is_me: bool | None = None  # JSON : isMe (présent uniquement si true)


class GroupOut(ApiModel):
    """Miroir de `Group` (front)."""

    id: str
    name: str
    emoji: str
    code: str
    members: list[GroupMemberOut]


class LeaderboardEntryOut(ApiModel):
    """Miroir de `LeaderboardEntry` (front)."""

    rank: int
    name: str
    tag: str
    points: int
    country_code: str | None = None  # JSON : countryCode


class PredictionOut(ApiModel):
    """Miroir de `Prediction` (front) — valeur du PredictionMap."""

    pick: Pick
    score_a: int  # JSON : scoreA
    score_b: int  # JSON : scoreB


class PredictionHistoryItemOut(ApiModel):
    """Historique d'un prono utilisateur sur un match terminé."""

    match: MatchOut
    prediction: PredictionOut
    points: int | None = None


class GroupHistoryMemberOut(ApiModel):
    """Pronostic d'un membre du groupe sur un match terminé."""

    name: str
    tag: str
    is_me: bool | None = None  # JSON : isMe
    prediction: PredictionOut | None = None
    points: int | None = None


class GroupHistoryMatchOut(ApiModel):
    """Historique d'un match terminé pour les membres du groupe."""

    match: MatchOut
    members: list[GroupHistoryMemberOut]


# --- Corps de requêtes (entrées) ---


class GroupCreateIn(ApiModel):
    """Body de POST /groups (cf. mock front : { name, emoji })."""

    name: str = ""
    emoji: str = "🎮"


class GroupJoinIn(ApiModel):
    """Body de POST /groups/join."""

    code: str


class PredictionIn(ApiModel):
    """Body de POST /predictions (annoncé par le PredictionsProvider du front)."""

    match_id: str  # JSON : matchId
    pick: Pick
    score_a: int = Field(ge=0, le=5)  # JSON : scoreA
    score_b: int = Field(ge=0, le=5)  # JSON : scoreB
