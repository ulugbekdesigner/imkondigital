"""Kunlik faollik ketma-ketligi (streak) — KENGAYISH_PLAN_3.md 3.2-bo'lim."""

from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from app.models.streak import UserStreak
from tests.helpers import auth_header, grant_role, register_and_verify


async def _publish_course_with_quiz(
    client: httpx.AsyncClient, hdr: dict[str, str]
) -> tuple[int, int]:
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Ingliz tili A1"})
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]
    lesson = await client.post(
        f"/v1/modules/{module_id}/lessons", headers=hdr, json={"title": "Dars 1", "sort": 0}
    )
    lesson_id = lesson.json()["id"]
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    return course_id, lesson_id


async def _make_instructor_with_course(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> tuple[dict[str, str], int, int]:
    tokens = await register_and_verify(client, phone=phone)
    hdr = auth_header(tokens["access_token"])
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    course_id, lesson_id = await _publish_course_with_quiz(client, hdr)
    return hdr, course_id, lesson_id


async def test_streak_starts_at_zero_before_any_activity(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998916001100")
    hdr = auth_header(tokens["access_token"])

    resp = await client.get("/v1/me/streak", headers=hdr)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["current_streak"] == 0
    assert body["longest_streak"] == 0
    assert body["last_activity_date"] is None
    assert body["active_today"] is False


async def test_completing_lesson_starts_streak(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    _ihdr, course_id, lesson_id = await _make_instructor_with_course(
        client, db, "+998916002200"
    )
    learner_tokens = await register_and_verify(client, phone="+998916002201")
    lhdr = auth_header(learner_tokens["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_id}/complete", headers=lhdr)

    streak = (await client.get("/v1/me/streak", headers=lhdr)).json()
    assert streak["current_streak"] == 1
    assert streak["longest_streak"] == 1
    assert streak["active_today"] is True


async def test_repeated_activity_same_day_does_not_double_count(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    _ihdr, course_id, lesson_id = await _make_instructor_with_course(
        client, db, "+998916003300"
    )
    learner_tokens = await register_and_verify(client, phone="+998916003301")
    lhdr = auth_header(learner_tokens["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_id}/complete", headers=lhdr)
    await client.post(f"/v1/lessons/{lesson_id}/complete", headers=lhdr)  # qayta bosilsa ham

    streak = (await client.get("/v1/me/streak", headers=lhdr)).json()
    assert streak["current_streak"] == 1


async def test_activity_yesterday_then_today_increments_streak(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr, course_id, lesson_id = await _make_instructor_with_course(
        client, db, "+998916004400"
    )
    me = await client.get("/v1/users/me", headers=hdr)
    user_id = me.json()["id"]

    yesterday = (datetime.now(UTC) - timedelta(days=1)).date()
    db.add(
        UserStreak(
            user_id=user_id, current_streak=3, longest_streak=3, last_activity_date=yesterday
        )
    )
    await db.commit()

    await client.post("/v1/enrollments", headers=hdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_id}/complete", headers=hdr)

    streak = (await client.get("/v1/me/streak", headers=hdr)).json()
    assert streak["current_streak"] == 4
    assert streak["longest_streak"] == 4


async def test_gap_of_two_days_resets_streak(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr, course_id, lesson_id = await _make_instructor_with_course(
        client, db, "+998916005500"
    )
    me = await client.get("/v1/users/me", headers=hdr)
    user_id = me.json()["id"]

    two_days_ago = (datetime.now(UTC) - timedelta(days=2)).date()
    db.add(
        UserStreak(
            user_id=user_id, current_streak=10, longest_streak=10, last_activity_date=two_days_ago
        )
    )
    await db.commit()

    await client.post("/v1/enrollments", headers=hdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_id}/complete", headers=hdr)

    streak = (await client.get("/v1/me/streak", headers=hdr)).json()
    assert streak["current_streak"] == 1
    assert streak["longest_streak"] == 10  # eng uzun rekord saqlanadi


async def test_streak_requires_authentication(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/me/streak")
    assert resp.status_code == 401
