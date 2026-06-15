"""Communauté : session anonyme, groupes, leaderboard, pronostics."""

from datetime import datetime, timedelta, timezone

from tests.conftest import make_match, seed_catalog

UTC = timezone.utc


async def test_me_cree_un_utilisateur_anonyme_et_pose_le_cookie(client):
    response = await client.get("/me", headers={"Accept-Language": "en-US,en;q=0.9"})
    assert response.status_code == 200
    assert "clutch_session" in response.cookies

    me = response.json()
    assert set(me) == {"id", "name", "tag", "countryCode", "points", "globalRank", "streak"}
    assert me["name"].startswith("clutcher_")
    assert me["countryCode"] == "US"  # déduit d'Accept-Language
    assert me["points"] == 0 and me["streak"] == 0 and me["globalRank"] >= 1

    # Deuxième appel avec le cookie : MÊME utilisateur (pas de re-création)
    again = (await client.get("/me")).json()
    assert again["id"] == me["id"]


async def test_creation_et_rejointe_de_groupe(client, second_client):
    # Création — nom vide → « Mon groupe » (comportement du mock front)
    created = (await client.post("/groups", json={"name": "  ", "emoji": "🔥"})).json()
    assert created["name"] == "Mon groupe"
    assert created["emoji"] == "🔥"
    assert created["code"].startswith("CLTCH-")
    assert created["members"][0]["isMe"] is True

    # Un autre utilisateur rejoint via le code
    joined = (await second_client.post("/groups/join", json={"code": created["code"]})).json()
    assert joined["id"] == created["id"]
    assert len(joined["members"]) == 2
    # isMe est relatif au demandeur : exactement un membre marqué
    assert sum(1 for m in joined["members"] if m.get("isMe")) == 1

    # Code inconnu → 404
    assert (await client.post("/groups/join", json={"code": "NOPE-0000"})).status_code == 404

    # GET /groups liste les groupes du demandeur
    groups = (await second_client.get("/groups")).json()
    assert [g["id"] for g in groups] == [created["id"]]


async def test_prono_regles_du_front(client, session_factory):
    """Prono : match upcoming non commencé uniquement, scoreline cohérente."""
    future = datetime.now(UTC) + timedelta(hours=4)
    async with session_factory() as session:
        await seed_catalog(session)
        session.add(
            make_match(
                id="next", status="upcoming", start_time_utc=future,
                score_a=None, score_b=None, maps=None,
                current_map_label=None, viewers=None,
            )
        )
        session.add(make_match(id="started"))  # live, déjà commencé
        await session.commit()

    # BO5 : le vainqueur doit avoir exactement 3 — 3-1 valide
    ok = await client.post(
        "/predictions", json={"matchId": "next", "pick": "a", "scoreA": 3, "scoreB": 1}
    )
    assert ok.status_code == 201
    assert ok.json() == {"pick": "a", "scoreA": 3, "scoreB": 1}

    # Scoreline impossible pour un BO5 → 422
    bad = await client.post(
        "/predictions", json={"matchId": "next", "pick": "a", "scoreA": 2, "scoreB": 1}
    )
    assert bad.status_code == 422

    # Match déjà commencé → 409
    started = await client.post(
        "/predictions", json={"matchId": "started", "pick": "a", "scoreA": 3, "scoreB": 0}
    )
    assert started.status_code == 409

    # Match inexistant → 404
    missing = await client.post(
        "/predictions", json={"matchId": "ghost", "pick": "b", "scoreA": 0, "scoreB": 3}
    )
    assert missing.status_code == 404

    # Modification autorisée tant que le match n'a pas commencé (upsert)
    update = await client.post(
        "/predictions", json={"matchId": "next", "pick": "b", "scoreA": 1, "scoreB": 3}
    )
    assert update.status_code == 201

    # GET /predictions : PredictionMap, dernière valeur retenue
    predictions = (await client.get("/predictions")).json()
    assert predictions == {"next": {"pick": "b", "scoreA": 1, "scoreB": 3}}


async def test_leaderboard_trie_et_limite(client, second_client):
    # Deux utilisateurs créés via /me
    me_a = (await client.get("/me")).json()
    me_b = (await second_client.get("/me")).json()
    assert me_a["id"] != me_b["id"]

    board = (await client.get("/leaderboard")).json()
    assert len(board) == 2
    assert [e["rank"] for e in board] == [1, 2]
    assert set(board[0]) <= {"rank", "name", "tag", "points", "countryCode"}

    limited = (await client.get("/leaderboard", params={"limit": 1})).json()
    assert len(limited) == 1
