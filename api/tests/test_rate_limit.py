"""Auth rate-limit — haqiqiy Redis hisoblagichi (login endpoint, boshqa testlarda o'chirilgan)."""

from collections.abc import AsyncGenerator

import httpx
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.core.db import get_db
from app.core.rate_limit import _client, _client_ip
from app.main import app
from tests.conftest import _Session


def _request_with_headers(headers: dict[str, str]) -> Request:
    scope = {
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        "client": ("203.0.113.99", 12345),  # to'g'ridan-to'g'ri ulanish IP'i (proksisiz holat)
    }
    return Request(scope)


def test_client_ip_ignores_spoofed_forwarded_for_prefix() -> None:
    """Haqiqiy joylashtirishda (Cloudflare/Railway) ishonchli proksi X-Forwarded-For
    ZANJIRINING OXIRIGA o'zi ko'rgan IP'ni QO'SHADI — mijoz yuborgan qiymatlar
    boshida qoladi. Avval kod BIRINCHI (mijoz nazorat qiladigan) qiymatni olardi —
    bu har bir so'rovda o'zgartirib, istalgan IP-limitni chetlab o'tish imkonini
    berardi. Endi OXIRGI (ishonchli proksi qo'shgan) qiymat olinishi kerak.
    """
    real_ip = "198.51.100.7"
    req1 = _request_with_headers({"x-forwarded-for": f"1.2.3.4, {real_ip}"})
    req2 = _request_with_headers({"x-forwarded-for": f"9.9.9.9, {real_ip}"})
    assert _client_ip(req1) == real_ip
    assert _client_ip(req2) == real_ip
    # Ikkalasi HAM bir xil (haqiqiy) IP'ga tushishi kerak — spoof qilingan
    # birinchi segment har xil bo'lsa ham.
    assert _client_ip(req1) == _client_ip(req2)


def test_client_ip_prefers_cloudflare_header_over_forwarded_for() -> None:
    """`CF-Connecting-IP` — Cloudflare proksi o'zi qo'yadi, mijoz uni qayta yoza
    olmaydi (Cloudflare kiruvchi so'rovdagi shu nomdagi sarlavhani har doim
    o'z kuzatgan qiymati bilan almashtiradi) — shu sabab X-Forwarded-For'dan
    ustuvor bo'lishi kerak.
    """
    req = _request_with_headers(
        {"cf-connecting-ip": "203.0.113.50", "x-forwarded-for": "1.2.3.4, 5.6.7.8"}
    )
    assert _client_ip(req) == "203.0.113.50"


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
