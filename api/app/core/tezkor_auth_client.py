"""Tezkor Auth (markazlashgan Telegram-orqali kirish mikroservisi) klienti.

Alohida loyiha (bot @tezkortasdiqbot) — bitta Telegram bot orqali istalgan
loyihaga SMS/parolsiz "Telegram bilan kirish" beradi. Har so'rov HMAC bilan
imzolanadi (API kalit + so'rov imzosi — Tezkor Auth tomonidan tekshiriladi).

`app/core/telegram.py`dagi (IMKON'ning o'z bildirishnoma boti) bilan
ALOQASI YO'Q — bu butunlay boshqa xizmat, boshqa bot, boshqa maqsad (kirish,
bildirishnoma emas).
"""

import hashlib
import hmac
import json
import secrets
import time
from typing import Any

import httpx

from app.core.config import get_settings

settings = get_settings()


def _headers(method: str, path: str, body: bytes) -> dict[str, str]:
    ts = str(int(time.time()))
    nonce = secrets.token_urlsafe(16)
    msg = "\n".join([method.upper(), path, ts, nonce, hashlib.sha256(body).hexdigest()])
    sig = hmac.new(
        settings.tezkor_auth_hmac_secret.encode(), msg.encode(), hashlib.sha256
    ).hexdigest()
    return {
        "X-Api-Key": settings.tezkor_auth_api_key,
        "X-Timestamp": ts,
        "X-Nonce": nonce,
        "X-Signature": sig,
        "Content-Type": "application/json",
    }


async def _request(method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
    body = json.dumps(payload).encode() if payload is not None else b""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.request(
            method,
            settings.tezkor_auth_url.rstrip("/") + path,
            content=body,
            headers=_headers(method, path, body),
        )
        resp.raise_for_status()
        return resp.json()


async def start_session(return_url: str) -> dict[str, Any]:
    return await _request(  # type: ignore[no-any-return]
        "POST",
        "/v1/session/start",
        {"purpose": "login", "phone": None, "external_user_id": None, "return_url": return_url},
    )


async def get_status(session_id: str) -> dict[str, Any]:
    return await _request("GET", f"/v1/session/{session_id}")  # type: ignore[no-any-return]


async def claim_session(session_id: str) -> dict[str, Any]:
    return await _request(  # type: ignore[no-any-return]
        "POST", f"/v1/session/{session_id}/claim", {"external_user_id": None}
    )
