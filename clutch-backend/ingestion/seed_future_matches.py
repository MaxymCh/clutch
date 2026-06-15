"""Seed de matchs futurs pour le dev local.

Génère des matchs `upcoming` à partir des matchs existants en base, afin de
tester les parcours front et pronostics sur des rencontres à venir.

Lancement:
    python -m ingestion.seed_future_matches --count 24 --replace
"""

from __future__ import annotations

import argparse
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, desc, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

from app.core.config import get_settings
from app.models.catalog import Match, utcnow

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("clutch.seed.future")

SEED_ID_PREFIX = "seed-"


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _phase_for_seed(phase: str) -> str:
    suffix = " (Simulation)"
    candidate = f"{phase}{suffix}"
    return candidate[:64]


def _seed_match_id(source: Match, slot: datetime, ordinal: int) -> str:
    slot_key = _as_utc(slot).strftime("%Y%m%d%H%M")
    parts = [
        source.game_id,
        source.team_a_id,
        source.team_b_id,
        slot_key,
        str(ordinal),
    ]
    return f"{SEED_ID_PREFIX}{'-'.join(parts)}"[:128]


def build_seed_payloads(
    sources: list[Match],
    *,
    now: datetime,
    count: int,
    start_in_hours: int,
    spacing_hours: int,
) -> list[dict[str, object]]:
    """Construit des matchs futurs `upcoming` basés sur les matchs source."""
    if count <= 0:
        return []
    if not sources:
        raise ValueError("Impossible de générer des matchs futurs : aucun match source disponible")

    base = _as_utc(now) + timedelta(hours=start_in_hours)
    base = base.replace(minute=0, second=0, microsecond=0)

    payloads: list[dict[str, object]] = []
    for index in range(count):
        source = sources[index % len(sources)]
        slot = base + timedelta(hours=index * spacing_hours)
        payloads.append(
            {
                "id": _seed_match_id(source, slot, index),
                "game_id": source.game_id,
                "team_a_id": source.team_a_id,
                "team_b_id": source.team_b_id,
                "status": "upcoming",
                "phase": _phase_for_seed(source.phase),
                "best_of": source.best_of,
                "start_time_utc": slot,
                "score_a": None,
                "score_b": None,
                "maps": None,
                "current_map_label": None,
                "viewers": None,
                "extradata": source.extradata,
                "updated_at": utcnow(),
            }
        )
    return payloads


def _upsert_seed_match(session: Session, payload: dict[str, object]) -> None:
    match = session.get(Match, str(payload["id"]))
    if match is None:
        session.add(Match(**payload))
        return
    for key, value in payload.items():
        setattr(match, key, value)


def seed_future_matches(*, count: int, start_in_hours: int, spacing_hours: int, replace: bool) -> int:
    """Crée/actualise des matchs futurs en base à partir des matchs existants."""
    settings = get_settings()
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    session_local = sessionmaker(engine)

    with session_local() as session:
        if replace:
            session.execute(delete(Match).where(Match.id.like(f"{SEED_ID_PREFIX}%")))

        source_matches = list(
            session.scalars(
                select(Match)
                .where(~Match.id.like(f"{SEED_ID_PREFIX}%"))
                .order_by(desc(Match.start_time_utc), Match.id)
            )
        )
        payloads = build_seed_payloads(
            source_matches,
            now=datetime.now(timezone.utc),
            count=count,
            start_in_hours=start_in_hours,
            spacing_hours=spacing_hours,
        )

        for payload in payloads:
            _upsert_seed_match(session, payload)

        session.commit()
        logger.info("Seed terminé : %d match(s) futurs `upcoming` générés.", len(payloads))
        return len(payloads)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Génère des matchs futurs `upcoming` pour le dev")
    parser.add_argument("--count", type=int, default=24, help="Nombre de matchs futurs à générer")
    parser.add_argument(
        "--start-in-hours",
        type=int,
        default=2,
        help="Décalage en heures avant le premier match seedé",
    )
    parser.add_argument(
        "--spacing-hours",
        type=int,
        default=6,
        help="Espacement en heures entre deux matchs seedés",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Supprime d'abord les anciens matchs seedés (id commençant par seed-)",
    )
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    if args.count < 1:
        parser.error("--count doit être >= 1")
    if args.start_in_hours < 0:
        parser.error("--start-in-hours doit être >= 0")
    if args.spacing_hours < 1:
        parser.error("--spacing-hours doit être >= 1")

    created = seed_future_matches(
        count=args.count,
        start_in_hours=args.start_in_hours,
        spacing_hours=args.spacing_hours,
        replace=args.replace,
    )
    logger.info("Terminé: %d match(s) seedés.", created)


if __name__ == "__main__":
    main()
