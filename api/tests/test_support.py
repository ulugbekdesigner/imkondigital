"""Psixologik qo'llab-quvvatlash — admin CRUD, RBAC, faqat published ochiq ro'yxatda."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_admin(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone, full_name="Admin")
    await grant_role(db, phone, RoleCode.ADMIN)
    return auth_header(tokens["access_token"])


async def test_non_admin_cannot_create_content(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.post(
        "/v1/admin/support/contents",
        headers=auth_header(tokens["access_token"]),
        json={"title": "Sarlavha", "topic": "Charchoq", "body_text": "Matn matn matn"},
    )
    assert resp.status_code == 403


async def test_draft_content_hidden_until_published(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998961000001")
    create = await client.post(
        "/v1/admin/support/contents",
        headers=admin_hdr,
        json={
            "title": "Birinchi ish kuni qo'rquvi",
            "topic": "Ishonch",
            "body_text": "Bu tabiiy holat, har kim boshidan o'tkazadi.",
        },
    )
    assert create.status_code == 201, create.text
    content_id = create.json()["id"]
    assert create.json()["status"] == "draft"

    before = (await client.get("/v1/support/contents")).json()
    assert before == []

    publish = await client.patch(
        f"/v1/admin/support/contents/{content_id}/status",
        headers=admin_hdr,
        json={"status": "published"},
    )
    assert publish.status_code == 200

    after = (await client.get("/v1/support/contents")).json()
    assert len(after) == 1
    assert after[0]["title"] == "Birinchi ish kuni qo'rquvi"


async def test_admin_deletes_content(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998961000002")
    create = await client.post(
        "/v1/admin/support/contents",
        headers=admin_hdr,
        json={"title": "O'chiriladigan", "topic": "Test", "body_text": "Matn matn matn"},
    )
    assert create.status_code == 201, create.text
    content_id = create.json()["id"]

    delete = await client.delete(
        f"/v1/admin/support/contents/{content_id}", headers=admin_hdr
    )
    assert delete.status_code == 204

    listing = await client.get("/v1/admin/support/contents", headers=admin_hdr)
    assert listing.json() == []


async def test_non_admin_cannot_create_resource(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.post(
        "/v1/admin/support/resources",
        headers=auth_header(tokens["access_token"]),
        json={"name": "Test", "category": "hotline"},
    )
    assert resp.status_code == 403


async def test_draft_resource_hidden_until_published(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998961000003")
    create = await client.post(
        "/v1/admin/support/resources",
        headers=admin_hdr,
        json={
            "name": "Hamkor psixolog",
            "category": "psychologist",
            "description": "Onlayn maslahat",
            "phone": "+998901234567",
            "is_free": False,
        },
    )
    assert create.status_code == 201, create.text
    resource_id = create.json()["id"]
    assert create.json()["status"] == "draft"

    before = (await client.get("/v1/support/resources")).json()
    assert all(r["name"] != "Hamkor psixolog" for r in before)

    await client.patch(
        f"/v1/admin/support/resources/{resource_id}/status",
        headers=admin_hdr,
        json={"status": "published"},
    )

    after = (await client.get("/v1/support/resources")).json()
    assert any(r["name"] == "Hamkor psixolog" for r in after)


async def test_admin_deletes_resource(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998961000004")
    create = await client.post(
        "/v1/admin/support/resources",
        headers=admin_hdr,
        json={"name": "O'chiriladigan", "category": "ngo"},
    )
    resource_id = create.json()["id"]

    delete = await client.delete(
        f"/v1/admin/support/resources/{resource_id}", headers=admin_hdr
    )
    assert delete.status_code == 204

    listing = await client.get("/v1/admin/support/resources", headers=admin_hdr)
    assert all(r["id"] != resource_id for r in listing.json())
