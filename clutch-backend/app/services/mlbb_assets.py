"""Proxy serveur des icônes héros MLBB (mlbb.rone.dev ne permet pas le CORS navigateur)."""

import re
import time
from typing import Any

import httpx

MLBB_HEROES_URL = "https://mlbb.rone.dev/api/heroes"
_CACHE_TTL_SECONDS = 86_400  # 24 h — même esprit que staleTime Infinity côté front

_cache: dict[str, str] | None = None
_cache_at: float = 0.0


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


async def get_mlbb_hero_icons() -> dict[str, str]:
    """Slug de héros → URL portrait (cache mémoire process)."""
    global _cache, _cache_at
    now = time.monotonic()
    if _cache is not None and now - _cache_at < _CACHE_TTL_SECONDS:
        return _cache

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(MLBB_HEROES_URL)
        response.raise_for_status()
        body: dict[str, Any] = response.json()

    icons: dict[str, str] = {}
    for rec in (body.get("data") or {}).get("records") or []:
        if not isinstance(rec, dict):
            continue
        hero = ((rec.get("data") or {}).get("hero") or {}).get("data") or {}
        if not isinstance(hero, dict):
            continue
        name = str(hero.get("name") or "").strip()
        head = str(hero.get("head") or "").strip()
        if name and head:
            icons[_slug(name)] = head

    _cache = icons
    _cache_at = now
    return icons
