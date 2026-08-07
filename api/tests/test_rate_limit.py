"""Auth rate-limit — haqiqiy Redis hisoblagichi (login endpoint, boshqa testlarda o'chirilgan)."""

from collections.abc import AsyncGenerator

import httpx
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.rate_limit import _client
from app.main import app
from tests.conftest import _Session


@pytest_asyncio.fixture
async def raw_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Rate-limit dependency'lari override QILINMAGAN mijoz — haqiqiy Redis'ga uradi."""

    async def _get_db() -> AsyncGenerator[AsyncSession, None]:
        async with _Session() as session:
            yield session

    app.dependency_overrides[get_db] = _get_db
    await _client().flushdb()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
    await _client().flushdb()


async def test_login_gets_throttled_after_limit(raw_client: httpx.AsyncClient) -> None:
    payload = {"phone": "+998950000001", "password": "notthepassword"}
    statuses = []
    for _ in range(11):
        resp = await raw_client.post("/v1/auth/login", json=payload)
        statuses.append(resp.status_code)

    assert statuses.count(429) >= 1
    assert statuses[:10] == [401] * 10  # foydalanuvchi yo'q — parol xato, lekin CHEKLANMAGAN
    assert statuses[10] == 429
