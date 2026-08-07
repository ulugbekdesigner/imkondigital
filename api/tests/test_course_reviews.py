"""Kurs sharhlari — "Fikrlar markazi" (V2-4/B5)."""

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


async def _publish_course(client: httpx.AsyncClient, hdr: dict[str, str]) -> int:
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Fotografiya kursi"})
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    await client.post(
        f"/v1/modules/{module.json()['id']}/lessons", headers=hdr, json={"title": "Dars 1"}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    return course_id


async def test_review_requires_enrollment(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998924001100")
    course_id = await _publish_course(client, hdr)

    learner = await register_and_verify(client, phone="+998924002200")
    lhdr = auth_header(learner["access_token"])
    resp = await client.post(
        f"/v1/courses/{course_id}/reviews", headers=lhdr, json={"rating": 5, "comment": "Ajoyib!"}
    )
    assert resp.status_code == 403


async def test_review_upsert_and_rating_recompute(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998924003300")
    course_id = await _publish_course(client, hdr)

    learner_a = await register_and_verify(client, phone="+998924004400")
    lhdr_a = auth_header(learner_a["access_token"])
    await client.post("/v1/enrollments", headers=lhdr_a, data={"course_id": course_id})

    learner_b = await register_and_verify(client, phone="+998924005500")
    lhdr_b = auth_header(learner_b["access_token"])
    await client.post("/v1/enrollments", headers=lhdr_b, data={"course_id": course_id})

    r1 = await client.post(
        f"/v1/courses/{course_id}/reviews", headers=lhdr_a, json={"rating": 5, "comment": "A'lo"}
    )
    assert r1.status_code == 200, r1.text
    r2 = await client.post(
        f"/v1/courses/{course_id}/reviews", headers=lhdr_b, json={"rating": 3, "comment": "Yaxshi"}
    )
    assert r2.status_code == 200

    catalog = await client.get("/v1/courses")
    course_card = next(c for c in catalog.json()["items"] if c["id"] == course_id)
    assert course_card["rating"] == 4.0

    # Qayta yuborish — yangilanadi, yangi qator yaratilmaydi
    r1b = await client.post(
        f"/v1/courses/{course_id}/reviews",
        headers=lhdr_a,
        json={"rating": 1, "comment": "Fikrim o'zgardi"},
    )
    assert r1b.status_code == 200
    reviews = (await client.get(f"/v1/courses/{course_id}/reviews")).json()
    assert len(reviews) == 2
    assert any(r["comment"] == "Fikrim o'zgardi" for r in reviews)


async def test_instructor_can_reply_others_cannot(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998924006600")
    course_id = await _publish_course(client, hdr)

    learner = await register_and_verify(client, phone="+998924007700")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    review = await client.post(
        f"/v1/courses/{course_id}/reviews", headers=lhdr, json={"rating": 4, "comment": "Yaxshi"}
    )
    review_id = review.json()["id"]

    other_hdr = await _make_instructor(client, db, "+998924008800")
    forbidden = await client.patch(
        f"/v1/course-reviews/{review_id}/reply", headers=other_hdr, json={"reply": "..."}
    )
    assert forbidden.status_code == 403

    ok = await client.patch(
        f"/v1/course-reviews/{review_id}/reply",
        headers=hdr,
        json={"reply": "Rahmat, fikringiz uchun!"},
    )
    assert ok.status_code == 200
    assert ok.json()["instructor_reply"] == "Rahmat, fikringiz uchun!"
