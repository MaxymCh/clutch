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
from app.models.catalog import Game, Match, Player, Team
from app.schemas.esports import (
    GameOut,
    MapScoreOut,
    MatchOut,
    PlayerOut,
    StreamOut,
    TeamOut,
    VetoStepOut,
)


def _display_tz() -> ZoneInfo:
    return ZoneInfo(get_settings().display_tz)


def _as_utc(value: datetime) -> datetime:
    """Les timestamps sont stockés en UTC ; SQLite peut les rendre naïfs."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _likely_forfeit(match: Match) -> bool | None:
    """Best-effort : détecte une victoire administrative depuis `extradata`."""
    extra = match.extradata if isinstance(match.extradata, dict) else None
    if not extra:
        return None

    if bool(extra.get("forfeit_inferred")):
        return True

    statuses = extra.get("lpdb_opponent_statuses")
    if isinstance(statuses, list) and any(str(s).upper() == "FF" for s in statuses):
        return True

    lpdb_winner = str(extra.get("lpdb_winner") or "")
    if (
        match.status == "done"
        and (match.score_a is not None and match.score_b is not None)
        and match.score_a == match.score_b
        and lpdb_winner in ("1", "2")
    ):
        return True

    return None


def match_to_schema(match: Match) -> MatchOut:
    """ORM → schéma front : date/time dérivées du timestamp UTC en DISPLAY_TZ."""
    local = _as_utc(match.start_time_utc).astimezone(_display_tz())
    return MatchOut(
        id=match.id,
        game_id=match.game_id,
        team_a=TeamOut.model_validate(match.team_a),
        team_b=TeamOut.model_validate(match.team_b),
        status="upcoming" if match.status == "live" else match.status,
        phase=match.phase,
        best_of=match.best_of,
        date=local.strftime("%Y-%m-%d"),
        time=local.strftime("%H:%M"),
        score_a=match.score_a,
        score_b=match.score_b,
        result_a=match.result_a,
        result_b=match.result_b,
        maps=[MapScoreOut.model_validate(m) for m in match.maps] if match.maps else None,
        current_map_label=match.current_map_label,
        viewers=match.viewers,
        streams=[StreamOut.model_validate(s) for s in match.streams] if match.streams else None,
        veto=[VetoStepOut.model_validate(v) for v in match.veto] if match.veto else None,
        likely_forfeit=_likely_forfeit(match),
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
    if not team:
        return None
    return TeamOut.model_validate(team)


async def list_players(session: AsyncSession, team_id: str) -> list[PlayerOut]:
    """GET /teams/{id}/players — roster ingéré, groupé par jeu puis ordre source."""
    rows = await session.scalars(
        select(Player)
        .where(Player.team_id == team_id)
        .order_by(asc(Player.game_id), asc(Player.sort_order))
    )
    return [PlayerOut.model_validate(p) for p in rows]


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
