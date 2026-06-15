"""Vérification des JWT Supabase — supporte HS256 et ES256 (Google OAuth)."""

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException

from app.core.config import get_settings

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        url = get_settings().supabase_url.rstrip("/")
        _jwks_client = PyJWKClient(f"{url}/auth/v1/.well-known/jwks.json", cache_jwk_set=True)
    return _jwks_client


def verify_supabase_token(token: str) -> str:
    """Vérifie le JWT Supabase et retourne l'id utilisateur (UUID sans tirets, 32 chars)."""
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

    supabase_id: str | None = payload.get("sub")
    if not supabase_id:
        raise HTTPException(status_code=401, detail="Token sans sujet")

    return supabase_id.replace("-", "")
