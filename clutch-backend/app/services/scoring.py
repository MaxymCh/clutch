"""Scoring des pronostics — tâche planifiée CÔTÉ API (jamais le worker).

Barème validé, paliers EXCLUSIFS :
- 25 pts si score exact (implique le bon vainqueur) ;
- sinon 10 pts si bon vainqueur ;
- sinon 0.
`streak` = pronostics gagnants (bon vainqueur) consécutifs.
Les rangs ne sont pas stockés : ils sont recalculés à la lecture (tri desc).
"""

import logging

from sqlalchemy import asc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Match
from app.models.community import Prediction, User

logger = logging.getLogger("clutch.scoring")

EXACT_SCORE_POINTS = 25
CORRECT_WINNER_POINTS = 10


def compute_points(prediction: Prediction, match: Match) -> int:
    """Applique le barème exclusif 25 / 10 / 0."""
    if prediction.score_a == match.score_a and prediction.score_b == match.score_b:
        return EXACT_SCORE_POINTS
    winner = "a" if (match.score_a or 0) > (match.score_b or 0) else "b"
    return CORRECT_WINNER_POINTS if prediction.pick == winner else 0


async def score_finished_matches(session: AsyncSession) -> int:
    """Score tous les pronos en attente dont le match est passé à `done`.

    Traités par ordre chronologique de match pour que la série (`streak`)
    reste cohérente. Retourne le nombre de pronos scorés.
    """
    rows = (
        await session.execute(
            select(Prediction, Match)
            .join(Match, Match.id == Prediction.match_id)
            .where(
                Prediction.scored.is_(False),
                Match.status == "done",
                Match.score_a.is_not(None),
                Match.score_b.is_not(None),
            )
            .order_by(asc(Match.start_time_utc), asc(Match.id))
        )
    ).all()

    scored = 0
    for prediction, match in rows:
        if match.score_a == match.score_b:
            # Égalité de série : cas anormal pour un BO, on ne score pas.
            logger.warning("Match %s terminé sur une égalité, prono %s ignoré", match.id, prediction.id)
            continue

        points = compute_points(prediction, match)
        prediction.points = points
        prediction.scored = True

        user = await session.get(User, prediction.user_id)
        if user:
            user.points += points
            user.streak = user.streak + 1 if points >= CORRECT_WINNER_POINTS else 0
        scored += 1

    if scored:
        await session.commit()
        logger.info("Scoring : %d prono(s) scoré(s)", scored)
    return scored
