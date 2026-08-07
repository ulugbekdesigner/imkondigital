"""Interview Coach — AI mock-suhbat sessiyasi (AI API mock qilingan)."""

from unittest.mock import AsyncMock, patch

import httpx

from tests.helpers import auth_header, register_and_verify


async def test_start_session_creates_opening_message(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915021100")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.interview_coach.generate_ai_reply",
        new=AsyncMock(return_value="Salom! Birinchi savol: o'zingiz haqingizda gapiring."),
    ):
        resp = await client.post("/v1/ai/interview/sessions", headers=hdr, json={})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "active"
    assert len(body["messages"]) == 1
    assert body["messages"][0]["role"] == "assistant"


async def test_send_message_appends_user_and_assistant(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915022200")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.interview_coach.generate_ai_reply", new=AsyncMock(return_value="Savol 1")
    ):
        session = (await client.post("/v1/ai/interview/sessions", headers=hdr, json={})).json()

    with patch(
        "app.modules.ai.interview_coach.generate_ai_reply",
        new=AsyncMock(return_value="Yaxshi javob! Keyingi savol: kuchli tomoningiz nima?"),
    ):
        resp = await client.post(
            f"/v1/ai/interview/sessions/{session['id']}/messages",
            headers=hdr,
            json={"content": "Men tajribali dasturchiman"},
        )
    assert resp.status_code == 200
    roles = [m["role"] for m in resp.json()["messages"]]
    assert roles == ["assistant", "user", "assistant"]


async def test_complete_session_blocks_further_messages(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915023300")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.interview_coach.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (await client.post("/v1/ai/interview/sessions", headers=hdr, json={})).json()

    completed = await client.post(
        f"/v1/ai/interview/sessions/{session['id']}/complete", headers=hdr
    )
    assert completed.json()["status"] == "completed"

    blocked = await client.post(
        f"/v1/ai/interview/sessions/{session['id']}/messages",
        headers=hdr,
        json={"content": "Yana savol"},
    )
    assert blocked.status_code == 409


async def test_session_scoped_to_owner(client: httpx.AsyncClient) -> None:
    tokens_a = await register_and_verify(client, phone="+998915024400")
    tokens_b = await register_and_verify(client, phone="+998915025500")
    hdr_a = auth_header(tokens_a["access_token"])
    hdr_b = auth_header(tokens_b["access_token"])

    with patch(
        "app.modules.ai.interview_coach.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (await client.post("/v1/ai/interview/sessions", headers=hdr_a, json={})).json()

    resp = await client.get(f"/v1/ai/interview/sessions/{session['id']}", headers=hdr_b)
    assert resp.status_code == 404


async def test_list_sessions_returns_own_sessions(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915026600")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.interview_coach.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        await client.post("/v1/ai/interview/sessions", headers=hdr, json={})

    sessions = await client.get("/v1/ai/interview/sessions", headers=hdr)
    assert len(sessions.json()) == 1


async def test_interview_quota_exceeded_returns_429(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915027700")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.interview_coach.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        # Sozlamadagi standart kvota — ai_daily_quota_interview_coach=10
        for _ in range(10):
            resp = await client.post("/v1/ai/interview/sessions", headers=hdr, json={})
            assert resp.status_code == 200

        limited = await client.post("/v1/ai/interview/sessions", headers=hdr, json={})
    assert limited.status_code == 429
