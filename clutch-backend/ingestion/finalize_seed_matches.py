"""Clôture des matchs seedés pour tester le scoring et les historiques.

Le script marque les premiers matchs `seed-*` comme `done`, applique un score
déterministe selon le format BO, puis déclenche le scoring applicatif.

Lancement:
    python -m ingestion.finalize_seed_matches --count 2
"""

from __future__ import annotations

import argparse
import asyncio
import logging
from collections.abc import Sequence
from datetime import datetime, timezone

from sqlalchemy import asc, select

from app.core.db import SessionLocal
from app.models.catalog import Match
from app.services.scoring import score_finished_matches

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("clutch.seed.finalize")

SEED_ID_PREFIX = "seed-"


def _scoreline(best_of: str, winner_side: str) -> tuple[int, int]:
    if best_of == "BO1":
        return (1, 0) if winner_side == "a" else (0, 1)
    if best_of == "BO5":
        return (3, 1) if winner_side == "a" else (1, 3)
    return (2, 1) if winner_side == "a" else (1, 2)


async def finalize_seed_matches(count: int = 2, match_ids: Sequence[str] | None = None) -> int:
    """Passe des matchs seedés en `done` et leur attribue un score.

    Si `match_ids` est fourni, seuls ces matchs sont clôturés.
    Sinon, on prend les premiers matchs `seed-*` par ordre chronologique.
    """
    async with SessionLocal() as session:
        stmt = select(Match).where(Match.id.like(f"{SEED_ID_PREFIX}%"))
        if match_ids:
            stmt = stmt.where(Match.id.in_(list(match_ids)))
        stmt = stmt.order_by(asc(Match.start_time_utc), asc(Match.id)).limit(count)
        matches = list(await session.scalars(stmt))

        for index, match in enumerate(matches):
            winner_side = "a" if index % 2 == 0 else "b"
            score_a, score_b = _scoreline(match.best_of, winner_side)
            match.status = "done"
            match.score_a = score_a
            match.score_b = score_b
            match.maps = None
            match.current_map_label = None
            match.viewers = None
            match.updated_at = datetime.now(timezone.utc)

        await session.commit()

    async with SessionLocal() as session:
        scored = await score_finished_matches(session)

    logger.info("Clôture terminée : %d match(s) finalisé(s), %d prono(s) scoré(s).", len(matches), scored)
    return len(matches)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Clôture des matchs seedés pour tester le scoring")
    parser.add_argument("--count", type=int, default=2, help="Nombre de matchs seedés à clôturer")
    parser.add_argument(
        "--match-id",
        action="append",
        dest="match_ids",
        default=[],
        help="Clôture un match seedé précis (répétable)",
    )
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    if args.count < 1:
        parser.error("--count doit être >= 1")

    asyncio.run(finalize_seed_matches(count=args.count, match_ids=args.match_ids or None))


if __name__ == "__main__":
    main()
