"""Endpoints communauté : /me, /groups, /leaderboard, /predictions.

Toutes ces routes identifient l'utilisateur via le cookie de session anonyme
(créé au premier appel). Données applicatives uniquement — le worker
d'ingestion n'y touche jamais.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.db import get_session
from app.models.community import User
from app.schemas.community import (
    GroupCreateIn,
    GroupJoinIn,
    GroupOut,
    LeaderboardEntryOut,
    PredictionIn,
    PredictionOut,
    UserOut,
)
from app.services import community

router = APIRouter(tags=["community"])


@router.get("/me", response_model=UserOut)
async def get_me(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> UserOut:
    """Sert `useUser` — crée l'utilisateur anonyme au premier appel."""
    return await community.user_to_schema(session, user)


@router.get("/leaderboard", response_model=list[LeaderboardEntryOut], response_model_exclude_none=True)
async def get_leaderboard(
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=community.DEFAULT_LEADERBOARD_LIMIT, ge=1, le=500),
) -> list[LeaderboardEntryOut]:
    """Sert `useLeaderboard` — top N (défaut 50), tri points desc."""
    return await community.leaderboard(session, limit)


@router.get("/groups", response_model=list[GroupOut], response_model_exclude_none=True)
async def get_groups(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[GroupOut]:
    """Sert `useGroups` — les groupes dont l'utilisateur est membre."""
    groups = await community.list_user_groups(session, user)
    return [community.group_to_schema(g, user.id) for g in groups]


@router.get("/groups/{group_id}", response_model=GroupOut, response_model_exclude_none=True)
async def get_group(
    group_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> GroupOut:
    """Sert `useGroup`."""
    group = await community.get_group_for_user(session, user, group_id)
    if not group:
        raise HTTPException(status_code=404, detail=f"Groupe introuvable : {group_id}")
    return community.group_to_schema(group, user.id)


@router.post("/groups", response_model=GroupOut, response_model_exclude_none=True, status_code=201)
async def post_group(
    payload: GroupCreateIn,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> GroupOut:
    """Sert `useCreateGroup` — body { name, emoji } (cf. mock front)."""
    group = await community.create_group(session, user, payload.name, payload.emoji)
    return community.group_to_schema(group, user.id)


@router.post("/groups/join", response_model=GroupOut, response_model_exclude_none=True)
async def post_join_group(
    payload: GroupJoinIn,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> GroupOut:
    """Sert `useJoinGroup` — body { code }."""
    group = await community.join_group(session, user, payload.code)
    if not group:
        raise HTTPException(status_code=404, detail=f"Code d'invitation inconnu : {payload.code}")
    return community.group_to_schema(group, user.id)


@router.get("/predictions", response_model=dict[str, PredictionOut])
async def get_predictions(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict[str, PredictionOut]:
    """PredictionMap du front : Record<matchId, Prediction>."""
    return await community.predictions_map(session, user)


@router.post("/predictions", response_model=PredictionOut, status_code=201)
async def post_prediction(
    payload: PredictionIn,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> PredictionOut:
    """Crée/remplace le prono — match `upcoming` non commencé uniquement."""
    try:
        return await community.upsert_prediction(session, user, payload)
    except community.PredictionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
