"""Case-hikoya — Ziyo bilan birga portfolio yozish (Portfolio 2.0, 6.3-bo'lim)."""

from unittest.mock import AsyncMock, patch

import httpx
from fastapi import HTTPException

from tests.helpers import auth_header, register_and_verify


async def _create_portfolio_item(client: httpx.AsyncClient, hdr: dict[str, str]) -> int:
    create = await client.post(
        "/v1/me/portfolio", headers=hdr, data={"title": "Mijozga veb-sayt", "description": ""}
    )
    assert create.status_code == 201, create.text
    return create.json()["id"]


async def test_start_session_creates_opening_message(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916031100")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)

    with patch(
        "app.modules.ai.case_story.generate_ai_reply",
        new=AsyncMock(return_value="Salom! Bu loyihada aniq qanday vazifa bilan shug'ullandingiz?"),
    ):
        resp = await client.post(
            "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
        )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "active"
    assert body["portfolio_item_id"] == item_id
    assert body["portfolio_item_title"] == "Mijozga veb-sayt"
    assert len(body["messages"]) == 1
    assert body["messages"][0]["role"] == "assistant"


async def test_start_session_for_foreign_item_fails(client: httpx.AsyncClient) -> None:
    owner = await register_and_verify(client, phone="+998916031101")
    other = await register_and_verify(client, phone="+998916031102")
    item_id = await _create_portfolio_item(client, auth_header(owner["access_token"]))

    resp = await client.post(
        "/v1/ai/case-story/sessions",
        headers=auth_header(other["access_token"]),
        json={"portfolio_item_id": item_id},
    )
    assert resp.status_code == 404


async def test_send_message_appends_user_and_assistant(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916031103")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)

    with patch("app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")):
        session = (
            await client.post(
                "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
            )
        ).json()

    with patch(
        "app.modules.ai.case_story.generate_ai_reply",
        new=AsyncMock(return_value="Ajoyib! Keyingi savol: qanday yondashdingiz?"),
    ):
        resp = await client.post(
            f"/v1/ai/case-story/sessions/{session['id']}/messages",
            headers=hdr,
            json={"content": "Frontendni React bilan qurdim"},
        )
    assert resp.status_code == 200
    roles = [m["role"] for m in resp.json()["messages"]]
    assert roles == ["assistant", "user", "assistant"]


async def test_send_message_after_completion_fails(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916031104")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)

    with patch("app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")):
        session = (
            await client.post(
                "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
            )
        ).json()
        await client.post(f"/v1/ai/case-story/sessions/{session['id']}/complete", headers=hdr)

    blocked = await client.post(
        f"/v1/ai/case-story/sessions/{session['id']}/messages",
        headers=hdr,
        json={"content": "Yana"},
    )
    assert blocked.status_code == 409


async def test_complete_session_synthesizes_into_portfolio_item(
    client: httpx.AsyncClient,
) -> None:
    tokens = await register_and_verify(client, phone="+998916031105")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)

    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (
            await client.post(
                "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
            )
        ).json()

    synthesis_reply = (
        '{"task": "Kichik biznes uchun onlayn-do\'kon qurish", '
        '"result": "Birinchi oyda 50 ta buyurtma tushdi", '
        '"skills": ["React", "Figma", "Mijoz bilan muloqot"]}'
    )
    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value=synthesis_reply)
    ):
        complete = await client.post(
            f"/v1/ai/case-story/sessions/{session['id']}/complete", headers=hdr
        )
    assert complete.status_code == 200
    assert complete.json()["status"] == "completed"
    assert complete.json()["completed_at"] is not None

    item = (await client.get("/v1/me/portfolio", headers=hdr)).json()[0]
    assert item["task"] == "Kichik biznes uchun onlayn-do'kon qurish"
    assert item["result"] == "Birinchi oyda 50 ta buyurtma tushdi"
    assert item["skills"] == ["React", "Figma", "Mijoz bilan muloqot"]
    # Mijoz bahosi HECH QACHON AI tomonidan yozilmaydi — bu maydon tegilmagan
    assert item["client_feedback"] is None


