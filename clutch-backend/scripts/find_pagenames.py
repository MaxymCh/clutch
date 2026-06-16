"""Découverte des pagenames EWC sur les wikis Liquipedia.

Interroge l'endpoint /tournament en requête multi-wikis (pipe) et affiche les
tournois dont le nom contient le terme recherché. Le pagename affiché est la
valeur à mettre dans EWC_TOURNAMENTS.

Usage :
    python -m scripts.find_pagenames                 # tous les wikis du catalogue
    python -m scripts.find_pagenames "World Cup" valorant dota2
    python -m scripts.find_pagenames "Esports World Cup" val lol cs2 tft tk8
"""

import sys

from liquipydia import LiquipediaClient
from liquipydia._exceptions import NotFoundError

from app.core.config import get_settings
from ingestion.normalize import GAME_BY_WIKI, GAMES_BY_WIKI, WIKI_BY_GAME

DEFAULT_SEARCH = "Esports World Cup"
DEFAULT_WIKIS = sorted(set(WIKI_BY_GAME.values()))

# Anciens slugs ou alias CLI → slug LPDB réel.
WIKI_ALIASES: dict[str, str] = {
    "tekken": "fighters",
    "tekken8": "fighters",
    "teamfighttactics": "tft",
    "tft": "tft",
}


def resolve_wikis(argv_wikis: list[str]) -> list[str]:
    """gameId (val), alias (tekken) ou slug wiki → liste dédupliquée."""
    resolved: list[str] = []
    seen: set[str] = set()
    for raw in argv_wikis:
        wiki = WIKI_BY_GAME.get(raw) or WIKI_ALIASES.get(raw, raw)
        if wiki not in seen:
            seen.add(wiki)
            resolved.append(wiki)
    return resolved


def fetch_tournaments(client: LiquipediaClient, wikis: list[str]) -> tuple[list[dict], list[str]]:
    """Récupère les tournois tier 1 ; retourne (résultats, wikis en échec)."""
    if not wikis:
        return [], []

    try:
        response = client.tournaments.list(
            "|".join(wikis),
            conditions="[[liquipediatier::1]]",
            query="pagename,name,startdate,enddate,liquipediatier",
            order="startdate DESC",
            limit=1000,
        )
        return list(response.result), []
    except NotFoundError:
        pass

    # Un wiki invalide dans le pipe fait échouer toute la requête : on isole.
    results: list[dict] = []
    failed: list[str] = []
    for wiki in wikis:
        try:
            response = client.tournaments.list(
                wiki,
                conditions="[[liquipediatier::1]]",
                query="pagename,name,startdate,enddate,liquipediatier",
                order="startdate DESC",
                limit=1000,
            )
            results.extend(response.result)
        except NotFoundError:
            failed.append(wiki)
    return results, failed


def search_needles(search: str) -> set[str]:
    needles = {search.lower(), "ewc", "esports world cup"}
    # Certains wikis nomment l'événement autrement (PUBG Mobile World Cup, HoK…).
    needles.update(
        {
            "pubg mobile world cup",
            "pubg_mobile_world_cup",
            "honor of kings world cup",
            "honor_of_kings_world_cup",
        }
    )
    return needles


def main() -> None:
    search = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SEARCH
    wikis = resolve_wikis(sys.argv[2:]) or DEFAULT_WIKIS
    settings = get_settings()

    # ⚠️ Ne pas mettre "wiki" dans query (404) : il est renvoyé d'office.
    with LiquipediaClient(settings.liquipedia_user_agent, api_key=settings.liquipedia_api_key) as client:
        results, failed = fetch_tournaments(client, wikis)

    if failed:
        print(
            "Wikis sans endpoint /tournament (ignorés) : "
            + ", ".join(f"{w} ({GAME_BY_WIKI.get(w, '?')})" for w in failed)
        )
        print("  → tk8 : pagename sous fighters, ex. Esports_World_Cup/2025/T8")
        print("  → mlbb : pas d'EWC tier 1 ; vérifier manuellement sur Liquipedia.\n")

    needles = search_needles(search)
    matching = [
        r
        for r in results
        if any(
            n in str(r.get("name") or "").lower() or n in str(r.get("pagename") or "").lower()
            for n in needles
        )
    ]
    if not matching:
        print(f"Aucun tournoi tier 1 contenant « {search} » sur {', '.join(wikis)}.")
        print("Tournois tier 1 les plus récents reçus (pour repérage) :")
        matching = results[:15]

    print(f"{'wiki':<18} {'gameId':<7} {'debut':<12} {'fin':<12} pagename  (nom)")
    print("-" * 100)
    for record in matching:
        wiki = str(record.get("wiki") or "?")
        game_id = ",".join(GAMES_BY_WIKI.get(wiki, [GAME_BY_WIKI.get(wiki, "?")]))
        print(
            f"{wiki:<18} {game_id:<7} {str(record.get('startdate') or '?'):<12} "
            f"{str(record.get('enddate') or '?'):<12} {record.get('pagename')}  ({record.get('name')})"
        )

    print(
        '\n-> Reporter dans .env : EWC_TOURNAMENTS={"<gameId>": "<pagename>", ...} '
        "puis redemarrer le worker (docker compose restart worker)."
    )
    print("   Exemples : pubg -> PUBG_Mobile_World_Cup/2025 | tk8 -> Esports_World_Cup/2025/T8 | tft -> Esports_World_Cup/2025")


if __name__ == "__main__":
    main()
