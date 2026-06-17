"""Communauté : session anonyme, groupes, leaderboard, pronostics."""

from datetime import datetime, timedelta, timezone

from tests.conftest import make_match, seed_catalog

UTC = timezone.utc


async def test_me_cree_un_utilisateur_et_retourne_son_profil(client):
    response = await client.get("/me")
    assert response.status_code == 200

    me = response.json()
    assert set(me) == {"id", "name", "tag", "countryCode", "points", "globalRank", "streak"}
    assert me["name"].startswith("clutcher_")
    assert me["points"] == 0 and me["streak"] == 0 and me["globalRank"] >= 1

    # Deuxième appel : MÊME utilisateur (identité stable par token)
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


async def test_historique_de_groupe_limite_aux_matchs_termines(client, second_client, session_factory):
    me_a = (await client.get("/me")).json()
    me_b = (await second_client.get("/me")).json()

    created = (await client.post("/groups", json={"name": "Historique", "emoji": "📚"})).json()
    await second_client.post("/groups/join", json={"code": created["code"]})

    done_match = make_match(
        id="done-history",
        status="done",
        start_time_utc=datetime(2026, 7, 10, 18, 0, tzinfo=UTC),
        score_a=2,
        score_b=1,
        maps=None,
        current_map_label=None,
        viewers=None,
    )
    upcoming_match = make_match(
        id="upcoming-history",
        status="upcoming",
        start_time_utc=datetime(2026, 7, 12, 18, 0, tzinfo=UTC),
        score_a=None,
        score_b=None,
        maps=None,
        current_map_label=None,
        viewers=None,
    )

    async with session_factory() as session:
        await seed_catalog(session)
        session.add_all([done_match, upcoming_match])
        await session.commit()

    async with session_factory() as session:
        from app.models.community import Prediction

        session.add_all(
            [
                Prediction(user_id=me_a["id"], match_id="done-history", pick="a", score_a=2, score_b=1, scored=True, points=25),
                Prediction(user_id=me_b["id"], match_id="done-history", pick="b", score_a=1, score_b=2, scored=True, points=0),
                Prediction(user_id=me_a["id"], match_id="upcoming-history", pick="a", score_a=2, score_b=0),
            ]
        )
        await session.commit()

    history = (await client.get(f"/groups/{created['id']}/history")).json()
    assert len(history) == 1
    assert history[0]["match"]["id"] == "done-history"
    assert all(member.get("prediction") is not None for member in history[0]["members"])
    assert history[0]["members"][0]["points"] == 25
    assert history[0]["members"][1]["points"] == 0


async def test_groupe_scope_par_jeu_filtre_historique_et_points(client, second_client, session_factory):
    me_a = (await client.get("/me")).json()

    created = (
        await client.post("/groups", json={"name": "LoL only", "emoji": "🎮", "gameIds": ["lol"]})
    ).json()
    assert created["gameIds"] == ["lol"]
    assert "teamId" not in created

    val_done = make_match(
        id="val-done",
        game_id="val",
        status="done",
        start_time_utc=datetime(2026, 7, 10, 18, 0, tzinfo=UTC),
        score_a=2,
        score_b=1,
        maps=None,
        current_map_label=None,
        viewers=None,
    )
    lol_done = make_match(
        id="lol-done",
        game_id="lol",
        team_a_id="navi",
        team_b_id="faze",
        status="done",
        start_time_utc=datetime(2026, 7, 11, 18, 0, tzinfo=UTC),
        score_a=2,
        score_b=0,
        maps=None,
        current_map_label=None,
        viewers=None,
    )

    async with session_factory() as session:
        await seed_catalog(session)
        session.add_all([val_done, lol_done])
        await session.commit()

    async with session_factory() as session:
        from app.models.community import Prediction

        session.add_all(
            [
                Prediction(user_id=me_a["id"], match_id="val-done", pick="a", score_a=2, score_b=1, scored=True, points=25),
                Prediction(user_id=me_a["id"], match_id="lol-done", pick="a", score_a=2, score_b=0, scored=True, points=25),
            ]
        )
        await session.commit()

    history = (await client.get(f"/groups/{created['id']}/history")).json()
    assert len(history) == 1
    assert history[0]["match"]["id"] == "lol-done"

    detail = (await client.get(f"/groups/{created['id']}")).json()
    assert detail["members"][0]["points"] == 25


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
        session.add(make_match(
            id="started",
            start_time_utc=datetime.now(UTC) - timedelta(hours=1),
            score_a=None, score_b=None, maps=None,
            current_map_label=None, viewers=None,
        ))  # upcoming mais déjà commencé (start passé)
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


async def test_historique_pronostics_ne_retourne_que_les_matchs_termines(client, session_factory):
    future = datetime.now(UTC) + timedelta(hours=4)
    past = datetime.now(UTC) - timedelta(hours=6)

    # Créer l'utilisateur d'abord pour récupérer son id
    me = (await client.get("/me")).json()

    async with session_factory() as session:
        await seed_catalog(session)
        session.add_all(
            [
                make_match(
                    id="done-past",
                    status="done",
                    start_time_utc=past,
                    score_a=2,
                    score_b=1,
                    maps=None,
                    current_map_label=None,
                    viewers=None,
                ),
                make_match(
                    id="upcoming-future",
                    status="upcoming",
                    start_time_utc=future,
                    score_a=None,
                    score_b=None,
                    maps=None,
                    current_map_label=None,
                    viewers=None,
                ),
            ]
        )
        await session.commit()

    # Insertion directe : l'API refuse les pronos sur matchs terminés
    async with session_factory() as session:
        from app.models.community import Prediction

        session.add_all(
            [
                Prediction(
                    user_id=me["id"], match_id="done-past",
                    pick="a", score_a=2, score_b=1, scored=False,
                ),
                Prediction(
                    user_id=me["id"], match_id="upcoming-future",
                    pick="a", score_a=2, score_b=0, scored=False,
                ),
            ]
        )
        await session.commit()

    history = (await client.get("/predictions/history")).json()
    assert len(history) == 1
    assert history[0]["match"]["id"] == "done-past"
    assert history[0]["points"] == 25
    assert history[0]["prediction"] == {"pick": "a", "scoreA": 2, "scoreB": 1}


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
