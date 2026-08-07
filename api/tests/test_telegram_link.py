"""Telegram bog'lash — link-kod generatsiyasi, tasdiqlash, muddati va holat."""

from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.telegram import TelegramLink, TelegramLinkCode
from tests.helpers import auth_header, register_and_verify

settings = get_settings()


def _internal_headers() -> dict[str, str]:
    return {"X-Internal-Secret": settings.telegram_internal_secret}


async def test_status_is_false_before_linking(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998914001100")
    hdr = auth_header(tokens["access_token"])
    status_resp = await client.get("/v1/me/telegram/status", headers=hdr)
    assert status_resp.json()["linked"] is False


async def test_full_link_flow(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998914002200")
    hdr = auth_header(tokens["access_token"])

    code_resp = await client.post("/v1/me/telegram/link-code", headers=hdr)
    assert code_resp.status_code == 200
    code = code_resp.json()["code"]
    assert code_resp.json()["bot_username"] == settings.telegram_bot_username

    confirm = await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code, "chat_id": 123456},
        headers=_internal_headers(),
    )
    assert confirm.status_code == 200

    status_resp = await client.get("/v1/me/telegram/status", headers=hdr)
    assert status_resp.json()["linked"] is True


async def test_confirm_link_rejects_wrong_secret(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998914003300")
    hdr = auth_header(tokens["access_token"])
    code = (await client.post("/v1/me/telegram/link-code", headers=hdr)).json()["code"]

    resp = await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code, "chat_id": 1},
        headers={"X-Internal-Secret": "wrong-secret"},
    )
    assert resp.status_code == 401


async def test_confirm_link_rejects_unknown_code(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/v1/telegram/confirm-link",
        json={"code": "not-a-real-code", "chat_id": 1},
        headers=_internal_headers(),
    )
    assert resp.status_code == 400


async def test_confirm_link_rejects_expired_code(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998914004400")
    hdr = auth_header(tokens["access_token"])
    code = (await client.post("/v1/me/telegram/link-code", headers=hdr)).json()["code"]

    link_code = (await db.execute(select(TelegramLinkCode))).scalars().first()
    assert link_code is not None
    link_code.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    await db.commit()

    resp = await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code, "chat_id": 1},
        headers=_internal_headers(),
    )
    assert resp.status_code == 400


async def test_confirm_link_code_is_single_use(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998914005500")
    hdr = auth_header(tokens["access_token"])
    code = (await client.post("/v1/me/telegram/link-code", headers=hdr)).json()["code"]

    first = await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code, "chat_id": 1},
        headers=_internal_headers(),
    )
    assert first.status_code == 200

    second = await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code, "chat_id": 2},
        headers=_internal_headers(),
    )
    assert second.status_code == 400


async def test_relinking_updates_chat_id(client: httpx.AsyncClient, db: AsyncSession) -> None:
    tokens = await register_and_verify(client, phone="+998914006600")
    hdr = auth_header(tokens["access_token"])
    me = (await client.get("/v1/users/me", headers=hdr)).json()

    code1 = (await client.post("/v1/me/telegram/link-code", headers=hdr)).json()["code"]
    await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code1, "chat_id": 111},
        headers=_internal_headers(),
    )

    code2 = (await client.post("/v1/me/telegram/link-code", headers=hdr)).json()["code"]
    await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code2, "chat_id": 222},
        headers=_internal_headers(),
    )

    link = (
        await db.execute(select(TelegramLink).where(TelegramLink.user_id == me["id"]))
    ).scalar_one()
    assert link.chat_id == 222
