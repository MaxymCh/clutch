"""Filtres et erreurs des endpoints catalogue."""

from datetime import datetime, timezone

from tests.conftest import make_match, seed_catalog

UTC = timezone.utc


async def _seed_three_matches(session_factory) -> None:
    async with session_factory() as session:
        await seed_catalog(session)
        session.add_all(
            [
                make_match(),  # m6 : val, flcn vs t1, live, 11/07
                make_match(
                    id="m17",
                    game_id="cs2",
                    team_a_id="navi",
                    team_b_id="faze",
                    status="upcoming",
                    phase="Grande Finale",
                    start_time_utc=datetime(2026, 7, 14, 18, 0, tzinfo=UTC),
                    score_a=None, score_b=None, maps=None,
                    current_map_label=None, viewers=None,
                ),
                make_match(
                    id="m1",
                    status="done",
                    phase="Phase de groupes",
                    best_of="BO3",
                    start_time_utc=datetime(2026, 7, 10, 12, 0, tzinfo=UTC),
                    score_a=2, score_b=0, maps=None,
                    current_map_label=None, viewers=None,
                ),
            ]
        )
        await session.commit()


async def test_filtre_game(client, session_factory):
    await _seed_three_matches(session_factory)
    ids = [m["id"] for m in (await client.get("/matches", params={"game": "cs2"})).json()]
    assert ids == ["m17"]


async def test_filtre_team(client, session_factory):
    await _seed_three_matches(session_factory)
    ids = [m["id"] for m in (await client.get("/matches", params={"team": "faze"})).json()]
    assert ids == ["m17"]


async def test_filtre_day_en_fuseau_affichage(client, session_factory):
    """m1 démarre à 12:00 UTC le 10/07 → 14:00 Paris : jour local 2026-07-10."""
    await _seed_three_matches(session_factory)
    ids = [m["id"] for m in (await client.get("/matches", params={"day": "2026-07-10"})).json()]
    assert ids == ["m1"]


async def test_filtre_status_et_q(client, session_factory):
    await _seed_three_matches(session_factory)
    ids = [m["id"] for m in (await client.get("/matches", params={"status": "live"})).json()]
    assert ids == ["m6"]
    ids = [m["id"] for m in (await client.get("/matches", params={"q": "falcons"})).json()]
    assert sorted(ids) == ["m1", "m6"]


async def test_tri_chronologique(client, session_factory):
    await _seed_three_matches(session_factory)
    ids = [m["id"] for m in (await client.get("/matches")).json()]
    assert ids == ["m1", "m6", "m17"]


async def test_teams_triees_par_nom(client, session_factory):
    await _seed_three_matches(session_factory)
    names = [t["name"] for t in (await client.get("/teams")).json()]
    assert names == sorted(names)


async def test_404_match_et_team(client, session_factory):
    await _seed_three_matches(session_factory)
    assert (await client.get("/matches/inconnu")).status_code == 404
    assert (await client.get("/teams/inconnu")).status_code == 404
