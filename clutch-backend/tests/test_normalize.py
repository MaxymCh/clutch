"""Normalisation LPDB → contrat front (unitaires, sans appel réseau)."""

from datetime import datetime, timezone

from ingestion.normalize import (
    compute_status,
    country_to_iso,
    current_map_label,
    derive_tag,
    normalize_maps,
    normalize_match,
    to_best_of,
    translate_phase,
)

NOW = datetime(2026, 7, 11, 17, 0, tzinfo=timezone.utc)


def _lpdb_record(**overrides):
    """Enregistrement LPDB /match minimal mais réaliste."""
    record = {
        "match2id": "EWC_2026_VAL_R1M1",
        "wiki": "valorant",
        "pagename": "Esports_World_Cup/2026/Bracket",
        "parent": "Esports_World_Cup/2026",
        "date": datetime(2026, 7, 11, 16, 0),  # naïf = UTC (convention LPDB)
        "finished": 0,
        "bestof": 5,
        "section": "Semifinals",
        "tournament": "Esports World Cup 2026",
        "match2opponents": [
            {"name": "Team_Falcons", "template": "team falcons", "score": 2},
            {"name": "T1", "template": "t1", "score": 1},
        ],
        "match2games": [
            {"map": "Ascent", "scores": [13, 6], "winner": "1"},
            {"map": "Bind", "scores": [9, 13], "winner": "2"},
            {"map": "Split", "scores": [11, 9], "winner": ""},
        ],
    }
    record.update(overrides)
    return record


def test_normalize_match_complet_en_cours():
    result = normalize_match(_lpdb_record(), "val", NOW)
    assert result is not None
    assert result["id"] == "val_ewc-2026-val-r1m1"
    assert result["status"] == "upcoming"  # commencé mais pas fini : le live est calculé côté front
    assert result["best_of"] == "BO5"
    assert result["phase"] == "Demi-finale"  # Semifinals → FR
    assert result["start_time_utc"].tzinfo is not None  # UTC aware
    assert result["score_a"] == 2 and result["score_b"] == 1
    assert result["team_a"]["id"] == "team-falcons"
    assert result["team_a"]["name"] == "Team Falcons"  # underscores → espaces
    # 2 cartes décidées + la carte en cours marquée live
    assert result["maps"] == [
        {"name": "Ascent", "scoreA": 13, "scoreB": 6, "winner": "a"},
        {"name": "Bind", "scoreA": 9, "scoreB": 13, "winner": "b"},
        {"name": "Split", "scoreA": 11, "scoreB": 9, "live": True},
    ]
    # Même format que le front : "Split · 11–9"
    assert result["current_map_label"] == "Split · 11–9"
    # LPDB ne fournit pas d'audience : jamais inventée
    assert result["viewers"] is None


def test_statuts_front_exacts():
    """done / upcoming — valeurs EXACTES du contrat (le live est calculé côté front)."""
    start_past = datetime(2026, 7, 11, 16, 0, tzinfo=timezone.utc)
    start_future = datetime(2026, 7, 12, 16, 0, tzinfo=timezone.utc)
    assert compute_status(1, start_past, NOW) == "done"
    assert compute_status(0, start_past, NOW) == "upcoming"  # commencé, pas fini → upcoming
    assert compute_status(0, start_future, NOW) == "upcoming"


def test_match_upcoming_sans_scores():
    record = _lpdb_record(
        date=datetime(2026, 7, 12, 16, 0),
        match2games=[],
        match2opponents=[
            {"name": "Gen.G", "template": "geng", "score": -1},
            {"name": "T1", "template": "t1", "score": -1},
        ],
    )
    result = normalize_match(record, "val", NOW)
    assert result["status"] == "upcoming"
    assert result["score_a"] is None and result["score_b"] is None
    assert result["maps"] is None and result["current_map_label"] is None


def test_record_inexploitable_rejete():
    """Pas d'équipes ou pas de date → None, jamais de données fabriquées."""
    assert normalize_match(_lpdb_record(match2opponents=[]), "val", NOW) is None
    assert normalize_match(_lpdb_record(date=None), "val", NOW) is None
    assert normalize_match(_lpdb_record(match2id=""), "val", NOW) is None
    # Sentinelle LPDB « date inconnue » → rejet (bracket pas encore planifié)
    assert normalize_match(_lpdb_record(date="0000-01-01 00:00:00"), "val", NOW) is None


