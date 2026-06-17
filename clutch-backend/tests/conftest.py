"""Fixtures de test : base SQLite en mémoire + client HTTP ASGI.

Mêmes modèles que Postgres ; le scheduler de scoring n'est pas démarré
(le transport ASGI n'exécute pas le lifespan), les tests appellent le
scoring directement.
"""

from collections.abc import AsyncIterator
from datetime import datetime, timezone

import pytest
from fastapi import Depends, Request
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.core.db import get_session
from app.main import app
from app.models.base import Base
from app.models.catalog import Game, Match, Team
from app.models.community import User

UTC = timezone.utc


@pytest.fixture
async def session_factory():
    """Moteur SQLite mémoire neuf par test, tables créées depuis les modèles."""
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    yield factory
    await engine.dispose()


@pytest.fixture
async def session(session_factory) -> AsyncIterator[AsyncSession]:
    async with session_factory() as s:
        yield s


async def _user_dep(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> User:
    """Remplace get_current_user en tests : identité tirée du header X-Test-User."""
    user_id = request.headers.get("x-test-user", "testusera")
    user = await session.get(User, user_id)
    if user:
        return user
    number = abs(hash(user_id)) % 10_000
    user = User(
        id=user_id,
        name=f"clutcher_{number:04d}",
        tag="CL",
        country_code="FR",
        points=0,
        streak=0,
    )
    session.add(user)
    try:
        await session.commit()
    except Exception:
        await session.rollback()
        user = await session.get(User, user_id)
    return user


@pytest.fixture
async def client(session_factory) -> AsyncIterator[AsyncClient]:
    """Client HTTP branché sur l'app, session DB substituée."""

    async def _override() -> AsyncIterator[AsyncSession]:
        async with session_factory() as s:
            yield s

    app.dependency_overrides[get_session] = _override
    app.dependency_overrides[get_current_user] = _user_dep
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"X-Test-User": "testusera"},
    ) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def second_client(session_factory) -> AsyncIterator[AsyncClient]:
    """Deuxième client = deuxième utilisateur (header X-Test-User distinct)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"X-Test-User": "testuserb"},
    ) as c:
        yield c


# --- Helpers de peuplement (formes alignées sur les fixtures du front) -------


async def seed_catalog(session: AsyncSession) -> None:
    """Jeux + équipes utilisés par les fixtures front reproduites en tests."""
    session.add_all(
        [
            Game(id="val", name="Valorant", short="Valorant", tag="VAL", sort_order=0),
            Game(id="lol", name="League of Legends", short="LoL", tag="LOL", sort_order=1),
            Game(id="cs2", name="Counter-Strike 2", short="CS2", tag="CS2", sort_order=2),
        ]
    )
    session.add_all(
        [
            Team(id="flcn", name="Team Falcons", tag="FLCN", country_code="SA", enriched=True),
            Team(id="t1", name="T1", tag="T1", country_code="KR", enriched=True),
            Team(id="navi", name="Natus Vincere", tag="NAVI", country_code="UA", enriched=True),
            Team(id="faze", name="FaZe Clan", tag="FAZE", country_code="US", enriched=True),
        ]
    )
    await session.commit()


def make_match(**overrides) -> Match:
    """Match « m6 » du front par défaut (upcoming en cours) — surchargable."""
    values = dict(
        id="m6",
        game_id="val",
        team_a_id="flcn",
        team_b_id="t1",
        status="upcoming",
        phase="Demi-finale",
        best_of="BO5",
        # 18:00 Europe/Paris (été, UTC+2) le 11/07/2026 → 16:00 UTC
        start_time_utc=datetime(2026, 7, 11, 16, 0, tzinfo=UTC),
        score_a=2,
        score_b=1,
        maps=[
            {"name": "Ascent", "scoreA": 13, "scoreB": 6, "winner": "a"},
            {"name": "Bind", "scoreA": 9, "scoreB": 13, "winner": "b"},
            {"name": "Lotus", "scoreA": 13, "scoreB": 10, "winner": "a"},
            {"name": "Split", "scoreA": 11, "scoreB": 9, "live": True},
        ],
        current_map_label="Split · 11–9",
        viewers="74K",
    )
    values.update(overrides)
    return Match(**values)
