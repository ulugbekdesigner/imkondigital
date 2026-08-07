"""Ochiq xayriya — loyiha CRUD, RBAC, holat o'tishlari, loginsiz ariza (V2-2)."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_donor(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone, full_name="Donor Fund")
    await grant_role(db, phone, RoleCode.DONOR)
    return auth_header(tokens["access_token"])


async def _active_project(client: httpx.AsyncClient, donor_hdr: dict[str, str]) -> int:
    create = await client.post(
        "/v1/donation-projects",
        headers=donor_hdr,
        json={
            "title": "10 ta noutbuk granti",
            "story": "Bitiruvchilarga ish uchun noutbuk kerak.",
            "target_amount": 100_000,
        },
    )
    assert create.status_code == 201, create.text
    project_id = create.json()["id"]
    activate = await client.patch(
        f"/v1/donation-projects/{project_id}/status", headers=donor_hdr, json={"status": "active"}
    )
    assert activate.status_code == 200
    return project_id


async def test_plain_user_cannot_create_project(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.post(
        "/v1/donation-projects",
        headers=auth_header(tokens["access_token"]),
        json={"title": "Loyiha", "story": "Tavsif matni yetarli uzunlikda", "target_amount": 1000},
    )
    assert resp.status_code == 403


async def test_draft_project_hidden_from_public_listing(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998970000001")
    create = await client.post(
        "/v1/donation-projects",
        headers=donor_hdr,
        json={
            "title": "Imo-ishora tili kutubxonasi",
            "story": "Video darslar to'plami yaratish.",
            "target_amount": 500_000,
        },
    )
    project_id = create.json()["id"]
    assert create.json()["status"] == "draft"
    assert create.json()["progress_pct"] == 0

    before = (await client.get("/v1/donation-projects")).json()
    assert before == []

    activate = await client.patch(
        f"/v1/donation-projects/{project_id}/status", headers=donor_hdr, json={"status": "active"}
    )
    assert activate.status_code == 200

    after = (await client.get("/v1/donation-projects")).json()
    assert len(after) == 1
    assert after[0]["id"] == project_id


async def test_status_filter_returns_only_completed_projects(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998970000010")
    active_id = await _active_project(client, donor_hdr)
    completed = await client.post(
        "/v1/donation-projects",
        headers=donor_hdr,
        json={
            "title": "Imo-ishora tarjimoni fondi",
            "story": "Yakunlangan loyiha, hisobot bilan.",
            "target_amount": 200_000,
        },
    )
    completed_id = completed.json()["id"]
    await client.patch(
        f"/v1/donation-projects/{completed_id}/status",
        headers=donor_hdr,
        json={"status": "active"},
    )
    await client.patch(
        f"/v1/donation-projects/{completed_id}/status",
        headers=donor_hdr,
        json={"status": "completed"},
    )

    completed_only = (
        await client.get("/v1/donation-projects", params={"status": "completed"})
    ).json()
    assert [p["id"] for p in completed_only] == [completed_id]

    unfiltered = (await client.get("/v1/donation-projects")).json()
    ids = {p["id"] for p in unfiltered}
    assert active_id in ids
    assert completed_id in ids

    # Noto'g'ri/ruxsatsiz status qiymati e'tiborga olinmaydi — jim ravishda
    # standart (barcha ochiq status) ro'yxatga qaytadi, draftni sizib chiqarmaydi.
    invalid_filter = (await client.get("/v1/donation-projects", params={"status": "draft"})).json()
    assert {p["id"] for p in invalid_filter} == ids


async def test_cannot_skip_status_transitions(client: httpx.AsyncClient, db: AsyncSession) -> None:
    donor_hdr = await _make_donor(client, db, "+998970000010")
    create = await client.post(
        "/v1/donation-projects",
        headers=donor_hdr,
        json={"title": "Loyiha", "story": "Tavsif matni yetarli uzunlikda", "target_amount": 1000},
    )
    project_id = create.json()["id"]

    resp = await client.patch(
        f"/v1/donation-projects/{project_id}/status",
        headers=donor_hdr,
        json={"status": "completed"},
    )
    assert resp.status_code == 409


async def test_other_donor_cannot_manage_foreign_project(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_a = await _make_donor(client, db, "+998970000020")
    donor_b = await _make_donor(client, db, "+998970000021")
    create = await client.post(
        "/v1/donation-projects",
        headers=donor_a,
        json={"title": "Loyiha", "story": "Tavsif matni yetarli uzunlikda", "target_amount": 1000},
    )
    project_id = create.json()["id"]

    resp = await client.patch(
        f"/v1/donation-projects/{project_id}/status", headers=donor_b, json={"status": "active"}
    )
    assert resp.status_code == 403


async def test_loginless_donate_creates_pending_donation_and_checkout_url(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998970000030")
    project_id = await _active_project(client, donor_hdr)

    donate = await client.post(
        f"/v1/donation-projects/{project_id}/donate",
        json={"amount": 20_000, "donor_name": "Anvar", "is_anonymous": False, "provider": "payme"},
    )
    assert donate.status_code == 201, donate.text
    body = donate.json()
    assert body["donation_id"] > 0
    assert body["checkout_url"].startswith("https://checkout.paycom.uz")


async def test_donate_rejects_draft_project(client: httpx.AsyncClient, db: AsyncSession) -> None:
    donor_hdr = await _make_donor(client, db, "+998970000040")
    create = await client.post(
        "/v1/donation-projects",
        headers=donor_hdr,
        json={"title": "Loyiha", "story": "Tavsif matni yetarli uzunlikda", "target_amount": 1000},
    )
    project_id = create.json()["id"]

    donate = await client.post(
        f"/v1/donation-projects/{project_id}/donate",
        json={"amount": 20_000, "is_anonymous": True, "provider": "click"},
    )
    assert donate.status_code == 409


async def test_anonymous_donor_name_hidden_in_listing(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998970000050")
    project_id = await _active_project(client, donor_hdr)

    await client.post(
        f"/v1/donation-projects/{project_id}/donate",
        json={
            "amount": 5000,
            "donor_name": "Maxfiy Xayrixoh",
            "is_anonymous": True,
            "provider": "click",
        },
    )
    # Hali to'lanmagan (webhook kelmagan) — donations ro'yxatida ko'rinmaydi (faqat PAID)
    donations = (
        await client.get(f"/v1/donation-projects/{project_id}/donations", headers=donor_hdr)
    ).json()
    assert donations == []
