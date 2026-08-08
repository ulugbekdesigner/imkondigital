"""Til daraja aniqlash testi — AI mock-suhbat va CEFR-verdikt tahlili (Gemini mock qilingan)."""

from unittest.mock import AsyncMock, patch

import httpx

from tests.helpers import auth_header, register_and_verify


async def test_start_session_creates_opening_message(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916031100")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply",
        new=AsyncMock(return_value="Hello! What's your name?"),
    ):
        resp = await client.post(
            "/v1/ai/placement-test/sessions", headers=hdr, json={"language": "en"}
        )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "active"
    assert body["language"] == "en"
    assert body["cefr_level"] is None
    assert len(body["messages"]) == 1
    assert body["messages"][0]["role"] == "assistant"


async def test_send_message_appends_user_and_assistant(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916032200")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply",
        new=AsyncMock(return_value="What's your name?"),
    ):
        session = (
            await client.post(
                "/v1/ai/placement-test/sessions", headers=hdr, json={"language": "en"}
            )
        ).json()

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply",
        new=AsyncMock(return_value="Nice! Where are you from?"),
    ):
        resp = await client.post(
            f"/v1/ai/placement-test/sessions/{session['id']}/messages",
            headers=hdr,
            json={"content": "My name is Aziz"},
        )
    assert resp.status_code == 200
    roles = [m["role"] for m in resp.json()["messages"]]
    assert roles == ["assistant", "user", "assistant"]


async def test_complete_session_parses_cefr_level(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916033300")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply",
        new=AsyncMock(return_value="What's your name?"),
    ):
        session = (
            await client.post(
                "/v1/ai/placement-test/sessions", headers=hdr, json={"language": "en"}
            )
        ).json()

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply",
        new=AsyncMock(
            return_value='{"cefr_level": "B1", "feedback": "Yaxshi asosiy so\'z boyligi bor."}'
        ),
    ):
        completed = await client.post(
            f"/v1/ai/placement-test/sessions/{session['id']}/complete", headers=hdr
        )
    assert completed.status_code == 200
    body = completed.json()
    assert body["status"] == "completed"
    assert body["cefr_level"] == "B1"
    assert "so'z boyligi" in body["level_feedback"]

    # Yakunlangan sessiyaga xabar yuborib bo'lmaydi
    blocked = await client.post(
        f"/v1/ai/placement-test/sessions/{session['id']}/messages",
        headers=hdr,
        json={"content": "Yana savol"},
    )
    assert blocked.status_code == 409


async def test_complete_session_falls_back_on_malformed_json(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916034400")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply",
        new=AsyncMock(return_value="What's your name?"),
    ):
        session = (
            await client.post(
                "/v1/ai/placement-test/sessions", headers=hdr, json={"language": "ru"}
            )
        ).json()

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply",
        new=AsyncMock(return_value="bu JSON emas, oddiy matn"),
    ):
        completed = await client.post(
            f"/v1/ai/placement-test/sessions/{session['id']}/complete", headers=hdr
        )
    body = completed.json()
    # Format xato bo'lganda "A1" (eng past daraja) soxta natija sifatida
    # QAYTARILMAYDI — foydalanuvchi AI'ning texnik nosozligi tufayli eng
    # past darajaga tushirilib qo'yilmasligi kerak (null = "qayta urining").
    assert body["cefr_level"] is None
    assert "qayta boshlang" in body["level_feedback"]


async def test_session_scoped_to_owner(client: httpx.AsyncClient) -> None:
    tokens_a = await register_and_verify(client, phone="+998916035500")
    tokens_b = await register_and_verify(client, phone="+998916036600")
    hdr_a = auth_header(tokens_a["access_token"])
    hdr_b = auth_header(tokens_b["access_token"])

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (
            await client.post(
                "/v1/ai/placement-test/sessions", headers=hdr_a, json={"language": "en"}
            )
        ).json()

    resp = await client.get(f"/v1/ai/placement-test/sessions/{session['id']}", headers=hdr_b)
    assert resp.status_code == 404


async def test_placement_test_quota_exceeded_returns_429(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916037700")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.placement_test.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        # Sozlamadagi standart kvota — ai_daily_quota_placement_test=3
        for _ in range(3):
            resp = await client.post(
                "/v1/ai/placement-test/sessions", headers=hdr, json={"language": "en"}
            )
            assert resp.status_code == 200

        limited = await client.post(
            "/v1/ai/placement-test/sessions", headers=hdr, json={"language": "en"}
        )
    assert limited.status_code == 429
