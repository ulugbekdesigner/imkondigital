"""Kurs konstruktori — modul/dars tahrirlash, o'chirish, tartib (RBAC bilan)."""

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


async def _create_course_with_module_and_lesson(
    client: httpx.AsyncClient, hdr: dict[str, str]
) -> tuple[int, int, int]:
    course = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Konstruktor kursi", "ladder_step": 1}
    )
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul", "sort": 0}
    )
    module_id = module.json()["id"]
    lesson = await client.post(
        f"/v1/modules/{module_id}/lessons",
        headers=hdr,
        json={"title": "1-dars", "sort": 0},
    )
    lesson_id = lesson.json()["id"]
    return course_id, module_id, lesson_id


async def test_update_module_title_and_sort(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998917001100")
    _, module_id, _ = await _create_course_with_module_and_lesson(client, hdr)

    resp = await client.patch(
        f"/v1/modules/{module_id}", headers=hdr, json={"title": "Yangilangan modul", "sort": 5}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["title"] == "Yangilangan modul"
    assert resp.json()["sort"] == 5


async def test_update_lesson_partial_fields(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998917002200")
    _, _, lesson_id = await _create_course_with_module_and_lesson(client, hdr)

    resp = await client.patch(f"/v1/lessons/{lesson_id}", headers=hdr, json={"sort": 3})
    assert resp.status_code == 200
    assert resp.json()["sort"] == 3


async def test_delete_lesson(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998917003300")
    _, _module_id, lesson_id = await _create_course_with_module_and_lesson(client, hdr)

    resp = await client.delete(f"/v1/lessons/{lesson_id}", headers=hdr)
    assert resp.status_code == 204

    again = await client.delete(f"/v1/lessons/{lesson_id}", headers=hdr)
    assert again.status_code == 404


async def test_delete_module_cascades_lessons(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998917004400")
    _, module_id, lesson_id = await _create_course_with_module_and_lesson(client, hdr)

    resp = await client.delete(f"/v1/modules/{module_id}", headers=hdr)
    assert resp.status_code == 204

    lesson_patch = await client.patch(f"/v1/lessons/{lesson_id}", headers=hdr, json={"sort": 1})
    assert lesson_patch.status_code == 404


async def test_non_owner_instructor_cannot_edit(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    owner_hdr = await _make_instructor(client, db, "+998917005500")
    _, module_id, lesson_id = await _create_course_with_module_and_lesson(client, owner_hdr)

    other_hdr = await _make_instructor(client, db, "+998917006600")
    resp = await client.patch(
        f"/v1/modules/{module_id}", headers=other_hdr, json={"title": "Bosqinchi"}
    )
    assert resp.status_code == 403

    resp2 = await client.patch(
        f"/v1/lessons/{lesson_id}", headers=other_hdr, json={"title": "Bosqinchi"}
    )
    assert resp2.status_code == 403


async def test_regular_user_cannot_edit_modules(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998917007700")
    _, module_id, _ = await _create_course_with_module_and_lesson(client, hdr)

    regular_tokens = await register_and_verify(client, phone="+998917008800")
    regular_hdr = auth_header(regular_tokens["access_token"])
    resp = await client.patch(
        f"/v1/modules/{module_id}", headers=regular_hdr, json={"title": "Ruxsatsiz"}
    )
    assert resp.status_code == 403


# --- Dars materiallari ---
async def test_instructor_uploads_and_deletes_material(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998917009900")
    course_id, _, lesson_id = await _create_course_with_module_and_lesson(client, hdr)
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)

    upload = await client.post(
        f"/v1/lessons/{lesson_id}/materials",
        headers=hdr,
        data={"title": "Slaydlar"},
        files={"file": ("slaydlar.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    material_id = upload.json()["id"]
    assert upload.json()["title"] == "Slaydlar"
    assert upload.json()["file_url"]

    detail = await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)
    materials = detail.json()["modules"][0]["lessons"][0]["materials"]
    assert len(materials) == 1
    assert materials[0]["title"] == "Slaydlar"

    delete = await client.delete(f"/v1/lesson-materials/{material_id}", headers=hdr)
    assert delete.status_code == 204

    detail2 = await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)
    assert detail2.json()["modules"][0]["lessons"][0]["materials"] == []


async def test_materials_hidden_for_non_enrolled_paid_course(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998917010000")
    course = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Pullik kurs", "is_free": False, "price": 20000}
    )
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    lesson = await client.post(
        f"/v1/modules/{module.json()['id']}/lessons", headers=hdr, json={"title": "Dars"}
    )
    lesson_id = lesson.json()["id"]
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    await client.post(
        f"/v1/lessons/{lesson_id}/materials",
        headers=hdr,
        data={"title": "Maxfiy material"},
        files={"file": ("f.pdf", b"content", "application/pdf")},
    )

    slug = (await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)).json()["slug"]
    anon = await client.get(f"/v1/courses/{slug}")
    assert anon.json()["modules"][0]["lessons"][0]["materials"] == []


async def test_other_instructor_cannot_upload_or_delete_material(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998917011100")
    _, _, lesson_id = await _create_course_with_module_and_lesson(client, hdr)

    other_hdr = await _make_instructor(client, db, "+998917012200")
    upload = await client.post(
        f"/v1/lessons/{lesson_id}/materials",
        headers=other_hdr,
        data={"title": "Bosqinchi"},
        files={"file": ("f.pdf", b"content", "application/pdf")},
    )
    assert upload.status_code == 403


async def test_regular_user_can_self_become_instructor(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998917013300")
    hdr = auth_header(tokens["access_token"])

    create_course_before = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Ruxsatsiz kurs"}
    )
    assert create_course_before.status_code == 403

    become = await client.post("/v1/users/me/become-instructor", headers=hdr)
    assert become.status_code == 200, become.text
    assert "instructor" in become.json()["roles"]

    create_course_after = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Endi ruxsat bor"}
    )
    assert create_course_after.status_code == 201, create_course_after.text


async def test_become_instructor_is_idempotent(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998917014400")
    hdr = auth_header(tokens["access_token"])

    await client.post("/v1/users/me/become-instructor", headers=hdr)
    second = await client.post("/v1/users/me/become-instructor", headers=hdr)
    assert second.status_code == 200
    assert second.json()["roles"].count("instructor") == 1


async def test_publish_course_requires_at_least_one_module(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998917015500")
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Bo'sh kurs"})
    course_id = course.json()["id"]

    publish = await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    assert publish.status_code == 400
    assert "modul" in publish.json()["detail"]

    still_draft = await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)
    assert still_draft.json()["status"] == "draft"


async def test_owner_can_preview_own_draft_course_via_public_slug(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998917016600")
    course_id, _, _ = await _create_course_with_module_and_lesson(client, hdr)
    slug = (await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)).json()["slug"]

    owner_preview = await client.get(f"/v1/courses/{slug}", headers=hdr)
    assert owner_preview.status_code == 200
    assert owner_preview.json()["status"] == "draft"

    anon = await client.get(f"/v1/courses/{slug}")
    assert anon.status_code == 404

    other_hdr = await _make_instructor(client, db, "+998917017700")
    other_view = await client.get(f"/v1/courses/{slug}", headers=other_hdr)
    assert other_view.status_code == 404
