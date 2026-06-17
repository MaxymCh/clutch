"""Barème de scoring validé : paliers EXCLUSIFS 25 / 10 / 0 + série."""

from datetime import datetime, timezone

from app.models.community import Prediction, User
from app.services.scoring import score_finished_matches
from tests.conftest import make_match, seed_catalog

UTC = timezone.utc


def _user(uid: str) -> User:
    return User(id=uid, name=f"clutcher_{uid}", tag="CL", country_code="FR", points=0, streak=0)


def _done_match(mid: str, hour: int, score_a: int, score_b: int):
    return make_match(
        id=mid, status="done",
        start_time_utc=datetime(2026, 7, 11, hour, 0, tzinfo=UTC),
        score_a=score_a, score_b=score_b,
        maps=None, current_map_label=None, viewers=None,
    )


async def test_paliers_exclusifs(session):
    """Score exact → 25 (PAS 35), bon vainqueur seul → 10, sinon 0."""
    await seed_catalog(session)
    session.add(_done_match("d1", 10, 3, 1))  # A gagne 3-1
    session.add(_user("exact"))
    session.add(_user("winner"))
    session.add(_user("wrong"))
    session.add_all(
        [
            Prediction(user_id="exact", match_id="d1", pick="a", score_a=3, score_b=1),
            Prediction(user_id="winner", match_id="d1", pick="a", score_a=3, score_b=0),
            Prediction(user_id="wrong", match_id="d1", pick="b", score_a=1, score_b=3),
        ]
    )
    await session.commit()

    assert await score_finished_matches(session) == 3

    assert (await session.get(User, "exact")).points == 25  # exclusif : pas 35
    assert (await session.get(User, "winner")).points == 10
    assert (await session.get(User, "wrong")).points == 0


async def test_streak_serie_de_bons_vainqueurs(session):
    """La série monte sur bon vainqueur (10 ou 25) et retombe à 0 sinon."""
    await seed_catalog(session)
    session.add_all(
        [
            _done_match("s1", 10, 2, 0),  # A gagne — prono bon → streak 1
            _done_match("s2", 12, 0, 2),  # B gagne — prono bon (exact) → streak 2
            _done_match("s3", 14, 2, 1),  # A gagne — prono mauvais → streak 0
        ]
    )
    session.add(_user("u1"))
    session.add_all(
        [
            Prediction(user_id="u1", match_id="s1", pick="a", score_a=2, score_b=1),
            Prediction(user_id="u1", match_id="s2", pick="b", score_a=0, score_b=2),
            Prediction(user_id="u1", match_id="s3", pick="b", score_a=1, score_b=2),
        ]
    )
    await session.commit()

    await score_finished_matches(session)

    user = await session.get(User, "u1")
    assert user.points == 10 + 25 + 0
    assert user.streak == 0  # cassée par s3

    # Idempotence : un second passage ne rescore rien
    assert await score_finished_matches(session) == 0
    assert (await session.get(User, "u1")).points == 35


async def test_les_matchs_non_termines_ne_sont_pas_scores(session):
    await seed_catalog(session)
    session.add(make_match(id="live1"))  # upcoming (non terminé)
    session.add(_user("u2"))
    session.add(Prediction(user_id="u2", match_id="live1", pick="a", score_a=3, score_b=0))
    await session.commit()

    assert await score_finished_matches(session) == 0
    assert (await session.get(User, "u2")).points == 0


async def test_match_ff_score_null_non_score(session):
    """Match done avec score_a/score_b null (FF sans score recalculé) → prono ignoré."""
    await seed_catalog(session)
    session.add(
        make_match(
            id="ff-null",
            status="done",
            start_time_utc=datetime(2026, 7, 11, 10, 0, tzinfo=UTC),
            score_a=None,
            score_b=None,
            maps=None,
            current_map_label=None,
            viewers=None,
        )
    )
    session.add(_user("u_ff"))
    session.add(Prediction(user_id="u_ff", match_id="ff-null", pick="a", score_a=2, score_b=0))
    await session.commit()

    assert await score_finished_matches(session) == 0
    assert (await session.get(User, "u_ff")).points == 0


async def test_egalite_de_serie_ignoree(session):
    """Score 1-1 sur un match done (cas anormal BO) → prono non scoré, points inchangés."""
    await seed_catalog(session)
    session.add(_done_match("draw1", 10, 1, 1))
    session.add(_user("u_draw"))
    session.add(Prediction(user_id="u_draw", match_id="draw1", pick="a", score_a=1, score_b=1))
    await session.commit()

    assert await score_finished_matches(session) == 0
    assert (await session.get(User, "u_draw")).points == 0
