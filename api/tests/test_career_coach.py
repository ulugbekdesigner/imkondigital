"""Career Coach — AI suhbat tarixi, kvota nazorati (AI API mock qilingan)."""

from unittest.mock import AsyncMock, patch

import httpx
from google.genai import errors

from tests.helpers import auth_header, register_and_verify


async def test_send_message_returns_assistant_reply(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915001100")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.career_coach.generate_ai_reply", new=AsyncMock(return_value="Ajoyib savol!")
    ):
        resp = await client.post(
            "/v1/ai/career-coach/messages", headers=hdr, json={"content": "Menga qaysi kasb mos?"}
        )
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "assistant"
    assert resp.json()["content"] == "Ajoyib savol!"


async def test_history_includes_user_and_assistant_messages(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915002200")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.career_coach.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ):
        await client.post("/v1/ai/career-coach/messages", headers=hdr, json={"content": "Salom"})

    history = await client.get("/v1/ai/career-coach/messages", headers=hdr)
    roles = [m["role"] for m in history.json()]
    assert roles == ["user", "assistant"]


async def test_quota_exceeded_returns_429(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915003300")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.career_coach.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ):
        # Sozlamadagi standart kvota — ai_daily_quota_career_coach=20
        for _ in range(20):
            resp = await client.post(
                "/v1/ai/career-coach/messages", headers=hdr, json={"content": "Savol"}
            )
            assert resp.status_code == 200

        limited = await client.post(
            "/v1/ai/career-coach/messages", headers=hdr, json={"content": "Yana savol"}
        )
    assert limited.status_code == 429


async def test_messages_scoped_to_own_user(client: httpx.AsyncClient) -> None:
    tokens_a = await register_and_verify(client, phone="+998915004400")
    tokens_b = await register_and_verify(client, phone="+998915005500")
    hdr_a = auth_header(tokens_a["access_token"])
    hdr_b = auth_header(tokens_b["access_token"])

    with patch(
        "app.modules.ai.career_coach.generate_ai_reply", new=AsyncMock(return_value="Javob A")
    ):
        await client.post("/v1/ai/career-coach/messages", headers=hdr_a, json={"content": "A"})

    history_b = await client.get("/v1/ai/career-coach/messages", headers=hdr_b)
    assert history_b.json() == []


async def test_system_prompt_includes_profile_summary(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915007700")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.career_coach.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ) as mock_reply:
        resp = await client.post(
            "/v1/ai/career-coach/messages", headers=hdr, json={"content": "Savol"}
        )
    assert resp.status_code == 200, resp.text
    system_prompt = mock_reply.call_args.kwargs["system"]
    assert "0 ta sertifikat" in system_prompt
    assert "0 ta portfolio ishi" in system_prompt


async def test_clear_history_deletes_all_messages(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915008800")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.career_coach.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ):
        await client.post("/v1/ai/career-coach/messages", headers=hdr, json={"content": "Salom"})

    cleared = await client.delete("/v1/ai/career-coach/messages", headers=hdr)
    assert cleared.status_code == 204

    history = await client.get("/v1/ai/career-coach/messages", headers=hdr)
    assert history.json() == []


async def test_clear_history_scoped_to_own_user(client: httpx.AsyncClient) -> None:
    tokens_a = await register_and_verify(client, phone="+998915009900")
    tokens_b = await register_and_verify(client, phone="+998915010000")
    hdr_a = auth_header(tokens_a["access_token"])
    hdr_b = auth_header(tokens_b["access_token"])

    with patch(
        "app.modules.ai.career_coach.generate_ai_reply", new=AsyncMock(return_value="Javob B")
    ):
        await client.post("/v1/ai/career-coach/messages", headers=hdr_b, json={"content": "B"})

    await client.delete("/v1/ai/career-coach/messages", headers=hdr_a)

    history_b = await client.get("/v1/ai/career-coach/messages", headers=hdr_b)
    assert len(history_b.json()) == 2


async def test_gemini_api_error_returns_502(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915006600")
    hdr = auth_header(tokens["access_token"])

    auth_error = errors.ClientError(
        401, {"error": {"message": "bad key"}}, response=httpx.Response(status_code=401)
    )
    with patch(
        "app.core.ai_client._client.aio.models.generate_content",
        new=AsyncMock(side_effect=auth_error),
    ):
        resp = await client.post(
            "/v1/ai/career-coach/messages", headers=hdr, json={"content": "Salom"}
        )
    assert resp.status_code == 502
