"""Logique des données applicatives : utilisateur, groupes, leaderboard, pronos.

Lit le catalog (matchs) pour valider les pronostics, mais n'écrit QUE dans
les tables community.
"""

import secrets
import string
import uuid
from datetime import datetime, timezone

from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Match
from app.models.community import Group, GroupMembership, Prediction, User, UserPreferences
from app.schemas.community import (
    GroupMemberOut,
    GroupOut,
    LeaderboardEntryOut,
    PredictionIn,
    PredictionOut,
    PreferencesOut,
    PreferencesPatchIn,
    UserOut,
)

# Victoires nécessaires pour remporter la série, par format (contrat front)
WINS_NEEDED = {"BO1": 1, "BO3": 2, "BO5": 3}

DEFAULT_LEADERBOARD_LIMIT = 50


# --- Utilisateur -------------------------------------------------------------


async def global_rank(session: AsyncSession, user: User) -> int:
    """Rang mondial = 1 + nombre d'utilisateurs strictement devant (points desc)."""
    ahead = await session.scalar(select(func.count()).select_from(User).where(User.points > user.points))
    return (ahead or 0) + 1


async def user_to_schema(session: AsyncSession, user: User) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        tag=user.tag,
        country_code=user.country_code,
        points=user.points,
        global_rank=await global_rank(session, user),
        streak=user.streak,
    )


# --- Préférences --------------------------------------------------------------


async def get_or_create_preferences(session: AsyncSession, user: User) -> UserPreferences:
    """Retourne les préférences de l'utilisateur, les crée avec les défauts si absentes."""
    prefs = await session.get(UserPreferences, user.id)
    if not prefs:
        prefs = UserPreferences(user_id=user.id)
        session.add(prefs)
        await session.commit()
    return prefs


async def update_preferences(session: AsyncSession, user: User, patch: PreferencesPatchIn) -> UserPreferences:
    """Mise à jour partielle des préférences (seuls les champs non-None sont appliqués)."""
    prefs = await get_or_create_preferences(session, user)
    if patch.theme is not None:
        prefs.theme = patch.theme
    if patch.notifications is not None:
        prefs.notifications = patch.notifications
    if patch.onboarded is not None:
        prefs.onboarded = patch.onboarded
    if patch.fav_teams is not None:
        prefs.fav_teams = patch.fav_teams
    if patch.fav_games is not None:
        prefs.fav_games = patch.fav_games
    await session.commit()
    return prefs


# --- Leaderboard --------------------------------------------------------------


async def leaderboard(session: AsyncSession, limit: int = DEFAULT_LEADERBOARD_LIMIT) -> list[LeaderboardEntryOut]:
    """Top N mondial, tri points desc (rangs recalculés à la lecture)."""
    rows = await session.scalars(
        select(User).order_by(desc(User.points), asc(User.created_at), asc(User.id)).limit(limit)
    )
    return [
        LeaderboardEntryOut(
            rank=i + 1,
            name=u.name,
            tag=u.tag,
            points=u.points,
            country_code=u.country_code,
        )
        for i, u in enumerate(rows)
    ]


# --- Groupes ------------------------------------------------------------------


def group_to_schema(group: Group, current_user_id: str) -> GroupOut:
    """Membres triés par points desc ; `isMe` relatif au demandeur (cf. front)."""
    members = sorted(group.memberships, key=lambda m: m.user.points, reverse=True)
    return GroupOut(
        id=group.id,
        name=group.name,
        emoji=group.emoji,
        code=group.code,
        members=[
            GroupMemberOut(
                name=m.user.name,
                tag=m.user.tag,
                points=m.user.points,
                is_me=True if m.user_id == current_user_id else None,
            )
            for m in members
        ],
    )


def _generate_group_code() -> str:
    """Code d'invitation type CLTCH-XXXX (même esprit que le mock front)."""
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(4))
    return f"CLTCH-{suffix}"


