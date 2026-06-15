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
from app.models.catalog import Game, Match, Player, Team, utcnow
from ingestion.liquipedia import LiquipediaGateway
from ingestion.normalize import (
    GAME_CATALOG,
    WIKI_BY_GAME,
    country_to_iso,
    normalize_match,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("clutch.worker")

# Plafond d'appels /teamtemplate par run (seul appel NON batchable : 1/équipe).
# Le reste de l'ingestion tient en 3 requêtes batchées (1 /match multi-wiki,
# 1 /team multi-wiki, 1 /squadplayer multi-wiki). Une fois les équipes enrichies
# (flags persistés en base), un run ne coûte plus que le /match : ~4 req/h.
MAX_ENRICH_CALLS_PER_RUN = 8

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


def upsert_players(session: Session, players: list[dict[str, Any]]) -> None:
    """Ajoute/actualise les joueurs d'un roster (union au fil des matchs).

    On n'efface jamais : le roster d'une équipe est l'ensemble des joueurs vus
    en match. Upsert idempotent par id stable.
    """
    for data in players:
        player = session.get(Player, data["id"])
        if player is None:
            session.add(Player(**data))
        else:
            player.name = data["name"]
            if data["country_code"] != "XX":
                player.country_code = data["country_code"]
            player.updated_at = utcnow()


def upsert_match(session: Session, normalized: dict[str, Any], wiki: str) -> None:
    """Écrit le match au format du contrat (équipes embarquées via FK)."""
    team_a_id = upsert_team(session, normalized.pop("team_a"), wiki)
    team_b_id = upsert_team(session, normalized.pop("team_b"), wiki)
    session.flush()  # garantit l'existence des équipes avant la FK

    # Roster dérivé des joueurs alignés (déjà dans la réponse /match).
    upsert_players(session, normalized.pop("team_a_players", []))
    upsert_players(session, normalized.pop("team_b_players", []))

    match = session.get(Match, normalized["id"])
    values = {**normalized, "team_a_id": team_a_id, "team_b_id": team_b_id, "updated_at": utcnow()}
    if match is None:
        session.add(Match(**values))
    else:
        for key, value in values.items():
            setattr(match, key, value)


def enrich_teams(session: Session, gateway: LiquipediaGateway) -> None:
    """Complète pays/logo (/team) et tag (shortname /teamtemplate) des équipes
    nouvelles, sous plafond d'appels pour respecter le quota.

    Économies de quota :
    - 1 SEULE requête /team multi-wiki pour toutes les équipes (pays + logo) ;
    - /teamtemplate appelé UNIQUEMENT si /team n'a pas fourni de logo (le tag a
      un fallback dérivé) — la plupart des équipes n'en ont donc pas besoin ;
    - arrêt immédiat dès qu'un 429 est rencontré (préserve la fenêtre de quota).
    """
    if gateway.rate_limited:
        return
    pending = list(session.scalars(
        select(Team).where(Team.enriched.is_(False) | Team.logo_url.is_(None))
    ))
    if not pending:
        return

    budget = MAX_ENRICH_CALLS_PER_RUN
    wikis = sorted({t.wiki for t in pending if t.wiki})
    pagenames = sorted({t.name.replace(" ", "_") for t in pending if t.wiki})

    # 1 SEULE requête multi-wiki pour TOUTES les équipes (pays + logo).
    budget -= 1
    by_key: dict[tuple[str, str], dict] = {}
    try:
        records = gateway.fetch_teams("|".join(wikis), pagenames)
        # Clé (wiki, pagename) : un même pagename peut exister sur plusieurs wikis.
        by_key = {
            (str(r.get("wiki") or ""), str(r.get("pagename") or "")): r for r in records
        }
    except Exception as exc:
        logger.info("Enrichissement /team non disponible : %s", exc)
        if gateway.rate_limited:
            return

    for team in pending:
        record = by_key.get((team.wiki or "", team.name.replace(" ", "_")))
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
            if not team.logo_url:
                team.logo_url = record.get("logourl") or None

        # /teamtemplate (1 requête/équipe, NON batchable) UNIQUEMENT en dernier
        # recours : quand le logo manque encore. On en profite pour le tag.
        if not team.logo_url and team.template and budget > 0 and not gateway.rate_limited:
            budget -= 1
            template_data = gateway.fetch_team_template(team.wiki, team.template)
            if template_data:
                shortname = (template_data.get("shortname") or "").strip()
                if shortname:
                    team.tag = shortname.upper()[:16]
                if not team.logo_url:
                    team.logo_url = template_data.get("imageurl") or None

        # Marqué enrichi seulement si /team a répondu (sinon on retentera).
        if record:
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
                if gateway.rate_limited:
                    break  # quota atteint : inutile d'enchaîner les autres groupes
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

        # Les rosters sont dérivés des match2players pendant l'upsert des matchs
        # (aucune requête dédiée). enrich_teams s'arrête net si un 429 survient.
        enrich_teams(session, gateway)
        session.commit()
        if gateway.rate_limited:
            logger.warning(
                "Quota Liquipedia atteint (429) : run écourté, reprise au prochain cycle."
            )
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
