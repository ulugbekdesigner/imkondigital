"""CV Builder — Skills Passport asosida AI CV generatsiyasi (AI API mock qilingan)."""

from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify

_FAKE_CV = "# Ism Familiya\n\n## Qisqacha tavsif\nMotivatsiyali mutaxassis.\n\n- Ko'nikma 1"


async def test_generate_cv_creates_pdf_url(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915011100")
    hdr = auth_header(tokens["access_token"])

    with patch("app.modules.ai.cv_builder.generate_ai_reply", new=AsyncMock(return_value=_FAKE_CV)):
        resp = await client.post("/v1/ai/cv/generate", headers=hdr, json={})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["content"] == _FAKE_CV
    assert body["pdf_url"] is not None
    assert body["pdf_url"].endswith(".pdf")


async def test_generate_cv_tailored_to_vacancy_includes_title_and_skills(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998915011400")
    hdr = auth_header(tokens["access_token"])

    employer_tokens = await register_and_verify(client, phone="+998915011500")
    employer_hdr = auth_header(employer_tokens["access_token"])
    await grant_role(db, "+998915011500", RoleCode.EMPLOYER)

    company = await client.post(
        "/v1/companies", headers=employer_hdr, json={"name": "Uzum", "employee_count": 500}
    )
    assert company.status_code == 201, company.text
    vacancy = await client.post(
        f"/v1/companies/{company.json()['id']}/vacancies",
        headers=employer_hdr,
        json={
            "title": "Junior Frontend",
            "ladder_step": 2,
            "work_format": "remote",
            "skills_required": ["HTML", "CSS"],
        },
    )
    assert vacancy.status_code == 201, vacancy.text
    vacancy_id = vacancy.json()["id"]

    with patch(
        "app.modules.ai.cv_builder.generate_ai_reply", new=AsyncMock(return_value=_FAKE_CV)
    ) as mock_reply:
        resp = await client.post(
            "/v1/ai/cv/generate", headers=hdr, json={"vacancy_id": vacancy_id}
        )
    assert resp.status_code == 200, resp.text
    prompt = mock_reply.call_args.kwargs["messages"][0]["content"]
    assert "Junior Frontend" in prompt
    assert "HTML" in prompt


async def test_get_cv_returns_404_before_generation(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915012200")
    hdr = auth_header(tokens["access_token"])
    resp = await client.get("/v1/ai/cv", headers=hdr)
    assert resp.status_code == 404


async def test_regenerate_overwrites_previous_cv(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915013300")
    hdr = auth_header(tokens["access_token"])

    with patch("app.modules.ai.cv_builder.generate_ai_reply", new=AsyncMock(return_value=_FAKE_CV)):
        await client.post("/v1/ai/cv/generate", headers=hdr, json={})

    with patch(
        "app.modules.ai.cv_builder.generate_ai_reply",
        new=AsyncMock(return_value="# Yangilangan CV"),
    ):
        second = await client.post("/v1/ai/cv/generate", headers=hdr, json={})
    assert second.json()["content"] == "# Yangilangan CV"

    fetched = await client.get("/v1/ai/cv", headers=hdr)
    assert fetched.json()["content"] == "# Yangilangan CV"


async def test_cv_quota_exceeded_returns_429(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998915014400")
    hdr = auth_header(tokens["access_token"])

    with patch("app.modules.ai.cv_builder.generate_ai_reply", new=AsyncMock(return_value=_FAKE_CV)):
        # Sozlamadagi standart kvota — ai_daily_quota_cv_builder=3
        for _ in range(3):
            resp = await client.post("/v1/ai/cv/generate", headers=hdr, json={})
            assert resp.status_code == 200

        limited = await client.post("/v1/ai/cv/generate", headers=hdr, json={})
    assert limited.status_code == 429
