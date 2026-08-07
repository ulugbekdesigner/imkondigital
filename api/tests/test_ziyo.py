"""Ziyo — sayt bo'ylab yo'lboshchi AI, mehmon va login qilgan foydalanuvchi uchun."""

from unittest.mock import AsyncMock, patch

import httpx

from tests.helpers import auth_header, register_and_verify


async def test_guest_can_chat_with_ziyo(client: httpx.AsyncClient) -> None:
    with patch(
        "app.modules.ai.ziyo.generate_ai_reply",
        new=AsyncMock(return_value="Salom! Kurslar bo'limidan boshlashingiz mumkin."),
    ):
        resp = await client.post(
            "/v1/ai/ziyo/messages",
            json={"messages": [{"role": "user", "content": "Bu sayt nima?"}], "page_path": "/"},
        )
    assert resp.status_code == 200, resp.text
    assert "Kurslar" in resp.json()["content"]


async def test_authenticated_user_can_chat_with_ziyo(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915007700")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.ziyo.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ):
        resp = await client.post(
            "/v1/ai/ziyo/messages",
            headers=hdr,
            json={"messages": [{"role": "user", "content": "Salom"}], "page_path": "/kurslar"},
        )
    assert resp.status_code == 200, resp.text
    assert resp.json()["content"] == "Javob"


async def test_authenticated_quota_exceeded_returns_429(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915008800")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.ziyo.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ):
        for _ in range(30):
            resp = await client.post(
                "/v1/ai/ziyo/messages",
                headers=hdr,
                json={"messages": [{"role": "user", "content": "Savol"}]},
            )
            assert resp.status_code == 200

        limited = await client.post(
            "/v1/ai/ziyo/messages",
            headers=hdr,
            json={"messages": [{"role": "user", "content": "Yana"}]},
        )
    assert limited.status_code == 429


async def test_empty_messages_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.post("/v1/ai/ziyo/messages", json={"messages": []})
    assert resp.status_code == 422


async def test_practice_mode_uses_language_specific_prompt(client: httpx.AsyncClient) -> None:
    mock_reply = AsyncMock(return_value="Hello! Let's talk about your last job interview.")
    with patch("app.modules.ai.ziyo.generate_ai_reply", new=mock_reply):
        resp = await client.post(
            "/v1/ai/ziyo/messages",
            json={
                "messages": [{"role": "user", "content": "Salom"}],
                "mode": "practice",
                "language": "ru",
            },
        )
    assert resp.status_code == 200, resp.text
    system_prompt = mock_reply.call_args.kwargs["system"]
    assert "rus" in system_prompt
    assert "TIL AMALIYOTI" in system_prompt


async def test_default_mode_ignores_language_field(client: httpx.AsyncClient) -> None:
    mock_reply = AsyncMock(return_value="Javob")
    with patch("app.modules.ai.ziyo.generate_ai_reply", new=mock_reply):
        resp = await client.post(
            "/v1/ai/ziyo/messages",
            json={"messages": [{"role": "user", "content": "Salom"}]},
        )
    assert resp.status_code == 200
    system_prompt = mock_reply.call_args.kwargs["system"]
    assert "TIL AMALIYOTI" not in system_prompt


async def test_default_mode_includes_crisis_safety_boundary(client: httpx.AsyncClient) -> None:
    """7.2-bo'lim: Ziyo psixolog rolini o'ynamaydi, /ruhiy-kuchga yo'naltiradi."""
    mock_reply = AsyncMock(return_value="Javob")
    with patch("app.modules.ai.ziyo.generate_ai_reply", new=mock_reply):
        await client.post(
            "/v1/ai/ziyo/messages",
            json={"messages": [{"role": "user", "content": "Salom"}]},
        )
    system_prompt = mock_reply.call_args.kwargs["system"]
    assert "/ruhiy-kuch" in system_prompt
    assert "psixolog" in system_prompt.lower()


async def test_practice_mode_also_includes_crisis_safety_note(client: httpx.AsyncClient) -> None:
    mock_reply = AsyncMock(return_value="Javob")
    with patch("app.modules.ai.ziyo.generate_ai_reply", new=mock_reply):
        await client.post(
            "/v1/ai/ziyo/messages",
            json={
                "messages": [{"role": "user", "content": "Salom"}],
                "mode": "practice",
                "language": "en",
            },
        )
    system_prompt = mock_reply.call_args.kwargs["system"]
    assert "/ruhiy-kuch" in system_prompt


async def test_invalid_language_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/v1/ai/ziyo/messages",
        json={
            "messages": [{"role": "user", "content": "Salom"}],
            "mode": "practice",
            "language": "fr",
        },
    )
    assert resp.status_code == 422
