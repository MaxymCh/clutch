"""Assets tiers proxifiés côté serveur (contournement CORS navigateur)."""

from fastapi import APIRouter, HTTPException

from app.services.hok_assets import get_hok_hero_icons
from app.services.mlbb_assets import get_mlbb_hero_icons

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/mlbb/heroes")
async def mlbb_heroes() -> dict[str, str]:
    """Map slug héros → URL portrait MLBB (source : mlbb.rone.dev)."""
    try:
        return await get_mlbb_hero_icons()
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Impossible de charger les icônes héros MLBB",
        ) from exc


@router.get("/hok/heroes")
async def hok_heroes() -> dict[str, str]:
    """Map slug héros → URL portrait HoK (Tencent CDN + alias Liquipedia)."""
    return await get_hok_hero_icons()
