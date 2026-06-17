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


def test_normalize_match_complet_live():
    result = normalize_match(_lpdb_record(), "val", NOW)
    assert result is not None
    assert result["id"] == "val_ewc-2026-val-r1m1"
    assert result["status"] == "live"  # commencé, pas fini
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
    """done / live / upcoming — valeurs EXACTES du contrat (pas `finished`)."""
    start_past = datetime(2026, 7, 11, 16, 0, tzinfo=timezone.utc)
    start_future = datetime(2026, 7, 12, 16, 0, tzinfo=timezone.utc)
    assert compute_status(1, start_past, NOW) == "done"
    assert compute_status(0, start_past, NOW) == "live"
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
