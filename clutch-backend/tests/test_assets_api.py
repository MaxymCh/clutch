"""Proxy assets tiers (MLBB, HoK)."""

from unittest.mock import AsyncMock, patch

from app.services.hok_assets import _build_icons


async def test_mlbb_heroes_proxy(client):
    fake = {"sora": "https://cdn.example/sora.png", "fanny": "https://cdn.example/fanny.png"}
    with patch("app.api.assets.get_mlbb_hero_icons", new=AsyncMock(return_value=fake)):
        response = await client.get("/assets/mlbb/heroes")
    assert response.status_code == 200
    assert response.json() == fake


async def test_hok_heroes_proxy(client):
    fake = {"baiqi": "https://cdn.example/baiqi.jpg"}
    with patch("app.api.assets.get_hok_hero_icons", new=AsyncMock(return_value=fake)):
        response = await client.get("/assets/hok/heroes")
    assert response.status_code == 200
    assert response.json() == fake


def test_hok_build_icons_no_empty_slug():
    icons = _build_icons([{"id": 120, "name": "Bai Qi"}, {"id": 536, "name": "Charlotte"}])
    assert "" not in icons
    assert icons["baiqi"].endswith("/120/120.jpg")
    assert icons["charlotte"].endswith("/536/536.jpg")
    assert icons["masterluban"].endswith("/112/112.jpg")
