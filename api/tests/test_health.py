"""Health endpoint smoke testi — DB'ga bog'liq emas."""

import httpx
import pytest

from app.main import app


@pytest.mark.asyncio
async def test_health_ok() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"]
    assert body["environment"]
