"""Bitiruvchi hikoyalari — admin CRUD, RBAC, faqat published ochiq ro'yxatda."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_admin(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone, full_name="Admin")
    await grant_role(db, phone, RoleCode.ADMIN)
    return auth_header(tokens["access_token"])


async def test_non_admin_cannot_create_story(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.post(
        "/v1/admin/success-stories",
        headers=auth_header(tokens["access_token"]),
        json={"step": 2, "full_name": "Aziza", "profession": "Dizayner", "quote": "Ish topdim!"},
    )
    assert resp.status_code == 403


async def test_draft_story_hidden_until_published(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998960000001")
    create = await client.post(
        "/v1/admin/success-stories",
        headers=admin_hdr,
        json={
            "step": 3,
            "full_name": "Nodira Karimova",
            "profession": "Frontend dasturchi",
            "quote": "Kursni tugatib, masofaviy ishga joylashdim.",
        },
    )
    assert create.status_code == 201, create.text
    story_id = create.json()["id"]
    assert create.json()["status"] == "draft"

    before = (await client.get("/v1/success-stories")).json()
    assert before == []

    publish = await client.patch(
        f"/v1/admin/success-stories/{story_id}/status",
        headers=admin_hdr,
        json={"status": "published"},
    )
    assert publish.status_code == 200

    after = (await client.get("/v1/success-stories")).json()
    assert len(after) == 1
    assert after[0]["full_name"] == "Nodira Karimova"


async def test_admin_deletes_story(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998960000010")
    create = await client.post(
        "/v1/admin/success-stories",
        headers=admin_hdr,
        json={
            "step": 1,
            "full_name": "Sardor",
            "profession": "Data entry",
            "quote": "Birinchi daromadimni oldim.",
        },
    )
    story_id = create.json()["id"]

    delete = await client.delete(f"/v1/admin/success-stories/{story_id}", headers=admin_hdr)
    assert delete.status_code == 204

    listing = (await client.get("/v1/admin/success-stories", headers=admin_hdr)).json()
    assert listing == []
