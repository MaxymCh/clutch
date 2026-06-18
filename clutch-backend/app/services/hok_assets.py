"""Proxy serveur des icônes héros HoK (Tencent CDN via herolist officiel)."""

import re
import time
from typing import Any

import httpx

HOK_HERO_LIST_URL = "https://pvp.qq.com/web201605/js/herolist.json"
HOK_ICON_CDN = "https://game.gtimg.cn/images/yxzj/img201606/heroimg/{id}/{id}.jpg"
_CACHE_TTL_SECONDS = 86_400

_cache: dict[str, str] | None = None
_cache_at: float = 0.0


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def _icon_url(hero_id: str) -> str:
    return HOK_ICON_CDN.format(id=hero_id)


async def get_hok_hero_icons() -> dict[str, str]:
    """Slug nom héros → URL portrait (cache mémoire process).

    Liquipedia utilise des noms anglais ; la liste Tencent est en chinois.
    Les héros sans correspondance retombent sur les initiales côté front.
    """
    global _cache, _cache_at
    now = time.monotonic()
    if _cache is not None and now - _cache_at < _CACHE_TTL_SECONDS:
        return _cache

    icons: dict[str, str] = {}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(HOK_HERO_LIST_URL)
            response.raise_for_status()
            heroes: list[dict[str, Any]] = response.json()
        for hero in heroes:
            if not isinstance(hero, dict):
                continue
            hero_id = str(hero.get("ename") or "").strip()
            cname = str(hero.get("cname") or "").strip()
            if not hero_id or not cname:
                continue
            url = _icon_url(hero_id)
            icons[_slug(cname)] = url
            title = str(hero.get("title") or "").strip()
            if title:
                icons[_slug(title)] = url
    except Exception:
        pass

    _cache = icons
    _cache_at = now
    return icons
