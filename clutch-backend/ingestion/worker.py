"""Worker d'ingestion — job planifié : Liquipedia → normalisation → base.

⚠️ Frontière stricte : ce module n'importe QUE les modèles catalog
(games/teams/matches). Les données communauté sont hors de portée.

Lancement : `python -m ingestion.worker`
"""

import logging
from datetime import datetime, timezone
from typing import Any

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.models.catalog import Game, Match, Team, utcnow
from ingestion.liquipedia import LiquipediaGateway
from ingestion.normalize import (
    GAME_CATALOG,
    WIKI_BY_GAME,
    country_to_iso,
    normalize_match,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("clutch.worker")

# Plafond d'appels d'enrichissement équipe par run (rate limit 60 req/h).
MAX_ENRICH_CALLS_PER_RUN = 20

_engine = create_engine(get_settings().database_url, pool_pre_ping=True)
_SessionLocal = sessionmaker(_engine)


def ensure_games(session: Session) -> None:
    """Catalogue des jeux : données de contrat (front), upsert idempotent."""
    for row in GAME_CATALOG:
        game = session.get(Game, row["id"])
        if game is None:
            session.add(Game(**row))
        else:
            game.name, game.short, game.tag, game.sort_order, game.bg_url = (
                row["name"], row["short"], row["tag"], row["sort_order"], row["bg_url"],
            )


def upsert_team(session: Session, data: dict[str, str], wiki: str) -> str:
    """Crée/actualise une équipe SANS écraser un enrichissement existant."""
    team = session.get(Team, data["id"])
    if team is None:
        session.add(
            Team(
                id=data["id"],
                name=data["name"],
                tag=data["tag"],
                country_code="XX",  # enrichi plus tard via /team (locations)
                template=data.get("template") or None,
                wiki=wiki,
                enriched=False,
            )
        )
    else:
        team.name = data["name"]
        team.wiki = team.wiki or wiki
        team.template = team.template or (data.get("template") or None)
        if not team.enriched:
            team.tag = data["tag"]
        team.updated_at = utcnow()
    return data["id"]


def upsert_match(session: Session, normalized: dict[str, Any], wiki: str) -> None:
    """Écrit le match au format du contrat (équipes embarquées via FK)."""
    team_a_id = upsert_team(session, normalized.pop("team_a"), wiki)
    team_b_id = upsert_team(session, normalized.pop("team_b"), wiki)
    session.flush()  # garantit l'existence des équipes avant la FK

    match = session.get(Match, normalized["id"])
    values = {**normalized, "team_a_id": team_a_id, "team_b_id": team_b_id, "updated_at": utcnow()}
    if match is None:
        session.add(Match(**values))
    else:
        for key, value in values.items():
            setattr(match, key, value)


def enrich_teams(session: Session, gateway: LiquipediaGateway) -> None:
    """Complète tag (shortname /teamtemplate) et pays (/team locations) des
    équipes nouvelles, sous plafond d'appels pour respecter le quota."""
    pending = list(session.scalars(select(Team).where(Team.enriched.is_(False))))
    if not pending:
        return

    budget = MAX_ENRICH_CALLS_PER_RUN
    by_wiki: dict[str, list[Team]] = {}
    for team in pending:
        if team.wiki:
            by_wiki.setdefault(team.wiki, []).append(team)

    for wiki, teams in by_wiki.items():
        if budget <= 0:
            break
        # 1 requête batchée par wiki : fiches /team (nom complet + pays).
        pagenames = [t.name.replace(" ", "_") for t in teams]
        budget -= 1
        try:
            records = gateway.fetch_teams(wiki, pagenames)
        except Exception as exc:
            logger.error("Enrichissement /team %s en échec : %s", wiki, exc)
            continue
        by_pagename = {str(r.get("pagename") or ""): r for r in records}

        for team in teams:
            record = by_pagename.get(team.name.replace(" ", "_"))
            if record:
                locations = record.get("locations") or {}
                values = [v for v in locations.values() if isinstance(v, str)] if isinstance(locations, dict) else []
                for value in values:
                    iso = country_to_iso(value, record.get("region"))
                    if iso != "XX":
                        team.country_code = iso
                        break
                else:
                    team.country_code = country_to_iso(None, record.get("region"))
                team.template = team.template or (record.get("template") or None)

            # 1 requête /teamtemplate par équipe : shortname = tag du front.
            if team.template and budget > 0:
                budget -= 1
                template_data = gateway.fetch_team_template(wiki, team.template)
                if template_data:
                    shortname = (template_data.get("shortname") or "").strip()
                    if shortname:
                        team.tag = shortname.upper()[:16]
            team.enriched = True
            team.updated_at = utcnow()


def run_ingestion() -> None:
    """Un cycle complet : fetch → normalise → upsert. Logue appels et erreurs."""
    settings = get_settings()
    if not settings.ewc_tournaments:
        logger.warning("EWC_TOURNAMENTS vide : rien à ingérer (configurer le .env).")
        return

    # Regroupe par pagename pour mutualiser les requêtes multi-wikis.
    groups: dict[str, list[tuple[str, str]]] = {}
    for game_id, pagename in settings.ewc_tournaments.items():
        wiki = WIKI_BY_GAME.get(game_id)
        if not wiki:
            logger.error("gameId inconnu dans EWC_TOURNAMENTS : %r (ignoré)", game_id)
            continue
        groups.setdefault(pagename, []).append((game_id, wiki))

    now = datetime.now(timezone.utc)
    ingested = skipped = errors = 0

    with LiquipediaGateway() as gateway, _SessionLocal() as session:
        ensure_games(session)

        for pagename, entries in groups.items():
            game_by_wiki = {wiki: game_id for game_id, wiki in entries}
            try:
                records = gateway.fetch_tournament_matches(sorted(game_by_wiki), pagename)
            except Exception as exc:
                logger.error("Fetch matchs %s en échec : %s", pagename, exc)
                errors += 1
                continue

            for record in records:
                wiki = str(record.get("wiki") or "")
                game_id = game_by_wiki.get(wiki) or (entries[0][0] if len(entries) == 1 else None)
                if not game_id:
                    skipped += 1
                    continue
                normalized = normalize_match(record, game_id, now)
                if normalized is None:
                    skipped += 1
                    continue
                try:
                    upsert_match(session, normalized, wiki or WIKI_BY_GAME[game_id])
                    ingested += 1
                except Exception as exc:
                    logger.error("Upsert match %s en échec : %s", normalized.get("id"), exc)
                    errors += 1

        enrich_teams(session, gateway)
        session.commit()
        logger.info(
            "Ingestion terminée : %d match(s) upsertés, %d ignoré(s), %d erreur(s), %d appel(s) API Liquipedia.",
            ingested, skipped, errors, gateway.calls,
        )


def main() -> None:
    """Run immédiat puis planification à intervalle fixe (.env)."""
    interval = get_settings().ingest_interval_minutes
    logger.info("Worker d'ingestion Clutch — intervalle : %d min.", interval)
    run_ingestion()

    scheduler = BlockingScheduler()
    scheduler.add_job(run_ingestion, "interval", minutes=interval)
    scheduler.start()


if __name__ == "__main__":
    main()
