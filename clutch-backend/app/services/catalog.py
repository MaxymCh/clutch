"""Lecture du catalogue ingéré (jeux, équipes, matchs).

L'API ne fait QUE lire ces tables — l'écriture appartient au worker.
La conversion UTC → DISPLAY_TZ se fait ici, à la sérialisation.
"""

from datetime import date as date_t
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import asc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.catalog import Game, Match, Team
from app.schemas.esports import GameOut, MapScoreOut, MatchOut, TeamOut


def _display_tz() -> ZoneInfo:
    return ZoneInfo(get_settings().display_tz)


def _as_utc(value: datetime) -> datetime:
    """Les timestamps sont stockés en UTC ; SQLite peut les rendre naïfs."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def match_to_schema(match: Match) -> MatchOut:
    """ORM → schéma front : date/time dérivées du timestamp UTC en DISPLAY_TZ."""
    local = _as_utc(match.start_time_utc).astimezone(_display_tz())
    return MatchOut(
        id=match.id,
        game_id=match.game_id,
        team_a=TeamOut.model_validate(match.team_a),
        team_b=TeamOut.model_validate(match.team_b),
        status=match.status,
        phase=match.phase,
        best_of=match.best_of,
        date=local.strftime("%Y-%m-%d"),
        time=local.strftime("%H:%M"),
        score_a=match.score_a,
        score_b=match.score_b,
        maps=[MapScoreOut.model_validate(m) for m in match.maps] if match.maps else None,
        current_map_label=match.current_map_label,
        viewers=match.viewers,
    )


async def list_games(session: AsyncSession) -> list[GameOut]:
    """GET /games — ordre d'affichage du front (GAME_ORDER)."""
    rows = await session.scalars(select(Game).order_by(asc(Game.sort_order)))
    return [GameOut.model_validate(g) for g in rows]


async def list_teams(session: AsyncSession) -> list[TeamOut]:
    """GET /teams — tri alphabétique sur name (cf. mock front)."""
    rows = await session.scalars(select(Team).order_by(asc(Team.name)))
    return [TeamOut.model_validate(t) for t in rows]


async def get_team(session: AsyncSession, team_id: str) -> TeamOut | None:
    team = await session.get(Team, team_id)
    return TeamOut.model_validate(team) if team else None


async def list_matches(
    session: AsyncSession,
    *,
    game: str | None = None,
    team: str | None = None,
    day: str | None = None,
    status: str | None = None,
    q: str | None = None,
) -> list[MatchOut]:
    """GET /matches — filtres exacts du front (tous optionnels)."""
    stmt = select(Match).order_by(asc(Match.start_time_utc), asc(Match.id))

    if game:
        stmt = stmt.where(Match.game_id == game)
    if team:
        stmt = stmt.where(or_(Match.team_a_id == team, Match.team_b_id == team))
    if status:
        stmt = stmt.where(Match.status == status)
    if day:
        # `day` est une date locale (DISPLAY_TZ) : on filtre sur la plage UTC
        # correspondant à cette journée locale.
        local_day = date_t.fromisoformat(day)
        start_local = datetime.combine(local_day, time.min, tzinfo=_display_tz())
        start_utc = start_local.astimezone(timezone.utc)
        stmt = stmt.where(
            Match.start_time_utc >= start_utc,
            Match.start_time_utc < start_utc + timedelta(days=1),
        )
    if q:
        needle = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Match.phase.ilike(needle),
                Match.team_a.has(or_(Team.name.ilike(needle), Team.tag.ilike(needle))),
                Match.team_b.has(or_(Team.name.ilike(needle), Team.tag.ilike(needle))),
            )
        )

    rows = await session.scalars(stmt)
    return [match_to_schema(m) for m in rows.unique()]


async def get_match(session: AsyncSession, match_id: str) -> MatchOut | None:
    match = await session.get(Match, match_id)
    return match_to_schema(match) if match else None
