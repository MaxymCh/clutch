"""Endpoint d'authentification Supabase — usage Swagger uniquement.

Le front utilise le SDK Supabase directement ; cet endpoint sert uniquement
à obtenir un token depuis l'interface Swagger (/docs) pour tester l'API.
"""

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(tags=["auth"])


class TokenIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post(
    "/auth/token",
    response_model=TokenOut,
    summary="Obtenir un JWT Supabase (Swagger uniquement)",
)
async def get_token(payload: TokenIn) -> TokenOut:
    """Échange un email/mot de passe Supabase contre un JWT Bearer.

    Colle ensuite ce token dans le bouton **Authorize** en haut de cette page.
    """
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.supabase_url}/auth/v1/token?grant_type=password",
            headers={"apikey": settings.supabase_anon_key},
            json={"email": payload.email, "password": payload.password},
            timeout=10,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    return TokenOut(access_token=resp.json()["access_token"])
