"""Proxy serveur des icônes héros HoK (Tencent CDN + noms anglais Liquipedia)."""

import re
import time
from pathlib import Path
from typing import Any

import httpx

HOK_HERO_LIST_URL = "https://raw.githubusercontent.com/lnsdeep/hok-meta-analyzer/main/heroes.json"
HOK_ICON_CDN = "https://game.gtimg.cn/images/yxzj/img201606/heroimg/{id}/{id}.jpg"
_CACHE_TTL_SECONDS = 86_400

# Alias Liquipedia / KPL absents de la liste communautaire (id Tencent = ename).
_HOK_EXTRA_HEROES: list[tuple[int, str]] = [
    (112, "Master Luban"),
    (136, "Wu Ze Tian"),
    (178, "Shieldun"),
    (548, "Ge Ya"),
    (525, "Flowborn (Support)"),
]

_cache: dict[str, str] | None = None
_cache_at: float = 0.0


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def _icon_url(hero_id: int | str) -> str:
    return HOK_ICON_CDN.format(id=hero_id)


def _register(icons: dict[str, str], name: str, hero_id: int) -> None:
    slug = _slug(name)
    if slug:
        icons[slug] = _icon_url(hero_id)


def _load_bundled_heroes() -> list[dict[str, Any]]:
    path = Path(__file__).resolve().parent.parent / "data" / "hok_heroes.json"
    if not path.is_file():
        return []
    import json

    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else []


def _build_icons(heroes: list[dict[str, Any]]) -> dict[str, str]:
    icons: dict[str, str] = {}
    for hero in heroes:
        if not isinstance(hero, dict):
            continue
        hero_id = hero.get("id")
        if hero_id is None:
            continue
        for key in ("name", "chinese_hero_name", "title", "english_hero_name"):
            name = str(hero.get(key) or "").strip()
            if name:
                _register(icons, name, int(hero_id))
    for hero_id, name in _HOK_EXTRA_HEROES:
        _register(icons, name, hero_id)
    return icons


async def get_hok_hero_icons() -> dict[str, str]:
    """Slug nom héros Liquipedia → URL portrait Tencent CDN (cache 24 h)."""
    global _cache, _cache_at
    now = time.monotonic()
    if _cache is not None and now - _cache_at < _CACHE_TTL_SECONDS:
        return _cache

    heroes: list[dict[str, Any]] = _load_bundled_heroes()
    if not heroes:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(HOK_HERO_LIST_URL)
                response.raise_for_status()
                raw = response.json()
            if isinstance(raw, list):
                heroes = [
                    {
                        "id": item.get("id"),
                        "name": item.get("chinese_hero_name"),
                        "title": item.get("english_hero_name"),
                    }
                    for item in raw
                    if isinstance(item, dict) and item.get("id") is not None
                ]
        except Exception:
            heroes = []

    icons = _build_icons(heroes)
    _cache = icons
    _cache_at = now
    return icons
