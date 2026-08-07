"""'Mening ma'lumotlarim' arxivi — KENGAYISH_PLAN_3.md 8-bo'lim."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def test_data_export_requires_authentication(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/users/me/data-export")
    assert resp.status_code == 401


async def test_data_export_contains_own_profile(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(
        client, phone="+998917003300", full_name="Zilola Rahimova"
    )
    hdr = auth_header(tokens["access_token"])

    resp = await client.get("/v1/users/me/data-export", headers=hdr)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["profile"]["full_name"] == "Zilola Rahimova"
    assert body["enrollments"] == []
    assert body["certificates"] == []
    assert body["portfolio"] == []
    assert body["applications"] == []
    assert body["orders"] == []
    assert body["streak"]["current_streak"] == 0
    assert body["generated_cv"] is None
    assert "exported_at" in body


async def test_data_export_includes_enrollment_and_certificate_after_course_completion(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998917003301")
    ihdr = auth_header(tokens["access_token"])
    await grant_role(db, "+998917003301", RoleCode.INSTRUCTOR)
    course = await client.post(
        "/v1/courses", headers=ihdr, json={"title": "Sertifikatli kurs"}
    )
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=ihdr, json={"title": "1-modul"}
    )
    lesson = await client.post(
        f"/v1/modules/{module.json()['id']}/lessons",
        headers=ihdr,
        json={"title": "Yakuniy dars", "sort": 0},
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=ihdr)

    learner_tokens = await register_and_verify(client, phone="+998917003302")
    lhdr = auth_header(learner_tokens["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson.json()['id']}/complete", headers=lhdr)

    resp = await client.get("/v1/users/me/data-export", headers=lhdr)
    body = resp.json()
    assert len(body["enrollments"]) == 1
    assert body["enrollments"][0]["course_title"] == "Sertifikatli kurs"
    assert len(body["certificates"]) == 1
    assert body["streak"]["current_streak"] == 1


async def test_data_export_does_not_leak_other_users_data(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    await register_and_verify(client, phone="+998917003303", full_name="Birinchi Foydalanuvchi")
    tokens2 = await register_and_verify(
        client, phone="+998917003304", full_name="Ikkinchi Foydalanuvchi"
    )
    hdr2 = auth_header(tokens2["access_token"])

    resp = await client.get("/v1/users/me/data-export", headers=hdr2)
    assert resp.json()["profile"]["full_name"] == "Ikkinchi Foydalanuvchi"
