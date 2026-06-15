"""Wrapper liquipydia — SEULE porte d'accès à Liquipedia de tout le projet.

- Clé API + User-Agent descriptif (contact) lus depuis .env.
- Rate limit 60 req/h : requêtes multi-wikis (pipe), sélection de champs,
  comptage des appels exposé pour le log du worker. liquipydia gère déjà
  les retries avec backoff exponentiel sur HTTP 429.
"""

import logging
from typing import Any

from liquipydia import LiquipediaClient
from liquipydia._exceptions import RateLimitError

from app.core.config import get_settings

logger = logging.getLogger("clutch.ingestion")

# Sélection de champs : on ne facture au quota que ce que normalize.py utilise.
# ⚠️ Ne JAMAIS mettre "wiki" ici : ce n'est pas une colonne sélectionnable
# (l'API renvoie 404), mais elle est toujours présente dans la réponse.
MATCH_QUERY_FIELDS = ",".join(
    [
        "match2id",
        "pagename",
        "parent",
        "date",
        "dateexact",
        "finished",
        "status",
        "winner",
        "bestof",
        "section",
        "tournament",
        "tickername",
        "match2opponents",
        "match2games",
        "extradata",
        # URLs de diffusion : ne sortent QUE si streamurls=true est passé.
        "stream",
    ]
)

TEAM_QUERY_FIELDS = "pagename,name,template,locations,region,logourl"


class LiquipediaGateway:
    """Client haut niveau utilisé par le worker (sync, comme liquipydia)."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.liquipedia_api_key:
            logger.warning("LIQUIPEDIA_API_KEY absent du .env : les appels échoueront (403).")
        # app_name alimente le User-Agent ; il DOIT être descriptif + contact.
        # max_retries=0 : on NE retente PAS un 429. Sinon liquipydia dort
        # jusqu'à 60 s × 3 par appel et le worker s'enlise une fois le quota
        # atteint. On préfère échouer vite et reprendre au prochain run.
        self._client = LiquipediaClient(
            settings.liquipedia_user_agent,
            api_key=settings.liquipedia_api_key or None,
            max_retries=settings.liquipedia_max_retries,
        )
        self.calls = 0
        # Passe à True dès le premier 429 : le worker stoppe alors les appels
        # restants pour préserver la fenêtre de quota (60 req/h).
        self.rate_limited = False

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "LiquipediaGateway":
        return self

    def __exit__(self, *exc_info: object) -> None:
        self.close()

    # --- Requêtes ---

    def fetch_tournament_matches(self, wikis: list[str], pagename: str) -> list[dict[str, Any]]:
        """Matchs d'un tournoi, en UNE requête multi-wikis (économie de quota).

        Les matchs vivent souvent sur des sous-pages (brackets) : on filtre
        sur parent OU pagename.
        """
        conditions = f"[[parent::{pagename}]] OR [[pagename::{pagename}]]"
        self.calls += 1
        try:
            response = self._client.matches.list(
                "|".join(wikis),
                conditions=conditions,
                query=MATCH_QUERY_FIELDS,
                limit=1000,
                order="date ASC",
                # Sans ce flag, le champ `stream` ne contient pas les URLs.
                streamurls=True,
            )
        except RateLimitError:
            self.rate_limited = True
            raise
        logger.info(
            "LPDB /match wiki=%s parent=%s → %d enregistrement(s)",
            "|".join(wikis), pagename, len(response.result),
        )
        return list(response.result)

    def fetch_teams(self, wiki: str, pagenames: list[str]) -> list[dict[str, Any]]:
        """Fiches équipes batchées en UNE requête (multi-wiki + OR sur pagename).

        `wiki` peut être pipe-séparé ("valorant|leagueoflegends|counterstrike") :
        un seul appel couvre alors tous les wikis. `limit` est par wiki côté LPDB.
        """
        if not pagenames:
            return []
        conditions = " OR ".join(f"[[pagename::{p}]]" for p in pagenames)
        self.calls += 1
        try:
            response = self._client.teams.list(
                wiki,
                conditions=conditions,
                query=TEAM_QUERY_FIELDS,
                limit=min(1000, max(len(pagenames) + 10, 100)),
            )
        except RateLimitError:
            self.rate_limited = True
            raise
        return list(response.result)

    def fetch_team_template(self, wiki: str, template: str) -> dict[str, Any] | None:
        """Shortname/bracketname d'une équipe via /teamtemplate (1 requête)."""
        self.calls += 1
        try:
            response = self._client.team_templates.get(wiki, template)
        except RateLimitError:
            self.rate_limited = True
            logger.info("teamtemplate %s/%s : quota atteint (429).", wiki, template)
            return None
        except Exception as exc:  # template absent → on garde le tag dérivé
            logger.info("teamtemplate %s/%s indisponible : %s", wiki, template, exc)
            return None
        return response.result[0] if response.result else None
