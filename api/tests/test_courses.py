"""Ta'lim Akademiyasi testlari — CRUD, RBAC, katalog filtri, progress hisobi."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_instructor(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    return auth_header(tokens["access_token"])


async def _publish_course_with_lessons(
    client: httpx.AsyncClient, hdr: dict[str, str], *, step: int = 1, n_lessons: int = 2
) -> tuple[str, list[int]]:
    """Kurs + modul + darslar yaratib, publish qiladi. (slug, lesson_ids) qaytaradi."""
    course = await client.post(
        "/v1/courses",
        headers=hdr,
        json={
            "title": "Tikuvchilik asoslari",
            "description": "Uydan buyurtma",
            "ladder_step": step,
        },
    )
    assert course.status_code == 201, course.text
    course_id = course.json()["id"]
    slug = course.json()["slug"]

    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]

    lesson_ids = []
    for i in range(n_lessons):
        lesson = await client.post(
            f"/v1/modules/{module_id}/lessons",
            headers=hdr,
            json={"title": f"Dars {i + 1}", "sort": i},
        )
        assert lesson.status_code == 201
        lesson_ids.append(lesson.json()["id"])

    pub = await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    assert pub.status_code == 200
    return slug, lesson_ids


async def test_regular_user_cannot_create_course(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998901112233")
    resp = await client.post(
        "/v1/courses", headers=auth_header(tokens["access_token"]), json={"title": "Test kurs"}
    )
    assert resp.status_code == 403


async def test_published_course_appears_in_catalog(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    slug, _ = await _publish_course_with_lessons(client, hdr, step=1)

    catalog = await client.get("/v1/courses")
    assert catalog.status_code == 200
    items = catalog.json()["items"]
    assert any(c["slug"] == slug for c in items)
    card = next(c for c in items if c["slug"] == slug)
    assert card["lessons_count"] == 2
    assert card["is_free"] is True


async def test_catalog_filters_by_ladder_step(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    await _publish_course_with_lessons(client, hdr, step=1)
    await _publish_course_with_lessons(client, hdr, step=3)

    step1 = await client.get("/v1/courses?step=1")
    assert step1.status_code == 200
    assert all(c["ladder_step"] == 1 for c in step1.json()["items"])
    assert len(step1.json()["items"]) == 1


async def test_draft_course_not_public(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Qoralama"})
    slug = course.json()["slug"]
    # Publish qilinmagan — katalogda ham, detalda ham ko'rinmaydi
    assert (await client.get("/v1/courses")).json()["items"] == []
    assert (await client.get(f"/v1/courses/{slug}")).status_code == 404


async def test_enroll_and_progress_computation(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    slug, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=2)
    detail = (await client.get(f"/v1/courses/{slug}")).json()
    course_id = detail["id"]

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])

    enroll = await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    assert enroll.status_code == 201
    assert enroll.json()["progress_pct"] == 0

    # 1-darsni tugatish → 50%, sertifikat hali yo'q
    r1 = await client.post(f"/v1/lessons/{lesson_ids[0]}/complete", headers=lhdr)
    assert r1.status_code == 200
    assert r1.json()["progress_pct"] == 50
    assert r1.json()["course_completed"] is False
    assert r1.json()["certificate_uid"] is None

    # Takroriy tugatish progressni oshirmaydi (idempotent)
    r1b = await client.post(f"/v1/lessons/{lesson_ids[0]}/complete", headers=lhdr)
    assert r1b.json()["progress_pct"] == 50

    # 2-darsni tugatish → 100% + kurs tugadi + sertifikat avtomatik beriladi
    r2 = await client.post(f"/v1/lessons/{lesson_ids[1]}/complete", headers=lhdr)
    assert r2.json()["progress_pct"] == 100
    assert r2.json()["course_completed"] is True
    cert_uid = r2.json()["certificate_uid"]
    assert cert_uid and cert_uid.startswith("IMKON-")

    my = (await client.get("/v1/me/enrollments", headers=lhdr)).json()
    assert my[0]["enrollment"]["status"] == "completed"
    assert my[0]["enrollment"]["progress_pct"] == 100

    # Sertifikat public verify orqali tekshiriladi (autentifikatsiyasiz)
    verify = await client.get(f"/v1/verify/{cert_uid}")
    assert verify.status_code == 200
    assert verify.json()["full_name"] == "Test Foydalanuvchi"

    # /me/certificates ro'yxatida ham ko'rinadi, PDF/QR URL bilan
    my_certs = (await client.get("/v1/me/certificates", headers=lhdr)).json()
    assert len(my_certs) == 1
    assert my_certs[0]["uid"] == cert_uid
    assert my_certs[0]["pdf_url"] and my_certs[0]["qr_url"]
    assert my_certs[0]["course_title"] == "Tikuvchilik asoslari"


async def test_complete_without_enrollment_forbidden(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    _, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    learner = await register_and_verify(client, phone="+998901112233")
    resp = await client.post(
        f"/v1/lessons/{lesson_ids[0]}/complete", headers=auth_header(learner["access_token"])
    )
    assert resp.status_code == 403


async def test_my_courses_includes_drafts(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998907779900")
    await client.post("/v1/courses", headers=hdr, json={"title": "Qoralama kurs"})
    await _publish_course_with_lessons(client, hdr, n_lessons=1)

    my_courses = (await client.get("/v1/me/courses", headers=hdr)).json()
    statuses = {c["status"] for c in my_courses}
    assert statuses == {"draft", "published"}


async def test_progress_reports_locked_module_ids(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """2-modul ochilishi 1-modul TO'LIQ tugallanmaguncha /progress'da 'locked' bo'lib qoladi."""
    hdr = await _make_instructor(client, db, "+998907781122")

    course = await client.post(
        "/v1/courses",
        headers=hdr,
        json={"title": "Ikki modulli kurs", "description": "Test", "ladder_step": 1},
    )
    course_id = course.json()["id"]

    module1 = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul", "sort": 0}
    )
    module1_id = module1.json()["id"]
    lesson1 = await client.post(
        f"/v1/modules/{module1_id}/lessons", headers=hdr, json={"title": "Dars 1", "sort": 0}
    )
    lesson1_id = lesson1.json()["id"]

    module2 = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "2-modul", "sort": 1}
    )
    module2_id = module2.json()["id"]
    await client.post(
        f"/v1/modules/{module2_id}/lessons", headers=hdr, json={"title": "Dars 2", "sort": 0}
    )

    pub = await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    assert pub.status_code == 200

    learner = await register_and_verify(client, phone="+998901112244")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    # 1-modul hali tugallanmagan — 2-modul qulflangan bo'lishi kerak
    before = await client.get(f"/v1/courses/{course_id}/progress", headers=lhdr)
    assert before.status_code == 200
    assert before.json()["locked_module_ids"] == [module2_id]

    # 1-moduldagi yagona darsni tugatish — 2-modul qulfi ochiladi
    complete = await client.post(f"/v1/lessons/{lesson1_id}/complete", headers=lhdr)
    assert complete.status_code == 200

    after = await client.get(f"/v1/courses/{course_id}/progress", headers=lhdr)
    assert after.json()["locked_module_ids"] == []