def test_placeholder_tbd_rejete():
    """Brackets pas encore publiés : opposants `tbd` → match ignoré,
    AUCUNE équipe fantôme « TBD » créée (cas réel constaté sur l'EWC 2026)."""
    record = _lpdb_record(
        match2opponents=[
            {"name": "", "template": "tbd", "score": -1},
            {"name": "", "template": "tbd", "score": -1},
        ]
    )
    assert normalize_match(record, "val", NOW) is None


def test_best_of_enum_front():
    assert to_best_of(5, 0) == "BO5"
    assert to_best_of(None, 3) == "BO3"  # dérivé du nombre de manches
    assert to_best_of(2, 0) == "BO3"  # hors enum front → défaut documenté
    assert to_best_of(None, 0) == "BO3"


def test_phase_traduite_ou_source():
    assert translate_phase("Grand Final") == "Grande Finale"
    assert translate_phase("Group Stage") == "Phase de groupes"
    assert translate_phase("Group A") == "Groupe A"
    assert translate_phase("Swiss Round 3") == "Swiss Round 3"  # inconnu : tel quel
    assert translate_phase(None, "EWC 2026") == "EWC 2026"


def test_pays_iso():
    assert country_to_iso("Saudi Arabia") == "SA"
    assert country_to_iso("South Korea") == "KR"
    assert country_to_iso("Europe") == "EU"
    assert country_to_iso(None, "Europe") == "EU"
    assert country_to_iso("Atlantis") == "XX"  # inconnu : marqueur, pas d'invention


def test_tag_derive_en_attendant_le_shortname():
    assert derive_tag("Team Falcons") == "TF"
    assert derive_tag("T1") == "T1"
    assert derive_tag("Natus Vincere") == "NV"


def test_maps_match_termine_sans_carte_live():
    maps = normalize_maps(
        [
            {"map": "Inferno", "scores": [13, 9], "winner": "1"},
            {"map": "Mirage", "scores": [8, 13], "winner": "2"},
            {"map": "Nuke", "scores": [13, 11], "winner": "1"},
        ],
        "done",
    )
    assert all("live" not in m for m in maps)
    assert current_map_label(maps) is None


def test_result_a_result_b_extraits_des_statuts_lpdb():
    """W/FF dans match2opponents[].status → result_a/result_b au top level du dict."""
    record = _lpdb_record(
        finished=1,
        match2opponents=[
            {"name": "Team_Falcons", "template": "team falcons", "score": 2, "status": "W"},
            {"name": "T1", "template": "t1", "score": 0, "status": "FF"},
        ],
    )
    result = normalize_match(record, "val", NOW)
    assert result is not None
    assert result["result_a"] == "W"
    assert result["result_b"] == "FF"


def test_result_none_pour_match_upcoming():
    """Avant le début du match, result_a et result_b doivent être None (aucune valeur anticipée)."""
    record = _lpdb_record(
        date=datetime(2026, 7, 12, 16, 0),  # futur par rapport à NOW
        match2opponents=[
            {"name": "Team_Falcons", "template": "team falcons", "score": -1, "status": ""},
            {"name": "T1", "template": "t1", "score": -1, "status": ""},
        ],
    )
    result = normalize_match(record, "val", NOW)
    assert result is not None
    assert result["status"] == "upcoming"
    assert result["result_a"] is None
    assert result["result_b"] is None


def test_forfeit_inferred_from_winner_when_score_is_0_0():
    record = _lpdb_record(
        finished=1,
        winner="2",
        bestof=3,
        match2games=[],
        match2opponents=[
            {"name": "Team_Falcons", "template": "team falcons", "score": 0, "status": "W"},
            {"name": "Dandelions", "template": "dandelions", "score": 0, "status": "FF"},
        ],
    )
    result = normalize_match(record, "dota", NOW)
    assert result is not None
    assert result["status"] == "done"
    # winner=2 => équipe B gagnante, score administratif BO3 = 0-2
    assert result["score_a"] == 0
    assert result["score_b"] == 2
    assert result["extradata"]["lpdb_winner"] == "2"
    assert result["extradata"]["forfeit_inferred"] is True
    assert result["extradata"]["lpdb_opponent_statuses"] == ["W", "FF"]
    assert result["extradata"]["forfeiting_side"] == "b"


