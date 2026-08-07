"""Analitika — RBAC va anonimlashtirish (kichik hujayra bostirilishi)."""

from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from app.models.user import User
from tests.helpers import auth_header, grant_role, register_and_verify


async def test_only_admin_sees_admin_overview(client: httpx.AsyncClient, db: AsyncSession) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get(
        "/v1/analytics/admin/overview", headers=auth_header(tokens["access_token"])
    )
    assert resp.status_code == 403

    admin_tokens = await register_and_verify(client, phone="+998940000001")
    await grant_role(db, "+998940000001", RoleCode.ADMIN)
    admin_resp = await client.get(
        "/v1/analytics/admin/overview", headers=auth_header(admin_tokens["access_token"])
    )
    assert admin_resp.status_code == 200
    body = admin_resp.json()
    assert body["total_users"] == 2
    assert body["active_users"] == 2


async def test_only_gov_sees_gov_overview(client: httpx.AsyncClient, db: AsyncSession) -> None:
    donor_tokens = await register_and_verify(client, phone="+998940000010")
    await grant_role(db, "+998940000010", RoleCode.DONOR)
    forbidden = await client.get(
        "/v1/analytics/gov/overview", headers=auth_header(donor_tokens["access_token"])
    )
    assert forbidden.status_code == 403

    gov_tokens = await register_and_verify(client, phone="+998940000011")
    await grant_role(db, "+998940000011", RoleCode.GOV)
    ok = await client.get(
        "/v1/analytics/gov/overview", headers=auth_header(gov_tokens["access_token"])
    )
    assert ok.status_code == 200
    body = ok.json()
    assert "employment_rate_pct" in body
    assert "region_breakdown" in body


async def test_gov_overview_includes_platform_reach_counts(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    gov_tokens = await register_and_verify(client, phone="+998940000012")
    await grant_role(db, "+998940000012", RoleCode.GOV)
    gov_hdr = auth_header(gov_tokens["access_token"])

    await register_and_verify(client, phone="+998940000013")

    body = (await client.get("/v1/analytics/gov/overview", headers=gov_hdr)).json()
    # gov + 2-foydalanuvchi = kamida 2 ta ro'yxatdan o'tgan
    assert body["total_students"] >= 2
    assert body["total_employed"] == 0
    assert body["total_companies"] == 0
    assert body["region_coverage"] == 0
    assert body["region_employment_breakdown"] == []


async def test_non_gov_cannot_export_gov_overview(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get(
        "/v1/analytics/gov/overview/export", headers=auth_header(tokens["access_token"])
    )
    assert resp.status_code == 403


async def test_gov_exports_overview_csv(client: httpx.AsyncClient, db: AsyncSession) -> None:
    gov_tokens = await register_and_verify(client, phone="+998940000014")
    await grant_role(db, "+998940000014", RoleCode.GOV)
    gov_hdr = auth_header(gov_tokens["access_token"])

    resp = await client.get("/v1/analytics/gov/overview/export", headers=gov_hdr)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "attachment" in resp.headers["content-disposition"]
    assert "O'quvchi" in resp.text
    assert "Hududlar bo'yicha ishga joylashuv" in resp.text


async def test_donor_overview_scoped_to_own_programs(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_a_tokens = await register_and_verify(client, phone="+998940000020")
    await grant_role(db, "+998940000020", RoleCode.DONOR)
    donor_a_hdr = auth_header(donor_a_tokens["access_token"])

    empty_overview = (await client.get("/v1/analytics/donor/overview", headers=donor_a_hdr)).json()
    assert empty_overview["programs_count"] == 0
    assert empty_overview["approved_enrollees"] == 0

    await client.post(
        "/v1/donor/programs",
        headers=donor_a_hdr,
        json={"title": "Dastur", "description": "Tavsif matni yetarli uzunlikda"},
    )
    with_program = (await client.get("/v1/analytics/donor/overview", headers=donor_a_hdr)).json()
    assert with_program["programs_count"] == 1


async def test_registrations_daily_requires_admin(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998940000040")
    resp = await client.get(
        "/v1/analytics/admin/registrations-daily", headers=auth_header(tokens["access_token"])
    )
    assert resp.status_code == 403


async def test_registrations_daily_buckets_by_day(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_tokens = await register_and_verify(client, phone="+998940000041")
    await grant_role(db, "+998940000041", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])

    await register_and_verify(client, phone="+998940000042")

    backdated = (
        await db.execute(select(User).where(User.phone == "+998940000042"))
    ).scalar_one()
    backdated.created_at = datetime.now(UTC) - timedelta(days=3)
    await db.commit()

    resp = await client.get("/v1/analytics/admin/registrations-daily", headers=admin_hdr)
    assert resp.status_code == 200
    days = resp.json()["days"]

    assert len(days) == 7
    assert days == sorted(days, key=lambda d: d["date"])  # eng eskisi birinchi
    assert sum(d["count"] for d in days) == 2  # admin (bugun) + backdated foydalanuvchi
    assert days[-1]["count"] == 1  # bugun — faqat admin
    assert days[-4]["count"] == 1  # 3 kun oldin — backdated foydalanuvchi


async def test_gov_breakdown_suppresses_small_cells(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """1-2 kishilik guruh soni ko'rsatilmasligi kerak (k-anonimlik, CONTRIBUTING.md 6-qoida)."""
    user_tokens = await register_and_verify(client, phone="+998940000030")
    hdr = auth_header(user_tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=hdr,
        json={"group_type": "1", "categories": [], "work_conditions": {}},
    )
    user_id = (await client.get("/v1/users/me", headers=hdr)).json()["id"]

    mod_tokens = await register_and_verify(client, phone="+998940000031")
    await grant_role(db, "+998940000031", RoleCode.MODERATOR)
    mod_hdr = auth_header(mod_tokens["access_token"])
    await client.post(
        f"/v1/moderation/disability-profiles/{user_id}/verify",
        headers=mod_hdr,
        json={"approve": True},
    )

    gov_tokens = await register_and_verify(client, phone="+998940000032")
    await grant_role(db, "+998940000032", RoleCode.GOV)
    gov_hdr = auth_header(gov_tokens["access_token"])

    overview = (await client.get("/v1/analytics/gov/overview", headers=gov_hdr)).json()
    group_1_bucket = next(
        b for b in overview["disability_group_breakdown"] if b["label"] == "1-guruh"
    )
    assert group_1_bucket["count"] is None  # faqat 1 kishi — bostirilgan