async def test_owned_course_detail_allows_owner_but_not_others(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907780011")
    draft = await client.post("/v1/courses", headers=hdr, json={"title": "Qoralama 2"})
    course_id = draft.json()["id"]

    own_view = await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)
    assert own_view.status_code == 200
    assert own_view.json()["status"] == "draft"

    other_hdr = await _make_instructor(client, db, "+998907780022")
    forbidden = await client.get(f"/v1/courses/by-id/{course_id}", headers=other_hdr)
    assert forbidden.status_code == 403


async def test_draft_course_without_enrollments_is_hard_deleted(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907780031")
    draft = await client.post("/v1/courses", headers=hdr, json={"title": "Bekor qilinadigan"})
    course_id = draft.json()["id"]

    resp = await client.delete(f"/v1/courses/{course_id}", headers=hdr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["action"] == "deleted"

    gone = await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)
    assert gone.status_code == 404


async def test_published_course_with_enrollments_is_archived_not_deleted(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907780032")
    slug, _lesson_ids = await _publish_course_with_lessons(client, hdr)

    course_detail = await client.get(f"/v1/courses/{slug}")
    course_id = course_detail.json()["id"]

    learner = await register_and_verify(client, phone="+998907780033")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    resp = await client.delete(f"/v1/courses/{course_id}", headers=hdr)
    assert resp.status_code == 200, resp.text
    assert resp.json()["action"] == "archived"

    own_view = await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)
    assert own_view.status_code == 200
    assert own_view.json()["status"] == "archived"

    catalog = await client.get("/v1/courses")
    assert course_id not in [c["id"] for c in catalog.json()["items"]]


async def test_stranger_instructor_cannot_delete_course(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907780034")
    draft = await client.post("/v1/courses", headers=hdr, json={"title": "Begona kurs"})
    course_id = draft.json()["id"]

    stranger_hdr = await _make_instructor(client, db, "+998907780035")
    resp = await client.delete(f"/v1/courses/{course_id}", headers=stranger_hdr)
    assert resp.status_code == 403