async def test_complete_session_merges_skills_without_losing_manual_ones(
    client: httpx.AsyncClient,
) -> None:
    tokens = await register_and_verify(client, phone="+998916031106")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)
    await client.patch(
        f"/v1/me/portfolio/{item_id}", headers=hdr, json={"skills": ["Photoshop"]}
    )

    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (
            await client.post(
                "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
            )
        ).json()

    synthesis_reply = '{"task": "Vazifa", "result": "Natija", "skills": ["Photoshop", "Figma"]}'
    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value=synthesis_reply)
    ):
        await client.post(f"/v1/ai/case-story/sessions/{session['id']}/complete", headers=hdr)

    item = (await client.get("/v1/me/portfolio", headers=hdr)).json()[0]
    assert item["skills"] == ["Photoshop", "Figma"]  # takrorlanmaydi, yo'qolmaydi ham


async def test_complete_session_survives_ai_synthesis_failure(client: httpx.AsyncClient) -> None:
    """AI xatosiga uchrasa ham sessiya yakunlanadi — foydalanuvchi keyin qo'lda to'ldiradi."""
    tokens = await register_and_verify(client, phone="+998916031107")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)

    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (
            await client.post(
                "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
            )
        ).json()

    with patch(
        "app.modules.ai.case_story.generate_ai_reply",
        new=AsyncMock(side_effect=HTTPException(status_code=502, detail="AI xatosi")),
    ):
        complete = await client.post(
            f"/v1/ai/case-story/sessions/{session['id']}/complete", headers=hdr
        )
    assert complete.status_code == 200
    assert complete.json()["status"] == "completed"

    item = (await client.get("/v1/me/portfolio", headers=hdr)).json()[0]
    assert item["task"] == ""  # sintez bo'lmadi, lekin hech narsa yiqilmadi


async def test_complete_session_is_idempotent(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916031108")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)

    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (
            await client.post(
                "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
            )
        ).json()

    synthesis_reply = '{"task": "Vazifa", "result": "Natija", "skills": ["A"]}'
    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value=synthesis_reply)
    ) as mock_reply:
        await client.post(f"/v1/ai/case-story/sessions/{session['id']}/complete", headers=hdr)
        await client.post(f"/v1/ai/case-story/sessions/{session['id']}/complete", headers=hdr)
    # Ikkinchi chaqiruvda AI umuman chaqirilmagan (sessiya allaqachon yakunlangan)
    assert mock_reply.call_count == 1

    item = (await client.get("/v1/me/portfolio", headers=hdr)).json()[0]
    assert item["skills"] == ["A"]  # ikki marta qo'shilmagan


async def test_session_scoped_to_owner(client: httpx.AsyncClient) -> None:
    tokens_a = await register_and_verify(client, phone="+998916031109")
    tokens_b = await register_and_verify(client, phone="+998916031110")
    hdr_a = auth_header(tokens_a["access_token"])
    item_id = await _create_portfolio_item(client, hdr_a)

    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        session = (
            await client.post(
                "/v1/ai/case-story/sessions", headers=hdr_a, json={"portfolio_item_id": item_id}
            )
        ).json()

    resp = await client.get(
        f"/v1/ai/case-story/sessions/{session['id']}", headers=auth_header(tokens_b["access_token"])
    )
    assert resp.status_code == 404


async def test_list_sessions_returns_own_sessions(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916031111")
    hdr = auth_header(tokens["access_token"])
    item_id = await _create_portfolio_item(client, hdr)

    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        await client.post(
            "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
        )

    sessions = await client.get("/v1/ai/case-story/sessions", headers=hdr)
    assert len(sessions.json()) == 1
    assert sessions.json()[0]["portfolio_item_title"] == "Mijozga veb-sayt"


async def test_case_story_quota_exceeded_returns_429(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998916031112")
    hdr = auth_header(tokens["access_token"])

    with patch(
        "app.modules.ai.case_story.generate_ai_reply", new=AsyncMock(return_value="Savol")
    ):
        # Sozlamadagi standart kvota — ai_daily_quota_case_story=10
        for _ in range(10):
            item_id = await _create_portfolio_item(client, hdr)
            resp = await client.post(
                "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
            )
            assert resp.status_code == 200

        item_id = await _create_portfolio_item(client, hdr)
        limited = await client.post(
            "/v1/ai/case-story/sessions", headers=hdr, json={"portfolio_item_id": item_id}
        )
    assert limited.status_code == 429
