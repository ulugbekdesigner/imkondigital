"""Donor dasturi — yaratish, ochiq ro'yxat, ariza berish (eligibility), qabul/rad, RBAC."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Enrollment
from app.models.enums import EnrollmentStatus, RoleCode
from app.models.user import Region, User
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_donor(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone, full_name="Donor Fund")
    await grant_role(db, phone, RoleCode.DONOR)
    return auth_header(tokens["access_token"])


async def _verified_applicant(
    client: httpx.AsyncClient, db: AsyncSession, phone: str, moderator_phone: str
) -> tuple[dict[str, str], int]:
    """Tasdiqlangan nogironlik profiliga ega, dasturga ariza berishga tayyor foydalanuvchi."""
    tokens = await register_and_verify(client, phone=phone)
    hdr = auth_header(tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=hdr,
        json={"group_type": "2", "categories": [], "work_conditions": {}},
    )
    user_id = (await client.get("/v1/users/me", headers=hdr)).json()["id"]

    mod_tokens = await register_and_verify(client, phone=moderator_phone)
    await grant_role(db, moderator_phone, RoleCode.MODERATOR)
    mod_hdr = auth_header(mod_tokens["access_token"])
    await client.post(
        f"/v1/moderation/disability-profiles/{user_id}/verify",
        headers=mod_hdr,
        json={"approve": True},
    )
    return hdr, user_id


async def test_non_donor_cannot_create_program(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.post(
        "/v1/donor/programs",
        headers=auth_header(tokens["access_token"]),
        json={"title": "Dastur", "description": "Tavsif shu yerda yetarlicha uzun"},
    )
    assert resp.status_code == 403


async def test_draft_program_not_visible_until_active(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998930000001")
    create = await client.post(
        "/v1/donor/programs",
        headers=donor_hdr,
        json={"title": "Ish qidiruvchilarga qo'llab-quvvatlash", "description": "Tavsif matni"},
    )
    assert create.status_code == 201
    program_id = create.json()["id"]
    assert create.json()["status"] == "draft"

    browse_before = (await client.get("/v1/programs")).json()
    assert browse_before == []

    activate = await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "active"}
    )
    assert activate.status_code == 200

    browse_after = (await client.get("/v1/programs")).json()
    assert len(browse_after) == 1
    assert browse_after[0]["id"] == program_id


async def test_unverified_user_cannot_apply(client: httpx.AsyncClient, db: AsyncSession) -> None:
    donor_hdr = await _make_donor(client, db, "+998930000010")
    program_id = (
        await client.post(
            "/v1/donor/programs",
            headers=donor_hdr,
            json={"title": "Dastur A", "description": "Tavsif matni yetarli uzunlikda"},
        )
    ).json()["id"]
    await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "active"}
    )

    applicant_tokens = await register_and_verify(client, phone="+998930000011")
    resp = await client.post(
        f"/v1/programs/{program_id}/apply",
        headers=auth_header(applicant_tokens["access_token"]),
    )
    assert resp.status_code == 403


async def test_verified_user_applies_and_donor_approves(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998930000020")
    program_id = (
        await client.post(
            "/v1/donor/programs",
            headers=donor_hdr,
            json={"title": "Dastur B", "description": "Tavsif matni yetarli uzunlikda"},
        )
    ).json()["id"]
    await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "active"}
    )

    applicant_hdr, applicant_id = await _verified_applicant(
        client, db, "+998930000021", "+998930000022"
    )
    apply = await client.post(f"/v1/programs/{program_id}/apply", headers=applicant_hdr)
    assert apply.status_code == 201, apply.text
    enrollment_id = apply.json()["id"]
    assert apply.json()["status"] == "pending"

    # Ikkinchi marta ariza bera olmaydi
    dup = await client.post(f"/v1/programs/{program_id}/apply", headers=applicant_hdr)
    assert dup.status_code == 409

    applications = (
        await client.get(f"/v1/donor/programs/{program_id}/applications", headers=donor_hdr)
    ).json()
    assert len(applications) == 1
    assert applications[0]["user_id"] == applicant_id

    approve = await client.post(
        f"/v1/donor/programs/{program_id}/applications/{enrollment_id}/approve",
        headers=donor_hdr,
    )
    assert approve.status_code == 200
    assert approve.json()["status"] == "approved"

    notifs = (await client.get("/v1/me/notifications", headers=applicant_hdr)).json()
    assert any("qabul qilindi" in n["title"] for n in notifs["items"])


async def test_application_includes_region_and_ladder_step(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998930000040")
    program_id = (
        await client.post(
            "/v1/donor/programs",
            headers=donor_hdr,
            json={"title": "Dastur D", "description": "Tavsif matni yetarli uzunlikda"},
        )
    ).json()["id"]
    await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "active"}
    )

    applicant_hdr, applicant_id = await _verified_applicant(
        client, db, "+998930000041", "+998930000042"
    )
    region = (
        await db.execute(select(Region).where(Region.name == "Toshkent shahri"))
    ).scalar_one()
    applicant_row = await db.get(User, applicant_id)
    assert applicant_row is not None
    applicant_row.region_id = region.id
    await db.commit()

    instr_tokens = await register_and_verify(client, phone="+998930000043")
    instr_hdr = auth_header(instr_tokens["access_token"])
    await grant_role(db, "+998930000043", RoleCode.INSTRUCTOR)
    course = await client.post(
        "/v1/courses", headers=instr_hdr, json={"title": "Grafik dizayn", "ladder_step": 2}
    )
    course_id = course.json()["id"]
    await client.post(
        f"/v1/courses/{course_id}/modules", headers=instr_hdr, json={"title": "1-modul"}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=instr_hdr)
    await client.post("/v1/enrollments", headers=applicant_hdr, data={"course_id": course_id})
    enrollment = (
        await db.execute(select(Enrollment).where(Enrollment.user_id == applicant_id))
    ).scalar_one()
    enrollment.status = EnrollmentStatus.COMPLETED
    await db.commit()

    await client.post(f"/v1/programs/{program_id}/apply", headers=applicant_hdr)

    applications = (
        await client.get(f"/v1/donor/programs/{program_id}/applications", headers=donor_hdr)
    ).json()
    assert len(applications) == 1
    assert applications[0]["region_name"] == "Toshkent shahri"
    assert applications[0]["ladder_step"] == 2


async def test_application_without_region_or_course_has_null_and_zero(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998930000050")
    program_id = (
        await client.post(
            "/v1/donor/programs",
            headers=donor_hdr,
            json={"title": "Dastur E", "description": "Tavsif matni yetarli uzunlikda"},
        )
    ).json()["id"]
    await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "active"}
    )
    applicant_hdr, _ = await _verified_applicant(client, db, "+998930000051", "+998930000052")
    await client.post(f"/v1/programs/{program_id}/apply", headers=applicant_hdr)

    applications = (
        await client.get(f"/v1/donor/programs/{program_id}/applications", headers=donor_hdr)
    ).json()
    assert applications[0]["region_name"] is None
    assert applications[0]["ladder_step"] == 0


async def test_program_status_transitions_are_linear(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_hdr = await _make_donor(client, db, "+998930000060")
    program_id = (
        await client.post(
            "/v1/donor/programs",
            headers=donor_hdr,
            json={"title": "Dastur F", "description": "Tavsif matni yetarli uzunlikda"},
        )
    ).json()["id"]

    # Qoralamadan to'g'ridan-to'g'ri yakunlash mumkin emas — faol bosqichi o'tkazib bo'lmaydi
    skip = await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "completed"}
    )
    assert skip.status_code == 409

    activate = await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "active"}
    )
    assert activate.status_code == 200

    # Orqaga qaytish mumkin emas
    backward = await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "draft"}
    )
    assert backward.status_code == 409

    complete = await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "completed"}
    )
    assert complete.status_code == 200

    # Yakunlangandan keyin hech qanday o'tish yo'q
    reactivate = await client.patch(
        f"/v1/donor/programs/{program_id}/status", headers=donor_hdr, json={"status": "active"}
    )
    assert reactivate.status_code == 409


async def test_donor_cannot_see_other_donors_program_applications(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    donor_a = await _make_donor(client, db, "+998930000030")
    donor_b = await _make_donor(client, db, "+998930000031")
    program_id = (
        await client.post(
            "/v1/donor/programs",
            headers=donor_a,
            json={"title": "Dastur C", "description": "Tavsif matni yetarli uzunlikda"},
        )
    ).json()["id"]

    resp = await client.get(f"/v1/donor/programs/{program_id}/applications", headers=donor_b)
    assert resp.status_code == 404
