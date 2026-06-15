"""Découverte des pagenames EWC sur les wikis Liquipedia.

Interroge l'endpoint /tournament en UNE requête multi-wikis (1 seul appel
au quota de 60/h) et affiche les tournois dont le nom contient le terme
recherché. Le pagename affiché est la valeur à mettre dans EWC_TOURNAMENTS.

Usage :
    python -m scripts.find_pagenames                 # "Esports World Cup", wikis val/lol/cs2
    python -m scripts.find_pagenames "World Cup" valorant dota2
"""

import sys

from liquipydia import LiquipediaClient

from app.core.config import get_settings
from ingestion.normalize import GAME_BY_WIKI

DEFAULT_WIKIS = ["valorant", "leagueoflegends", "counterstrike"]
DEFAULT_SEARCH = "Esports World Cup"


def main() -> None:
    search = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SEARCH
    wikis = sys.argv[2:] or DEFAULT_WIKIS
    settings = get_settings()

    # 1 requête multi-wikis (pipe). Le LIKE n'existe pas côté LPDB : on
    # récupère les tournois tier 1 et on filtre sur le nom ici.
    # ⚠️ Ne pas mettre "wiki" dans query (404) : il est renvoyé d'office.
    with LiquipediaClient(settings.liquipedia_user_agent, api_key=settings.liquipedia_api_key) as client:
        response = client.tournaments.list(
            "|".join(wikis),
            conditions="[[liquipediatier::1]]",
            query="pagename,name,startdate,enddate,liquipediatier",
            order="startdate DESC",
            limit=1000,
        )
    results = list(response.result)

    # L'événement est parfois abrégé « EWC » selon les wikis.
    needles = {search.lower(), "ewc", "esports world cup"}
    matching = [
        r for r in results
        if any(n in str(r.get("name") or "").lower() or n in str(r.get("pagename") or "").lower() for n in needles)
    ]
    if not matching:
        print(f"Aucun tournoi tier 1 contenant « {search} » sur {', '.join(wikis)}.")
        print("Tournois tier 1 les plus récents reçus (pour repérage) :")
        matching = results[:15]

    print(f"{'wiki':<18} {'gameId':<7} {'début':<12} {'fin':<12} pagename  (nom)")
    print("-" * 100)
    for record in matching:
        wiki = str(record.get("wiki") or "?")
        game_id = GAME_BY_WIKI.get(wiki, "?")
        print(
            f"{wiki:<18} {game_id:<7} {str(record.get('startdate') or '?'):<12} "
            f"{str(record.get('enddate') or '?'):<12} {record.get('pagename')}  ({record.get('name')})"
        )

    print(
        '\n-> Reporter dans .env : EWC_TOURNAMENTS={"<gameId>": "<pagename>", ...} '
        "puis redemarrer le worker (docker compose restart worker)."
    )


if __name__ == "__main__":
    main()
