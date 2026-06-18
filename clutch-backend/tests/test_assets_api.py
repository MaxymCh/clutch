"""Proxy assets tiers (MLBB)."""

from unittest.mock import AsyncMock, patch

import pytest


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
