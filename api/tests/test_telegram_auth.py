"""Tezkor Auth (markazlashgan Telegram-orqali kirish) integratsiyasi."""

from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.helpers import register_and_verify


def _http_status_error(status_code: int) -> httpx.HTTPStatusError:
    request = httpx.Request("POST", "http://tezkor-auth.test")
    response = httpx.Response(status_code, request=request)
    return httpx.HTTPStatusError("xato", request=request, response=response)


async def test_start_returns_session_info(client: httpx.AsyncClient) -> None:
    fake_start = AsyncMock(
        return_value={
            "session_id": "sess-1",
            "channel": "telegram",
            "deep_link": "https://t.me/tezkortasdiqbot?start=abc",
            "masked_phone": None,
        }
    )
    with patch("app.core.tezkor_auth_client.start_session", new=fake_start):
        resp = await client.post(
            "/v1/auth/telegram/start", json={"return_url": "https://imkondigital.uz/mening-yolim"}
        )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["session_id"] == "sess-1"
    assert body["deep_link"].startswith("https://t.me/")
    fake_start.assert_awaited_once_with("https://imkondigital.uz/mening-yolim")


async def test_start_maps_upstream_error_to_502(client: httpx.AsyncClient) -> None:
    with patch(
        "app.core.tezkor_auth_client.start_session",
        new=AsyncMock(side_effect=httpx.ConnectError("unreachable")),
    ):
        resp = await client.post(
            "/v1/auth/telegram/start", json={"return_url": "https://imkondigital.uz/"}
        )
    assert resp.status_code == 502


async def test_status_proxies_upstream_payload(client: httpx.AsyncClient) -> None:
    with patch(
        "app.core.tezkor_auth_client.get_status",
        new=AsyncMock(return_value={"status": "pending"}),
    ):
        resp = await client.get("/v1/auth/telegram/status/sess-1")
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending"


async def test_status_unknown_session_returns_404(client: httpx.AsyncClient) -> None:
    with patch(
        "app.core.tezkor_auth_client.get_status",
        new=AsyncMock(side_effect=_http_status_error(404)),
    ):
        resp = await client.get("/v1/auth/telegram/status/unknown")
    assert resp.status_code == 404


async def test_finish_creates_new_user(client: httpx.AsyncClient, db: AsyncSession) -> None:
    identity = {
        "telegram_user_id": 555111222,
        "phone": "+998901234567",
        "first_name": "Aziz",
        "username": "aziz_tg",
    }
    with patch(
        "app.core.tezkor_auth_client.claim_session",
        new=AsyncMock(return_value={"identity": identity}),
    ):
        resp = await client.post("/v1/auth/telegram/finish/sess-new")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "access_token" in body and "refresh_token" in body

    user = (
        await db.execute(select(User).where(User.telegram_user_id == 555111222))
    ).scalar_one()
    assert user.phone == "+998901234567"
    assert user.full_name == "Aziz"
    assert user.status == "active"


async def test_finish_links_existing_phone_account(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    await register_and_verify(client, phone="+998907776655")
    identity = {
        "telegram_user_id": 555111333,
        "phone": "+998907776655",
        "first_name": "Malika",
    }
    with patch(
        "app.core.tezkor_auth_client.claim_session",
        new=AsyncMock(return_value={"identity": identity}),
    ):
        resp = await client.post("/v1/auth/telegram/finish/sess-link")
    assert resp.status_code == 200, resp.text

    rows = (
        (await db.execute(select(User).where(User.phone == "+998907776655"))).scalars().all()
    )
    assert len(rows) == 1  # dublikat yaratilmadi
    assert rows[0].telegram_user_id == 555111333


async def test_finish_reuses_same_telegram_user_on_second_login(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    identity = {"telegram_user_id": 555111444, "phone": "+998909998877", "first_name": "Botir"}
    with patch(
        "app.core.tezkor_auth_client.claim_session",
        new=AsyncMock(return_value={"identity": identity}),
    ):
        first = await client.post("/v1/auth/telegram/finish/sess-a")
        second = await client.post("/v1/auth/telegram/finish/sess-b")
    assert first.status_code == 200
    assert second.status_code == 200

    rows = (
        (await db.execute(select(User).where(User.telegram_user_id == 555111444)))
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_finish_without_phone_rejected(client: httpx.AsyncClient) -> None:
    identity = {"telegram_user_id": 555111555, "phone": None, "first_name": "Nomsiz"}
    with patch(
        "app.core.tezkor_auth_client.claim_session",
        new=AsyncMock(return_value={"identity": identity}),
    ):
        resp = await client.post("/v1/auth/telegram/finish/sess-nophone")
    assert resp.status_code == 400


async def test_finish_unconfirmed_session_returns_409(client: httpx.AsyncClient) -> None:
    with patch(
        "app.core.tezkor_auth_client.claim_session",
        new=AsyncMock(side_effect=_http_status_error(409)),
    ):
        resp = await client.post("/v1/auth/telegram/finish/sess-pending")
    assert resp.status_code == 409
