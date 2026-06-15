"""Test de PARITÉ : la réponse de l'API doit avoir exactement la forme des
fixtures mock du front (mêmes clés, mêmes types, mêmes valeurs).

C'est la preuve que le branchement front ↔ back se fera sans toucher au front.
"""

from datetime import datetime, timezone

from tests.conftest import make_match, seed_catalog
from tests.fixtures_front import (
    FRONT_GAME_VAL,
    FRONT_MATCH_M6,
    FRONT_MATCH_M17,
    FRONT_TEAM_FLCN,
    OMITTED_BY_API,
)


def assert_parity(api_payload: dict, front_fixture: dict) -> None:
    """Mêmes clés (à oddsA près, omission actée), mêmes types, mêmes valeurs."""
    expected = {k: v for k, v in front_fixture.items() if k not in OMITTED_BY_API}
    assert set(api_payload.keys()) == set(expected.keys()), (
        f"Clés divergentes — API : {sorted(api_payload)} / front : {sorted(expected)}"
    )
    for key, value in expected.items():
        assert type(api_payload[key]) is type(value), f"Type divergent pour {key!r}"
        assert api_payload[key] == value, f"Valeur divergente pour {key!r}"


async def test_match_live_complet_identique_au_mock_front(client, session_factory):
    """m6 (live) : équipes embarquées, maps, currentMapLabel, viewers."""
    async with session_factory() as session:
        await seed_catalog(session)
        session.add(make_match())
        await session.commit()

    response = await client.get("/matches/m6")
    assert response.status_code == 200
    assert_parity(response.json(), FRONT_MATCH_M6)


async def test_match_upcoming_sans_champs_optionnels(client, session_factory):
    """m17 (upcoming) : AUCUN champ optionnel ne doit sortir (ni null)."""
    async with session_factory() as session:
        await seed_catalog(session)
        session.add(
            make_match(
                id="m17",
                game_id="cs2",
                team_a_id="navi",
                team_b_id="faze",
                status="upcoming",
                phase="Grande Finale",
                # 20:00 Europe/Paris (été) le 14/07/2026 → 18:00 UTC
                start_time_utc=datetime(2026, 7, 14, 18, 0, tzinfo=timezone.utc),
                score_a=None,
                score_b=None,
                maps=None,
                current_map_label=None,
                viewers=None,
            )
        )
        await session.commit()

    response = await client.get("/matches/m17")
    assert response.status_code == 200
    assert_parity(response.json(), FRONT_MATCH_M17)


async def test_team_et_game_identiques_au_mock_front(client, session_factory):
    async with session_factory() as session:
        await seed_catalog(session)

    team = (await client.get("/teams/flcn")).json()
    assert team == FRONT_TEAM_FLCN

    games = (await client.get("/games")).json()
    assert games[0] == FRONT_GAME_VAL
    # Ordre GAME_ORDER du front (val avant lol avant cs2)
    assert [g["id"] for g in games] == ["val", "lol", "cs2"]


async def test_liste_matches_meme_forme(client, session_factory):
    async with session_factory() as session:
        await seed_catalog(session)
        session.add(make_match())
        await session.commit()

    payload = (await client.get("/matches")).json()
    assert isinstance(payload, list) and len(payload) == 1
    assert_parity(payload[0], FRONT_MATCH_M6)