def test_normalize_match_mlbb_draft():
    """MLBB : draft picks/bans depuis extradata, parties sans scores LPDB."""
    record = {
        "match2id": "BBROLS0FD1_0001",
        "wiki": "mobilelegends",
        "date": "2026-04-21 15:00:00",
        "finished": 1,
        "winner": "2",
        "bestof": 3,
        "section": "Week 1",
        "match2opponents": [
            {
                "name": "Aura Farmers",
                "template": "aura farmers",
                "score": 0,
                "status": "S",
                "match2players": [
                    {"name": "Summer_(Russian_player)", "displayname": "Summer", "flag": "Russia"},
                    {"name": "Inneskite", "displayname": "Inneskite", "flag": "Russia"},
                    {"name": "Twizy", "displayname": "Twizy", "flag": "Russia"},
                    {"name": "Gorьkiy", "displayname": "Gorьkiy", "flag": "Uzbekistan"},
                    {"name": "NEIL", "displayname": "NEIL", "flag": "Russia"},
                ],
            },
            {
                "name": "Team Spirit",
                "template": "team spirit",
                "score": 2,
                "status": "S",
                "match2players": [
                    {"name": "Kid_Bomba", "displayname": "Kid Bomba", "flag": "Germany"},
                    {"name": "Zaur_egoist", "displayname": "zaur egoist", "flag": "Russia"},
                    {"name": "Sunset_Lover", "displayname": "Sunset Lover", "flag": "Russia"},
                    {"name": "Hiko", "displayname": "Hiko", "flag": "Russia"},
                    {"name": "SAWO", "displayname": "SAWO", "flag": "Russia"},
                ],
            },
        ],
        "match2games": [
            {
                "map": "",
                "scores": [],
                "winner": "2",
                "length": "11:20",
                "opponents": [
                    {
                        "players": [
                            [], [], [], [], [],
                            {"champion": "Sora"},
                            {"champion": "Fanny"},
                            {"champion": "Yve"},
                            {"champion": "Karrie"},
                            {"champion": "Gatotkaca"},
                        ],
                    },
                    {
                        "players": [
                            [], [], [], [], [],
                            {"champion": "Freya"},
                            {"champion": "Suyou"},
                            {"champion": "Zhuxin"},
                            {"champion": "Moskov"},
                            {"champion": "Badang"},
                        ],
                    },
                ],
                "extradata": {
                    "team1champion1": "Sora",
                    "team1champion2": "Fanny",
                    "team1champion3": "Yve",
                    "team1champion4": "Karrie",
                    "team1champion5": "Gatotkaca",
                    "team2champion1": "Freya",
                    "team2champion2": "Suyou",
                    "team2champion3": "Zhuxin",
                    "team2champion4": "Moskov",
                    "team2champion5": "Badang",
                    "team1ban1": "Baxia",
                    "team1ban2": "Guinevere",
                    "team2ban1": "Phoveus",
                    "team2ban2": "Marcel",
                    "team1side": "blue",
                    "team2side": "red",
                },
            },
            {
                "map": "",
                "scores": [],
                "winner": "2",
                "length": "10:45",
                "extradata": {
                    "team1champion1": "Alice",
                    "team2champion1": "Freya",
                    "team1side": "blue",
                    "team2side": "red",
                },
            },
            {
                "map": "",
                "scores": [],
                "status": "notplayed",
                "resulttype": "np",
                "winner": "",
            },
        ],
    }
    now = datetime(2026, 4, 22, 12, 0, tzinfo=timezone.utc)
    result = normalize_match(record, "mlbb", now)
    assert result is not None
    assert result["status"] == "done"
    assert result["score_a"] == 0
    assert result["score_b"] == 2
    assert len(result["maps"]) == 2

    game1 = result["maps"][0]
    assert game1["name"] == "Partie 1"
    assert game1["scoreA"] == 0 and game1["scoreB"] == 1
    assert game1["winner"] == "b"
    assert game1["heroesA"] == ["Sora", "Fanny", "Yve", "Karrie", "Gatotkaca"]
    assert game1["heroesB"] == ["Freya", "Suyou", "Zhuxin", "Moskov", "Badang"]
    assert game1["bansA"] == ["Baxia", "Guinevere"]
    assert game1["bansB"] == ["Phoveus", "Marcel"]
    assert game1["sideA"] == "blue"
    assert game1["sideB"] == "red"
    assert game1["length"] == "11:20"
    assert any(p["champion"] == "Sora" and p["name"] == "Summer" for p in game1["players"])
    assert any(p["champion"] == "Freya" and p["side"] == "b" for p in game1["players"])

    assert result["maps"][1]["name"] == "Partie 2"


