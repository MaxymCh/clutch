"""Endpoints du catalogue ingéré : /games, /teams, /matches.

Lecture en base UNIQUEMENT — jamais d'appel Liquipedia ici.
`response_model_exclude_none=True` : les champs optionnels absents ne
sortent pas en null (contrat front).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.schemas.esports import GameOut, MatchOut, TeamOut
from app.services import catalog

router = APIRouter(tags=["catalog"])


@router.get("/games", response_model=list[GameOut])
async def get_games(session: AsyncSession = Depends(get_session)) -> list[GameOut]:
    """Sert le hook front `useGames` — ordre GAME_ORDER."""
    return await catalog.list_games(session)


@router.get("/teams", response_model=list[TeamOut])
async def get_teams(session: AsyncSession = Depends(get_session)) -> list[TeamOut]:
    """Sert `useTeams` — tri alphabétique sur name."""
    return await catalog.list_teams(session)


@router.get("/teams/{team_id}", response_model=TeamOut)
async def get_team(team_id: str, session: AsyncSession = Depends(get_session)) -> TeamOut:
    """Sert `useTeam`."""
    team = await catalog.get_team(session, team_id)
    if not team:
        raise HTTPException(status_code=404, detail=f"Équipe introuvable : {team_id}")
    return team


@router.get("/matches", response_model=list[MatchOut], response_model_exclude_none=True)
async def get_matches(
    session: AsyncSession = Depends(get_session),
    game: str | None = Query(default=None, description="GameId (val, lol, cs2, dota, rl, ow)"),
    team: str | None = Query(default=None, description="Id d'équipe"),
    day: str | None = Query(default=None, description="Jour local YYYY-MM-DD (DISPLAY_TZ)"),
    status: str | None = Query(default=None, pattern="^(upcoming|live|done)$"),
    q: str | None = Query(default=None, description="Recherche texte (équipe, phase)"),
) -> list[MatchOut]:
    """Sert `useMatches` — filtres exacts du front, tous optionnels."""
    return await catalog.list_matches(session, game=game, team=team, day=day, status=status, q=q)


@router.get("/matches/{match_id}", response_model=MatchOut, response_model_exclude_none=True)
async def get_match(match_id: str, session: AsyncSession = Depends(get_session)) -> MatchOut:
    """Sert `useMatch`."""
    match = await catalog.get_match(session, match_id)
    if not match:
        raise HTTPException(status_code=404, detail=f"Match introuvable : {match_id}")
    return match
