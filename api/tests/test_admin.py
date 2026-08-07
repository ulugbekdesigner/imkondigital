"""Admin panel — foydalanuvchi boshqaruvi, audit jurnali, kurs arxivlash, RBAC."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_admin(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone, full_name="Admin Aziza")
    await grant_role(db, phone, RoleCode.ADMIN)
    return auth_header(tokens["access_token"])


async def test_non_admin_cannot_list_users(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get("/v1/admin/users", headers=auth_header(tokens["access_token"]))
    assert resp.status_code == 403


async def test_admin_lists_and_searches_users(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000001")
    await register_and_verify(client, phone="+998920000002", full_name="Nodira Karimova")
    await register_and_verify(client, phone="+998920000003", full_name="Sardor Yusupov")

    page = (await client.get("/v1/admin/users", headers=admin_hdr)).json()
    assert page["next_cursor"] is None
    assert len(page["items"]) == 3  # admin + 2 foydalanuvchi

    search = (
        await client.get("/v1/admin/users", headers=admin_hdr, params={"search": "Nodira"})
    ).json()
    assert len(search["items"]) == 1
    assert search["items"][0]["full_name"] == "Nodira Karimova"


async def test_admin_blocks_and_activates_user(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000010")
    target_tokens = await register_and_verify(client, phone="+998920000011")
    target_id = (
        await client.get("/v1/users/me", headers=auth_header(target_tokens["access_token"]))
    ).json()["id"]

    block = await client.patch(
        f"/v1/admin/users/{target_id}/status", headers=admin_hdr, json={"status": "blocked"}
    )
    assert block.status_code == 200
    assert block.json()["status"] == "blocked"

    # Bloklangan foydalanuvchi endi tizimga kira olmaydi
    me = await client.get("/v1/users/me", headers=auth_header(target_tokens["access_token"]))
    assert me.status_code == 403

    activate = await client.patch(
        f"/v1/admin/users/{target_id}/status", headers=admin_hdr, json={"status": "active"}
    )
    assert activate.status_code == 200
    assert activate.json()["status"] == "active"


async def test_admin_cannot_block_self(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000020")
    admin_id = (await client.get("/v1/users/me", headers=admin_hdr)).json()["id"]

    resp = await client.patch(
        f"/v1/admin/users/{admin_id}/status", headers=admin_hdr, json={"status": "blocked"}
    )
    assert resp.status_code == 400


async def test_admin_assigns_and_revokes_role(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000030")
    target_tokens = await register_and_verify(client, phone="+998920000031")
    target_hdr = auth_header(target_tokens["access_token"])
    target_id = (await client.get("/v1/users/me", headers=target_hdr)).json()["id"]

    assign = await client.post(
        f"/v1/admin/users/{target_id}/roles", headers=admin_hdr, json={"role": "donor"}
    )
    assert assign.status_code == 200
    assert "donor" in assign.json()["roles"]

    # Endi donor endpoint'iga kira oladi
    donor_check = await client.get("/v1/donor/programs", headers=target_hdr)
    assert donor_check.status_code == 200

    revoke = await client.delete(f"/v1/admin/users/{target_id}/roles/donor", headers=admin_hdr)
    assert revoke.status_code == 200
    assert "donor" not in revoke.json()["roles"]

    donor_check_after = await client.get("/v1/donor/programs", headers=target_hdr)
    assert donor_check_after.status_code == 403


async def test_role_assignment_writes_audit_log(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000040")
    target_tokens = await register_and_verify(client, phone="+998920000041")
    target_id = (
        await client.get("/v1/users/me", headers=auth_header(target_tokens["access_token"]))
    ).json()["id"]

    await client.post(
        f"/v1/admin/users/{target_id}/roles", headers=admin_hdr, json={"role": "employer"}
    )

    log = (await client.get("/v1/admin/audit-log", headers=admin_hdr)).json()
    assert len(log["items"]) == 1
    entry = log["items"][0]
    assert entry["action"] == "user.assign_role"
    assert entry["action_label"] == "Rol berildi: Ish beruvchi"
    assert entry["target_type"] == "user"
    assert entry["target_id"] == str(target_id)
    assert entry["target_name"] is not None
    assert entry["meta"] == {"role": "employer"}


async def test_disability_verification_writes_audit_log(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000050")
    user_tokens = await register_and_verify(client, phone="+998920000051")
    user_hdr = auth_header(user_tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "2", "categories": [], "work_conditions": {}},
    )
    user_id = (await client.get("/v1/users/me", headers=user_hdr)).json()["id"]
    # Moderator sifatida emas, admin ham moderatsiya qila oladi (RBAC matritsasi)
    await client.post(
        f"/v1/moderation/disability-profiles/{user_id}/verify",
        headers=admin_hdr,
        json={"approve": True},
    )

    log = (await client.get("/v1/admin/audit-log", headers=admin_hdr)).json()
    entry = next(item for item in log["items"] if item["action"] == "disability_profile.verify")
    assert entry["action_label"] == "Nogironlik profili tasdiqlandi"
    assert entry["target_name"] is not None


async def test_moderator_can_archive_published_course_admin_cannot_list_without_role(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    instructor_tokens = await register_and_verify(client, phone="+998920000060")
    instructor_hdr = auth_header(instructor_tokens["access_token"])
    await grant_role(db, "+998920000060", RoleCode.INSTRUCTOR)

    create = await client.post(
        "/v1/courses",
        headers=instructor_hdr,
        json={
            "title": "Python asoslari",
            "description": "Boshlang'ich kurs",
            "ladder_step": 1,
            "is_free": True,
            "price": 0,
        },
    )
    assert create.status_code == 201, create.text
    course_id = create.json()["id"]
    await client.post(
        f"/v1/courses/{course_id}/modules", headers=instructor_hdr, json={"title": "1-modul"}
    )
    publish = await client.post(f"/v1/courses/{course_id}/publish", headers=instructor_hdr)
    assert publish.status_code == 200

    moderator_tokens = await register_and_verify(client, phone="+998920000061")
    moderator_hdr = auth_header(moderator_tokens["access_token"])
    await grant_role(db, "+998920000061", RoleCode.MODERATOR)

    listing = (await client.get("/v1/admin/courses", headers=moderator_hdr)).json()
    assert any(c["id"] == course_id for c in listing["items"])

    archive = await client.post(f"/v1/admin/courses/{course_id}/archive", headers=moderator_hdr)
    assert archive.status_code == 200
    assert archive.json()["status"] == "archived"


async def test_plain_user_cannot_archive_course(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.post(
        "/v1/admin/courses/1/archive", headers=auth_header(tokens["access_token"])
    )
    assert resp.status_code == 403


# --- Ustozlar bo'limi ---
async def test_non_admin_cannot_list_instructors(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get("/v1/admin/instructors", headers=auth_header(tokens["access_token"]))
    assert resp.status_code == 403


async def test_admin_lists_instructors_with_aggregate_stats(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000070")

    instr_phone = "+998920000071"
    instr_tokens = await register_and_verify(client, phone=instr_phone, full_name="Ustoz Aziz")
    await grant_role(db, instr_phone, RoleCode.INSTRUCTOR)
    instr_hdr = auth_header(instr_tokens["access_token"])

    course = await client.post("/v1/courses", headers=instr_hdr, json={"title": "Grafik dizayn"})
    course_id = course.json()["id"]
    await client.post(
        f"/v1/courses/{course_id}/modules", headers=instr_hdr, json={"title": "1-modul"}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=instr_hdr)

    learner_tokens = await register_and_verify(client, phone="+998920000072")
    learner_hdr = auth_header(learner_tokens["access_token"])
    await client.post("/v1/enrollments", headers=learner_hdr, data={"course_id": course_id})

    page = (await client.get("/v1/admin/instructors", headers=admin_hdr)).json()
    row = next(i for i in page["items"] if i["full_name"] == "Ustoz Aziz")
    assert row["courses_count"] == 1
    assert row["published_courses_count"] == 1
    assert row["total_students"] == 1
    assert row["generosity_tier"] is None  # 10 tadan kam tugatgan


async def test_admin_instructor_detail_shows_all_course_statuses(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000080")

    instr_phone = "+998920000081"
    instr_tokens = await register_and_verify(client, phone=instr_phone, full_name="Ustoz Dilnoza")
    await grant_role(db, instr_phone, RoleCode.INSTRUCTOR)
    instr_hdr = auth_header(instr_tokens["access_token"])
    instructor_id = (await client.get("/v1/users/me", headers=instr_hdr)).json()["id"]

    draft = await client.post("/v1/courses", headers=instr_hdr, json={"title": "Qoralama kurs"})
    published = await client.post(
        "/v1/courses", headers=instr_hdr, json={"title": "Chop etilgan kurs"}
    )
    published_id = published.json()["id"]
    await client.post(
        f"/v1/courses/{published_id}/modules", headers=instr_hdr, json={"title": "1-modul"}
    )
    await client.post(f"/v1/courses/{published_id}/publish", headers=instr_hdr)

    detail = await client.get(f"/v1/admin/instructors/{instructor_id}", headers=admin_hdr)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["full_name"] == "Ustoz Dilnoza"
    statuses = {c["status"] for c in body["courses"]}
    assert statuses == {"draft", "published"}
    assert len(body["courses"]) == 2
    assert draft.json()["id"] in [c["id"] for c in body["courses"]]


async def test_non_admin_cannot_view_instructor_detail(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get("/v1/admin/instructors/1", headers=auth_header(tokens["access_token"]))
    assert resp.status_code == 403


async def test_admin_verifies_company_and_it_reflects_on_vacancy_card(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000100")
    employer_tokens = await register_and_verify(client, phone="+998920000101")
    employer_hdr = auth_header(employer_tokens["access_token"])
    await grant_role(db, "+998920000101", RoleCode.EMPLOYER)

    company = await client.post(
        "/v1/companies", headers=employer_hdr, json={"name": "Tezkor Logistika"}
    )
    company_id = company.json()["id"]
    assert company.json()["verified"] is False

    vacancy = await client.post(
        f"/v1/companies/{company_id}/vacancies", headers=employer_hdr, json={"title": "Haydovchi"}
    )
    vacancy_id = vacancy.json()["id"]
    await client.post(f"/v1/vacancies/{vacancy_id}/publish", headers=employer_hdr)

    catalog_before = await client.get("/v1/vacancies")
    card_before = next(v for v in catalog_before.json()["items"] if v["id"] == vacancy_id)
    assert card_before["company_verified"] is False

    verify = await client.patch(
        f"/v1/admin/companies/{company_id}/verify", headers=admin_hdr, json={"verified": True}
    )
    assert verify.status_code == 200, verify.text
    assert verify.json()["verified"] is True

    catalog_after = await client.get("/v1/vacancies")
    card_after = next(v for v in catalog_after.json()["items"] if v["id"] == vacancy_id)
    assert card_after["company_verified"] is True


async def test_non_admin_cannot_verify_company(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.patch(
        "/v1/admin/companies/1/verify",
        headers=auth_header(tokens["access_token"]),
        json={"verified": True},
    )
    assert resp.status_code == 403


async def test_non_admin_cannot_view_user_stats(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get("/v1/admin/users/stats", headers=auth_header(tokens["access_token"]))
    assert resp.status_code == 403


async def test_admin_user_stats_counts_total_and_blocked(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000110")
    blocked_tokens = await register_and_verify(client, phone="+998920000111")
    blocked_id = (
        await client.get("/v1/users/me", headers=auth_header(blocked_tokens["access_token"]))
    ).json()["id"]
    await register_and_verify(client, phone="+998920000112")

    before = (await client.get("/v1/admin/users/stats", headers=admin_hdr)).json()
    assert before == {"total": 3, "blocked": 0}  # admin + 2 foydalanuvchi

    await client.patch(
        f"/v1/admin/users/{blocked_id}/status", headers=admin_hdr, json={"status": "blocked"}
    )

    after = (await client.get("/v1/admin/users/stats", headers=admin_hdr)).json()
    assert after == {"total": 3, "blocked": 1}


async def test_non_admin_cannot_export_users(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get("/v1/admin/users/export", headers=auth_header(tokens["access_token"]))
    assert resp.status_code == 403


async def test_admin_exports_users_csv(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000120")
    await register_and_verify(client, phone="+998920000121", full_name="Nodira Karimova")
    await grant_role(db, "+998920000121", RoleCode.INSTRUCTOR)
    await register_and_verify(client, phone="+998920000122", full_name="Sardor Yusupov")

    resp = await client.get("/v1/admin/users/export", headers=admin_hdr)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "attachment" in resp.headers["content-disposition"]

    lines = resp.text.strip().splitlines()
    assert lines[0] == "id,F.I.Sh.,username,telefon,email,holat,rollar,ro'yxatdan o'tgan"
    assert len(lines) == 4  # sarlavha + admin + 2 foydalanuvchi
    assert any("Nodira Karimova" in line and "instructor" in line for line in lines[1:])

    filtered = await client.get(
        "/v1/admin/users/export", headers=admin_hdr, params={"role": "instructor"}
    )
    filtered_lines = filtered.text.strip().splitlines()
    assert len(filtered_lines) == 2  # sarlavha + faqat Nodira
    assert "Nodira Karimova" in filtered_lines[1]


async def test_admin_lists_companies_filtered_by_verified(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000102")
    employer_tokens = await register_and_verify(client, phone="+998920000103")
    employer_hdr = auth_header(employer_tokens["access_token"])
    await grant_role(db, "+998920000103", RoleCode.EMPLOYER)
    await client.post("/v1/companies", headers=employer_hdr, json={"name": "Yangi MChJ"})

    unverified = await client.get("/v1/admin/companies?verified=false", headers=admin_hdr)
    assert unverified.status_code == 200
    assert any(c["name"] == "Yangi MChJ" for c in unverified.json()["items"])

    verified = await client.get("/v1/admin/companies?verified=true", headers=admin_hdr)
    assert all(c["name"] != "Yangi MChJ" for c in verified.json()["items"])


async def test_audit_log_target_name_resolves_course_and_company(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000130")

    instr_tokens = await register_and_verify(
        client, phone="+998920000131", full_name="Ustoz Gulnora"
    )
    instr_hdr = auth_header(instr_tokens["access_token"])
    await grant_role(db, "+998920000131", RoleCode.INSTRUCTOR)
    course = await client.post(
        "/v1/courses", headers=instr_hdr, json={"title": "Grafik dizayn asoslari"}
    )
    course_id = course.json()["id"]
    await client.post(
        f"/v1/courses/{course_id}/modules", headers=instr_hdr, json={"title": "1-modul"}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=instr_hdr)
    await client.post(f"/v1/admin/courses/{course_id}/archive", headers=admin_hdr)

    employer_tokens = await register_and_verify(client, phone="+998920000132")
    employer_hdr = auth_header(employer_tokens["access_token"])
    company = await client.post("/v1/companies", headers=employer_hdr, json={"name": "Aniq Servis"})
    company_id = company.json()["id"]
    await client.patch(
        f"/v1/admin/companies/{company_id}/verify", headers=admin_hdr, json={"verified": True}
    )

    log = (await client.get("/v1/admin/audit-log", headers=admin_hdr)).json()
    course_entry = next(item for item in log["items"] if item["action"] == "course.archive")
    assert course_entry["target_name"] == "Grafik dizayn asoslari"
    assert course_entry["action_label"] == "Kurs arxivlandi"
    company_entry = next(item for item in log["items"] if item["action"] == "company.verify")
    assert company_entry["target_name"] == "Aniq Servis"
    assert company_entry["action_label"] == "Kompaniya tasdiqlandi"


async def test_non_admin_cannot_export_audit_log(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    resp = await client.get(
        "/v1/admin/audit-log/export", headers=auth_header(tokens["access_token"])
    )
    assert resp.status_code == 403


async def test_admin_exports_audit_log_csv(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000140")
    target_tokens = await register_and_verify(client, phone="+998920000141")
    target_id = (
        await client.get("/v1/users/me", headers=auth_header(target_tokens["access_token"]))
    ).json()["id"]
    await client.post(
        f"/v1/admin/users/{target_id}/roles", headers=admin_hdr, json={"role": "mentor"}
    )

    resp = await client.get("/v1/admin/audit-log/export", headers=admin_hdr)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "attachment" in resp.headers["content-disposition"]

    lines = resp.text.strip().splitlines()
    assert lines[0] == "vaqt,amal bajaruvchi,amal,nishon,meta"
    assert any("Rol berildi: Mentor" in line for line in lines[1:])


async def test_company_verification_notifies_owner(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_hdr = await _make_admin(client, db, "+998920000150")
    employer_tokens = await register_and_verify(client, phone="+998920000151")
    employer_hdr = auth_header(employer_tokens["access_token"])
    company = await client.post(
        "/v1/companies", headers=employer_hdr, json={"name": "Ishonchli Qurilish"}
    )
    company_id = company.json()["id"]

    before = (await client.get("/v1/me/notifications", headers=employer_hdr)).json()
    assert not any(n["type"] == "system" for n in before["items"])

    await client.patch(
        f"/v1/admin/companies/{company_id}/verify", headers=admin_hdr, json={"verified": True}
    )

    after = (await client.get("/v1/me/notifications", headers=employer_hdr)).json()
    notif = next(n for n in after["items"] if n["type"] == "system")
    assert "tasdiqlandi" in notif["title"]
    assert "Ishonchli Qurilish" in notif["body"]

    # Qayta tasdiqlash (allaqachon tasdiqlangan) qayta bildirishnoma yubormaydi
    await client.patch(
        f"/v1/admin/companies/{company_id}/verify", headers=admin_hdr, json={"verified": True}
    )
    after_again = (await client.get("/v1/me/notifications", headers=employer_hdr)).json()
    assert len([n for n in after_again["items"] if n["type"] == "system"]) == 1