def test_normalize_match_hok_draft():
    """HoK : même schéma LPDB que MLBB (champions/bans extradata, scores par partie)."""
    record = {
        "match2id": "KPL26S2W01_0001",
        "wiki": "honorofkings",
        "date": "2026-06-17 06:11:00",
        "finished": 1,
        "winner": "2",
        "bestof": 5,
        "section": "Week 1",
        "match2opponents": [
            {
                "name": "Dragon Ranger Gaming",
                "template": "dragon ranger gaming orig",
                "score": 1,
                "status": "S",
                "match2players": [
                    {"name": "HuaYuan", "displayname": "Huayen", "flag": "China"},
                    {"name": "XiaoXiaoYang", "displayname": "XiaoXiaoYang", "flag": "China"},
                    {"name": "YouZi", "displayname": "YouZi", "flag": "China"},
                    {"name": "MengLan", "displayname": "MoonLan", "flag": "China"},
                    {"name": "ZiYang", "displayname": "ZiYang", "flag": "China"},
                ],
            },
            {
                "name": "Talent Gaming",
                "template": "talent gaming jan 2022",
                "score": 3,
                "status": "S",
                "match2players": [
                    {"name": "LuoBo", "displayname": "LuoBo", "flag": "China"},
                    {"name": "XiaoPang", "displayname": "Pang", "flag": "China"},
                    {"name": "HeCi", "displayname": "Crane", "flag": "China"},
                    {"name": "XiaoXue", "displayname": "Snowy", "flag": "China"},
                    {"name": "Han_(Huang_Hanxi)", "displayname": "Han", "flag": "China"},
                ],
            },
        ],
        "match2games": [
            {
                "map": "",
                "scores": [1, 0],
                "participants": [],
                "opponents": [{"status": "S", "score": 1}, {"status": "S", "score": 0}],
                "winner": "1",
                "length": "15:26",
                "vod": "https://v.qq.com/x/page/t3283pjne4d.html",
                "extradata": {
                    "team1champion1": "Bai Qi",
                    "team1champion2": "Ukyo Tachibana",
                    "team1champion3": "Xiao Qiao",
                    "team1champion4": "Ge Ya",
                    "team1champion5": "Kui",
                    "team2champion1": "Charlotte",
                    "team2champion2": "Dun",
                    "team2champion3": "Wu Ze Tian",
                    "team2champion4": "Erin",
                    "team2champion5": "Shieldun",
                    "team1ban1": "Ao'yin",
                    "team1ban2": "Master Luban",
                    "team2ban1": "Guan Yu",
                    "team2ban2": "Flowborn (Support)",
                    "team1side": "red",
                    "team2side": "blue",
                },
            },
            {
                "map": "",
                "scores": [0, 1],
                "participants": [],
                "winner": "2",
                "length": "15:11",
                "extradata": {
                    "team1champion1": "Sun Ce",
                    "team2champion1": "Bai Qi",
                    "team1side": "blue",
                    "team2side": "red",
                },
            },
            {
                "map": "",
                "scores": [0, 1],
                "participants": [],
                "winner": "2",
                "length": "14:02",
            },
            {
                "map": "",
                "scores": [0, 1],
                "participants": [],
                "winner": "2",
                "length": "12:49",
            },
            {
                "map": "",
                "scores": [],
                "status": "notplayed",
                "resulttype": "np",
                "winner": "",
            },
        ],
    }
    now = datetime(2026, 6, 18, 12, 0, tzinfo=timezone.utc)
    result = normalize_match(record, "hok", now)
    assert result is not None
    assert result["status"] == "done"
    assert result["score_a"] == 1
    assert result["score_b"] == 3
    assert len(result["maps"]) == 4

    game1 = result["maps"][0]
    assert game1["name"] == "Partie 1"
    assert game1["scoreA"] == 1 and game1["scoreB"] == 0
    assert game1["winner"] == "a"
    assert game1["heroesA"][0] == "Bai Qi"
    assert game1["heroesB"][0] == "Charlotte"
    assert game1["sideA"] == "red"
    assert game1["sideB"] == "blue"
    assert game1["vod"] == "https://v.qq.com/x/page/t3283pjne4d.html"
    assert any(p["champion"] == "Bai Qi" and p["name"] == "Huayen" for p in game1["players"])
    assert any(p["champion"] == "Charlotte" and p["side"] == "b" for p in game1["players"])
