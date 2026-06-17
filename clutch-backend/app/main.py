"""Application FastAPI Clutch — API interne lue par le front, et rien d'autre.

- CORS : origines explicites (.env), credentials activés (cookie de session).
- Attribution : les données esport proviennent de Liquipedia (CC-BY-SA 3.0).
- Scoring : tâche planifiée dans CE processus (le worker d'ingestion ne
  touche jamais aux données communauté).
"""

import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.catalog import router as catalog_router
from app.api.community import router as community_router
from app.api.webhook import router as webhook_router
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.services.scoring import score_finished_matches

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s:%(name)s:%(message)s",
    datefmt="%H:%M:%S",
)

ATTRIBUTION = (
    "Données esport issues de Liquipedia (https://liquipedia.net), "
    "sous licence CC-BY-SA 3.0. Clutch est un projet étudiant ETNA, "
    "non affilié à l'Esports World Cup."
)


async def _run_scoring() -> None:
    """Un tour de scoring avec sa propre session."""
    async with SessionLocal() as session:
        await score_finished_matches(session)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Démarre/arrête la tâche planifiée de scoring avec l'API."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_run_scoring, "interval", seconds=get_settings().scoring_interval_seconds)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="Clutch API",
    version="0.1.0",
    description=f"API interne du calendrier EWC 2026.\n\n**Attribution** : {ATTRIBUTION}",
    license_info={
        "name": "Données : CC-BY-SA 3.0 (Liquipedia)",
        "url": "https://creativecommons.org/licenses/by-sa/3.0/",
    },
    lifespan=lifespan,
)

# Origines EXPLICITES (jamais "*") + Authorization pour le Bearer token Supabase.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def attribution_header(request: Request, call_next) -> Response:
    """Attribution CC-BY-SA dans les métadonnées de chaque réponse."""
    response: Response = await call_next(request)
    # Les en-têtes HTTP sont latin-1 : ASCII uniquement ici.
    response.headers["X-Data-Attribution"] = "Liquipedia (CC-BY-SA 3.0) - https://liquipedia.net"
    return response


app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(community_router)
app.include_router(webhook_router)
