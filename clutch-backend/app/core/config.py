"""Configuration de l'application — tout vient du .env (aucun secret en dur).

Les champs sont mappés automatiquement sur les variables d'environnement
homonymes (insensible à la casse) : DATABASE_URL → database_url, etc.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Réglages globaux, partagés par l'API et le worker d'ingestion."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Base de données ---
    database_url: str = "postgresql+psycopg://clutch:clutch@localhost:5432/clutch"

    # --- Liquipedia (utilisé UNIQUEMENT par ingestion/, jamais par l'API) ---
    liquipedia_api_key: str = ""
    # User-Agent descriptif avec contact (exigé par Liquipedia, UA génériques bloqués).
    liquipedia_user_agent: str = "Clutch/0.1 (projet etudiant ETNA; contact requis dans .env)"
    # Tournois EWC 2026 cibles : {gameId front: pagename Liquipedia}.
    ewc_tournaments: dict[str, str] = {}
    ingest_interval_minutes: int = 15
    # Retries sur 429 : 0 = échec immédiat (recommandé, le worker reprend au
    # prochain run au lieu de dormir jusqu'à 60 s × N et d'épuiser le quota).
    liquipedia_max_retries: int = 0

    # --- API ---
    # Fuseau de SORTIE des champs date/time (stockage interne : UTC).
    display_tz: str = "Europe/Paris"
    cors_origins: list[str] = ["http://localhost:5173"]
    # Secret JWT Supabase (dashboard Supabase → Settings → API → JWT Secret).
    supabase_jwt_secret: str = "changeme"
    # URL + clé anon Supabase (utilisées uniquement par POST /auth/token pour Swagger).
    supabase_url: str = ""
    supabase_anon_key: str = ""
    scoring_interval_seconds: int = 60


@lru_cache
def get_settings() -> Settings:
    """Instance unique des réglages (lecture du .env une seule fois)."""
    return Settings()