async def list_user_groups(session: AsyncSession, user: User) -> list[Group]:
    rows = await session.scalars(
        select(Group)
        .join(GroupMembership, GroupMembership.group_id == Group.id)
        .where(GroupMembership.user_id == user.id)
        .order_by(asc(Group.created_at))
    )
    return list(rows.unique())


async def get_group_for_user(session: AsyncSession, user: User, group_id: str) -> Group | None:
    """Un groupe n'est visible que par ses membres."""
    group = await session.get(Group, group_id)
    if not group or all(m.user_id != user.id for m in group.memberships):
        return None
    return group


async def create_group(session: AsyncSession, user: User, name: str, emoji: str) -> Group:
    """Réplique du comportement mock front : nom vide → « Mon groupe »."""
    code = _generate_group_code()
    # Collision de code improbable mais possible : on retire jusqu'à unicité.
    while await session.scalar(select(Group.id).where(Group.code == code)):
        code = _generate_group_code()

    group = Group(
        id=uuid.uuid4().hex[:12],
        name=name.strip() or "Mon groupe",
        emoji=emoji or "🎮",
        code=code,
    )
    session.add(group)
    session.add(GroupMembership(group=group, user_id=user.id))
    await session.commit()
    await session.refresh(group)
    return group


async def join_group(session: AsyncSession, user: User, code: str) -> Group | None:
    """Rejoint un groupe par code d'invitation. None si code inconnu."""
    normalized = code.strip().upper()
    group = await session.scalar(select(Group).where(Group.code == normalized))
    if not group:
        return None
    if all(m.user_id != user.id for m in group.memberships):
        session.add(GroupMembership(group_id=group.id, user_id=user.id))
        await session.commit()
        await session.refresh(group)
    return group


# --- Pronostics ---------------------------------------------------------------


async def predictions_map(session: AsyncSession, user: User) -> dict[str, PredictionOut]:
    """Forme PredictionMap du front : Record<matchId, Prediction>."""
    rows = await session.scalars(select(Prediction).where(Prediction.user_id == user.id))
    return {
        p.match_id: PredictionOut(pick=p.pick, score_a=p.score_a, score_b=p.score_b)
        for p in rows
    }


class PredictionError(Exception):
    """Erreur métier de pronostic (transformée en HTTPException par la route)."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def _validate_scoreline(payload: PredictionIn, best_of: str) -> None:
    """Règles du front : le vainqueur pronostiqué atteint exactement le nombre
    de victoires du format, le perdant reste en dessous (PredictSheet)."""
    needed = WINS_NEEDED[best_of]
    winner_score = payload.score_a if payload.pick == "a" else payload.score_b
    loser_score = payload.score_b if payload.pick == "a" else payload.score_a
    if winner_score != needed or not 0 <= loser_score < needed:
        raise PredictionError(422, f"Score invalide pour un {best_of}")


async def upsert_prediction(session: AsyncSession, user: User, payload: PredictionIn) -> PredictionOut:
    """Crée ou met à jour le prono — règles relevées dans le front :
    match `upcoming` uniquement, modifiable jusqu'au début du match."""
    match = await session.get(Match, payload.match_id)
    if not match:
        raise PredictionError(404, f"Match introuvable : {payload.match_id}")

    start = match.start_time_utc
    start = start if start.tzinfo else start.replace(tzinfo=timezone.utc)
    if match.status != "upcoming" or start <= datetime.now(timezone.utc):
        raise PredictionError(409, "Le match a déjà commencé : pronostic fermé")

    _validate_scoreline(payload, match.best_of)

    existing = await session.scalar(
        select(Prediction).where(Prediction.user_id == user.id, Prediction.match_id == payload.match_id)
    )
    if existing:
        existing.pick = payload.pick
        existing.score_a = payload.score_a
        existing.score_b = payload.score_b
        existing.updated_at = datetime.now(timezone.utc)
    else:
        session.add(
            Prediction(
                user_id=user.id,
                match_id=payload.match_id,
                pick=payload.pick,
                score_a=payload.score_a,
                score_b=payload.score_b,
            )
        )
    await session.commit()
    return PredictionOut(pick=payload.pick, score_a=payload.score_a, score_b=payload.score_b)
