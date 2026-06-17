"""Endpoint webhook Liquipedia — re-ingestion ciblée sur ping édit/purge.

Flux :
  Liquipedia édite une page de tournoi
  → POST /webhook/liquipedia
  → on identifie le(s) jeu(x) concernés dans EWC_TOURNAMENTS
  → re-ingestion du pagename en tâche de fond (thread sync)
  → le front voit la mise à jour au prochain poll (≤ 60 s)

Debounce : on ignore les re-ingestions sur le même pagename si moins de
DEBOUNCE_SECONDS s se sont écoulés depuis la dernière (pic d'edits live).
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from pydantic import BaseModel, ValidationError

from app.core.config import get_settings

logger = logging.getLogger("clutch.webhook")
router = APIRouter(tags=["webhook"])

# Debounce : {pagename → timestamp dernier run}
_last_ingest: dict[str, float] = {}
DEBOUNCE_SECONDS = 30


# ── Payload Liquipedia ────────────────────────────────────────────────────────

class LiquipediaEditEvent(BaseModel):
    page: str
    namespace: int = 0
    wiki: str
    event: str
    # Champs move uniquement
    from_page: str | None = None
    from_namespace: int | None = None


# ── Re-ingestion synchrone (run dans un thread) ───────────────────────────────

def _reingest_pagename(pagename: str, game_ids: list[str]) -> None:
    """Re-fetche un tournoi Liquipedia et upserte les matchs concernés.

    Tourne dans un thread (sync) pour ne pas bloquer la boucle asyncio.
    Crée son propre moteur SQLAlchemy sync (indépendant de l'API async).
    """
    from datetime import datetime, timezone

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from ingestion.liquipedia import LiquipediaGateway
    from ingestion.normalize import WIKI_BY_GAME, normalize_match
    from ingestion.worker import ensure_games, upsert_match

    settings = get_settings()
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    Session = sessionmaker(engine)

    now = datetime.now(timezone.utc)
    wikis = sorted({WIKI_BY_GAME[g] for g in game_ids if g in WIKI_BY_GAME})
    ingested = errors = 0

    with LiquipediaGateway() as gateway, Session() as session:
        ensure_games(session)
        try:
            records = gateway.fetch_tournament_matches(wikis, pagename)
        except Exception as exc:
            logger.error("Webhook re-ingest %s en échec : %s", pagename, exc)
            return

        for record in records:
            r_wiki = str(record.get("wiki") or "")
            game_id = next(
                (g for g in game_ids if WIKI_BY_GAME.get(g) == r_wiki), None
            )
            if not game_id:
                continue
            normalized = normalize_match(record, game_id, now)
            if normalized is None:
                continue
            try:
                upsert_match(session, normalized, r_wiki)
                ingested += 1
            except Exception as exc:
                logger.error("Webhook upsert %s en échec : %s", normalized.get("id"), exc)
                errors += 1

        session.commit()

    logger.info(
        "Webhook re-ingest %s : %d match(s) upsertés, %d erreur(s).",
        pagename, ingested, errors,
    )


async def _run_reingest(pagename: str, game_ids: list[str]) -> None:
    await asyncio.to_thread(_reingest_pagename, pagename, game_ids)


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/webhook/liquipedia", status_code=200)
async def liquipedia_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_secret: str | None = Header(default=None),
) -> dict[str, Any]:
    """Reçoit les pings Liquipedia et déclenche une re-ingestion ciblée.

    - Valide le secret si WEBHOOK_SECRET est configuré dans .env.
    - Ignore les namespaces hors 0 (espaces utilisateur, teamtemplates…).
    - Debounce 30 s par pagename pour absorber les rafales d'edits live.
    - Retourne 200 immédiatement ; la re-ingestion tourne en tâche de fond.
    """
    settings = get_settings()
    raw_body = await request.body()
    body_text = raw_body.decode("utf-8", errors="replace")
    logger.info(
        "Webhook Liquipedia reçu — body brut : %s | secret header : %s",
        body_text,
        "présent" if x_webhook_secret else "absent",
    )

    try:
        payload = LiquipediaEditEvent.model_validate_json(raw_body)
    except ValidationError as exc:
        logger.warning("Webhook payload invalide : %s", exc)
        raise HTTPException(status_code=422, detail="Payload webhook invalide.") from exc

    logger.info(
        "Webhook Liquipedia parsé : %s",
        payload.model_dump(exclude_none=True),
    )

    # Vérification du secret (optionnel — activer en prod via .env)
    if settings.webhook_secret and x_webhook_secret != settings.webhook_secret:
        logger.warning("Webhook rejeté : secret invalide (configuré=%s).", bool(settings.webhook_secret))
        raise HTTPException(status_code=401, detail="Secret webhook invalide.")

    # Seul le namespace principal nous intéresse
    if payload.namespace != 0:
        logger.info(
            "Webhook ignoré — namespace %d (page=%r, wiki=%r, event=%r).",
            payload.namespace, payload.page, payload.wiki, payload.event,
        )
        return {"ok": True, "skipped": "namespace_ignored"}

    # Seuls edit et purge déclenchent une re-ingestion
    if payload.event not in ("edit", "purge"):
        logger.info(
            "Webhook ignoré — event %r non géré (page=%r, wiki=%r).",
            payload.event, payload.page, payload.wiki,
        )
        return {"ok": True, "skipped": f"event_{payload.event}_ignored"}

    # Identifier les jeux trackés pour ce pagename
    matched_games = [
        game_id
        for game_id, pagename in settings.ewc_tournaments.items()
        if pagename == payload.page
    ]

    if not matched_games:
        logger.info(
            "Webhook ignoré — page %r non trackée dans EWC_TOURNAMENTS (wiki=%r, event=%r).",
            payload.page, payload.wiki, payload.event,
        )
        return {"ok": True, "skipped": "page_not_tracked"}

    # Debounce
    now_ts = datetime.now(timezone.utc).timestamp()
    last = _last_ingest.get(payload.page, 0.0)
    if now_ts - last < DEBOUNCE_SECONDS:
        remaining = DEBOUNCE_SECONDS - (now_ts - last)
        logger.info(
            "Webhook debounce — %s ignoré (%.0fs restantes, wiki=%r, event=%r).",
            payload.page, remaining, payload.wiki, payload.event,
        )
        return {"ok": True, "skipped": "debounce"}

    _last_ingest[payload.page] = now_ts

    logger.info(
        "Webhook accepté — %s %s/%s → re-ingestion de %s en tâche de fond.",
        payload.event, payload.wiki, payload.page, matched_games,
    )

    background_tasks.add_task(_run_reingest, payload.page, matched_games)

    return {"ok": True, "games": matched_games, "page": payload.page}
