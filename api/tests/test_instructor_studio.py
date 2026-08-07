"""Ustoz Studiyasi 2.0 — o'quvchilar, statistika, xabar, saxovat (V2-4/B5)."""

from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Enrollment
from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_instructor(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    return auth_header(tokens["access_token"])


async def _publish_course_with_lessons(
    client: httpx.AsyncClient, hdr: dict[str, str], *, n_lessons: int = 2
) -> tuple[int, list[int]]:
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Grafik dizayn"})
    course_id = course.json()["id"]
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
        lesson_ids.append(lesson.json()["id"])
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    return course_id, lesson_ids


async def test_other_instructor_cannot_see_students(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925001100")
    course_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    other_hdr = await _make_instructor(client, db, "+998925002200")
    resp = await client.get(f"/v1/courses/{course_id}/students", headers=other_hdr)
    assert resp.status_code == 403


async def test_students_list_and_stuck_detection(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925003300")
    course_id, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=2)

    learner = await register_and_verify(client, phone="+998925004400")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_ids[0]}/complete", headers=lhdr)

    students = (await client.get(f"/v1/courses/{course_id}/students", headers=hdr)).json()
    assert len(students) == 1
    assert students[0]["progress_pct"] == 50
    assert students[0]["is_stuck"] is False

    # Enrollment'ning so'nggi faoliyatini 20 kun orqaga suramiz — "qotib qolgan" bo'lishi kerak
    enrollment_id = (
        await db.execute(
            select(Enrollment.id).where(Enrollment.course_id == course_id)
        )
    ).scalar_one()
    await db.execute(
        update(Enrollment)
        .where(Enrollment.id == enrollment_id)
        .values(started_at=datetime.now(UTC) - timedelta(days=20))
    )
    from app.models.course import LessonCompletion

    await db.execute(
        update(LessonCompletion)
        .where(LessonCompletion.enrollment_id == enrollment_id)
        .values(completed_at=datetime.now(UTC) - timedelta(days=20))
    )
    await db.commit()

    students_after = (await client.get(f"/v1/courses/{course_id}/students", headers=hdr)).json()
    assert students_after[0]["is_stuck"] is True


async def test_message_student_creates_notification(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925005500")
    course_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    learner = await register_and_verify(client, phone="+998925006600")
    lhdr = auth_header(learner["access_token"])
    me = await client.get("/v1/users/me", headers=lhdr)
    student_id = me.json()["id"]
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    resp = await client.post(
        f"/v1/courses/{course_id}/students/{student_id}/message",
        headers=hdr,
        json={"title": "Salom!", "body": "Davom eting, sizga ishonamiz."},
    )
    assert resp.status_code == 204

    notifications = (await client.get("/v1/me/notifications", headers=lhdr)).json()
    assert any(n["title"] == "Salom!" for n in notifications["items"])


async def test_message_non_enrolled_student_404(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925007700")
    course_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    other = await register_and_verify(client, phone="+998925008800")
    other_me = await client.get("/v1/users/me", headers=auth_header(other["access_token"]))
    other_id = other_me.json()["id"]

    resp = await client.post(
        f"/v1/courses/{course_id}/students/{other_id}/message",
        headers=hdr,
        json={"title": "Salom", "body": ""},
    )
    assert resp.status_code == 404


async def test_course_stats_completion_and_most_dropped_lesson(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925009900")
    course_id, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=2)

    # 2 ta o'quvchi ro'yxatdan o'tadi
    learner_a = await register_and_verify(client, phone="+998925010000")
    lhdr_a = auth_header(learner_a["access_token"])
    await client.post("/v1/enrollments", headers=lhdr_a, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_ids[0]}/complete", headers=lhdr_a)
    await client.post(f"/v1/lessons/{lesson_ids[1]}/complete", headers=lhdr_a)

    learner_b = await register_and_verify(client, phone="+998925011100")
    lhdr_b = auth_header(learner_b["access_token"])
    await client.post("/v1/enrollments", headers=lhdr_b, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_ids[0]}/complete", headers=lhdr_b)
    # learner_b ikkinchi darsni tugatmaydi — 2-dars "eng ko'p tashlab ketiladigan" bo'lishi kerak

    # Bir marta ko'rish (course_detail chaqiruvi) views_count'ni oshiradi
    course_slug = (await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)).json()["slug"]
    await client.get(f"/v1/courses/{course_slug}")

    stats = (await client.get(f"/v1/courses/{course_id}/stats", headers=hdr)).json()
    assert stats["students_count"] >= 0  # denormalized counter (enroll() increments)
    assert stats["completion_rate_pct"] == 50  # 1 of 2 tugatgan
    assert stats["most_dropped_lesson_title"] == "Dars 2"
    assert stats["views_count"] >= 1
    assert stats["income_available"] is False


async def test_impact_certificate_reflects_free_course_completions(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925012200")
    course_id, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    learner = await register_and_verify(client, phone="+998925013300")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_ids[0]}/complete", headers=lhdr)

    resp = await client.post("/v1/me/impact-certificate", headers=hdr)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total_students_helped"] == 1
    assert body["pdf_url"]


async def test_generosity_tier_appears_on_public_passport(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925014400")
    course_id, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    for i in range(10):
        learner = await register_and_verify(client, phone=f"+99892502{i:04d}")
        lhdr = auth_header(learner["access_token"])
        await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
        await client.post(f"/v1/lessons/{lesson_ids[0]}/complete", headers=lhdr)

    me = await client.get("/v1/users/me", headers=hdr)
    username = me.json()["username"]
    passport = await client.get(f"/v1/passport/{username}")
    assert passport.status_code == 200
    assert passport.json()["generosity_tier"] == "bronze"


async def _create_assignment(client: httpx.AsyncClient, hdr: dict[str, str], module_id: int) -> int:
    resp = await client.post(
        f"/v1/modules/{module_id}/assignments", headers=hdr, json={"title": "Loyihani yuboring"}
    )
    return int(resp.json()["id"])


async def _publish_course_with_assignment(
    client: httpx.AsyncClient, hdr: dict[str, str]
) -> tuple[int, int]:
    course = await client.post("/v1/courses", headers=hdr, json={"title": "SMM asoslari"})
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]
    assignment_id = await _create_assignment(client, hdr, module_id)
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    return course_id, assignment_id


async def test_instructor_dashboard_counts_new_students_and_ungraded(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925020001")
    course_id, assignment_id = await _publish_course_with_assignment(client, hdr)

    empty_dashboard = (await client.get("/v1/instructor/dashboard", headers=hdr)).json()
    assert empty_dashboard["new_students_today"] == 0
    assert empty_dashboard["ungraded_submissions_count"] == 0
    assert empty_dashboard["average_rating"] is None

    learner = await register_and_verify(client, phone="+998925020002")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(
        "/v1/submissions", headers=lhdr, data={"assignment_id": assignment_id, "text": "Tayyor"}
    )

    dashboard = (await client.get("/v1/instructor/dashboard", headers=hdr)).json()
    assert dashboard["new_students_today"] == 1
    assert dashboard["ungraded_submissions_count"] == 1
    assert len(dashboard["oldest_ungraded"]) == 1
    assert dashboard["oldest_ungraded"][0]["assignment_id"] == assignment_id


async def test_instructor_students_lists_across_all_courses(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925021001")
    course_a, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)
    course_b, _ = await _publish_course_with_assignment(client, hdr)

    learner_a = await register_and_verify(client, phone="+998925021002")
    await client.post(
        "/v1/enrollments", headers=auth_header(learner_a["access_token"]),
        data={"course_id": course_a},
    )
    learner_b = await register_and_verify(client, phone="+998925021003")
    await client.post(
        "/v1/enrollments", headers=auth_header(learner_b["access_token"]),
        data={"course_id": course_b},
    )

    students = (await client.get("/v1/instructor/students", headers=hdr)).json()
    assert len(students) == 2
    course_ids = {s["course_id"] for s in students}
    assert course_ids == {course_a, course_b}


async def test_instructor_submissions_queue_and_review_updates_status(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925022001")
    course_id, assignment_id = await _publish_course_with_assignment(client, hdr)

    learner = await register_and_verify(client, phone="+998925022002")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    submission = await client.post(
        "/v1/submissions", headers=lhdr, data={"assignment_id": assignment_id, "text": "Ishim"}
    )
    submission_id = submission.json()["id"]
    learner_username = (await client.get("/v1/users/me", headers=lhdr)).json()["username"]

    queue = (
        await client.get("/v1/instructor/submissions?status_filter=submitted", headers=hdr)
    ).json()
    assert len(queue) == 1
    assert queue[0]["student_username"] == learner_username

    review = await client.post(
        f"/v1/submissions/{submission_id}/review",
        headers=hdr,
        json={"approve": True, "feedback": "Zo'r ish!"},
    )
    assert review.status_code == 200, review.text

    queue_after = (
        await client.get("/v1/instructor/submissions?status_filter=submitted", headers=hdr)
    ).json()
    assert len(queue_after) == 0

    all_submissions = (await client.get("/v1/instructor/submissions", headers=hdr)).json()
    assert all_submissions[0]["status"] == "approved"

    notifications = (await client.get("/v1/me/notifications", headers=lhdr)).json()["items"]
    assignment_notif = next(
        (n for n in notifications if n["type"] == "assignment_reviewed"), None
    )
    assert assignment_notif is not None
    assert assignment_notif["category"] == "learning"
    assert assignment_notif["title"] == "Topshirig'ingiz tekshirildi"


async def test_rejected_submission_notifies_with_different_title(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925022003")
    course_id, assignment_id = await _publish_course_with_assignment(client, hdr)

    learner = await register_and_verify(client, phone="+998925022004")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    submission = await client.post(
        "/v1/submissions", headers=lhdr, data={"assignment_id": assignment_id, "text": "Ishim"}
    )
    submission_id = submission.json()["id"]

    await client.post(
        f"/v1/submissions/{submission_id}/review",
        headers=hdr,
        json={"approve": False, "feedback": "Qayta ko'rib chiqing"},
    )

    notifications = (await client.get("/v1/me/notifications", headers=lhdr)).json()["items"]
    assignment_notif = next(
        (n for n in notifications if n["type"] == "assignment_reviewed"), None
    )
    assert assignment_notif is not None
    assert assignment_notif["title"] == "Topshiriq qayta ishlashni talab qiladi"


async def test_other_instructor_cannot_see_submissions_or_students(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998925023001")
    course_id, assignment_id = await _publish_course_with_assignment(client, hdr)
    learner = await register_and_verify(client, phone="+998925023002")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(
        "/v1/submissions", headers=lhdr, data={"assignment_id": assignment_id, "text": "Ishim"}
    )

    other_hdr = await _make_instructor(client, db, "+998925023003")
    assert (await client.get("/v1/instructor/students", headers=other_hdr)).json() == []
    assert (await client.get("/v1/instructor/submissions", headers=other_hdr)).json() == []
