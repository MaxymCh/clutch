"""Session de base de données.

- L'API utilise le moteur ASYNC (psycopg async via SQLAlchemy 2).
- Le worker d'ingestion utilise un moteur SYNC séparé (voir ingestion/worker.py),
  liquipydia étant synchrone.
"""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

_settings = get_settings()

engine = create_async_engine(_settings.database_url, pool_pre_ping=True)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Dépendance FastAPI : une session par requête, fermée proprement."""
    async with SessionLocal() as session:
        yield session
