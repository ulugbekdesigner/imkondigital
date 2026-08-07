"""Quiz tizimi — modul mini-testi va yakuniy nazariy test (V2-3/B2-B3)."""

from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import QuizAttempt
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
) -> tuple[int, int, list[int]]:
    course = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Grafik dizayn asoslari"}
    )
    assert course.status_code == 201, course.text
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

    pub = await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    assert pub.status_code == 200
    return course_id, module_id, lesson_ids


async def _add_two_questions(client: httpx.AsyncClient, hdr: dict[str, str], quiz_id: int) -> None:
    for i in range(2):
        resp = await client.post(
            f"/v1/quizzes/{quiz_id}/questions",
            headers=hdr,
            json={
                "prompt": f"Savol {i + 1}?",
                "choices": ["To'g'ri", "Noto'g'ri"],
                "correct_index": 0,
                "sort": i,
            },
        )
        assert resp.status_code == 201, resp.text


async def _enroll_and_complete_all(
    client: httpx.AsyncClient, lhdr: dict[str, str], course_id: int, lesson_ids: list[int]
) -> None:
    enroll = await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    assert enroll.status_code == 201, enroll.text
    for lid in lesson_ids:
        r = await client.post(f"/v1/lessons/{lid}/complete", headers=lhdr)
        assert r.status_code == 200, r.text


async def _add_module(
    client: httpx.AsyncClient,
    hdr: dict[str, str],
    course_id: int,
    title: str,
    *,
    n_lessons: int,
    sort: int = 1,
) -> tuple[int, list[int]]:
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": title, "sort": sort}
    )
    module_id = module.json()["id"]
    lesson_ids = []
    for i in range(n_lessons):
        lesson = await client.post(
            f"/v1/modules/{module_id}/lessons",
            headers=hdr,
            json={"title": f"{title} — dars {i + 1}", "sort": i},
        )
        lesson_ids.append(lesson.json()["id"])
    return module_id, lesson_ids


async def test_create_module_quiz_and_add_questions(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920001100")
    _, module_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    quiz = await client.post(
        f"/v1/modules/{module_id}/quiz", headers=hdr, json={"title": "1-modul testi"}
    )
    assert quiz.status_code == 201, quiz.text
    quiz_id = quiz.json()["id"]

    await _add_two_questions(client, hdr, quiz_id)

    detail = await client.get(f"/v1/quizzes/{quiz_id}", headers=hdr)
    assert detail.status_code == 200
    assert detail.json()["question_count"] == 2
    assert detail.json()["questions"][0]["correct_index"] == 0


async def test_second_quiz_for_same_module_conflicts(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920002200")
    _, module_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    first = await client.post(
        f"/v1/modules/{module_id}/quiz", headers=hdr, json={"title": "Test"}
    )
    assert first.status_code == 201
    second = await client.post(
        f"/v1/modules/{module_id}/quiz", headers=hdr, json={"title": "Yana test"}
    )
    assert second.status_code == 409


async def test_other_instructor_cannot_manage_quiz(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920003300")
    _, module_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)
    quiz = await client.post(
        f"/v1/modules/{module_id}/quiz", headers=hdr, json={"title": "Test"}
    )
    quiz_id = quiz.json()["id"]

    other_hdr = await _make_instructor(client, db, "+998920004400")
    resp = await client.post(
        f"/v1/quizzes/{quiz_id}/questions",
        headers=other_hdr,
        json={"prompt": "To'g'rimi?", "choices": ["A", "B"], "correct_index": 0},
    )
    assert resp.status_code == 403


async def test_learner_must_be_enrolled_to_start_attempt(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920005500")
    _, module_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)
    quiz = await client.post(
        f"/v1/modules/{module_id}/quiz", headers=hdr, json={"title": "Test"}
    )
    quiz_id = quiz.json()["id"]
    await _add_two_questions(client, hdr, quiz_id)

    learner = await register_and_verify(client, phone="+998920006600")
    lhdr = auth_header(learner["access_token"])
    resp = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    assert resp.status_code == 403


async def test_attempt_scored_correctly_and_marks_passed(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920007700")
    course_id, module_id, _lesson_ids = await _publish_course_with_lessons(
        client, hdr, n_lessons=1
    )
    quiz = await client.post(
        f"/v1/modules/{module_id}/quiz",
        headers=hdr,
        json={"title": "Test", "pass_score_pct": 50},
    )
    quiz_id = quiz.json()["id"]
    await _add_two_questions(client, hdr, quiz_id)

    learner = await register_and_verify(client, phone="+998920008800")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    start = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    assert start.status_code == 201, start.text
    body = start.json()
    attempt_id = body["attempt_id"]
    assert len(body["questions"]) == 2
    # to'g'ri javob har doim index 0 (choices=["To'g'ri", "Noto'g'ri"]) — random tartibga
    # qarab savollarning O'ZI aralashadi, lekin har savolning to'g'ri javobi 0-indeksda
    answers = [0, 0]

    submit = await client.post(
        f"/v1/quiz-attempts/{attempt_id}/submit", headers=lhdr, json={"answers": answers}
    )
    assert submit.status_code == 200, submit.text
    result = submit.json()
    assert result["score_pct"] == 100
    assert result["passed"] is True
    assert result["expired"] is False
    assert result["review_lesson_titles"] == []

    # Qayta topshirish taqiqlanadi
    resubmit = await client.post(
        f"/v1/quiz-attempts/{attempt_id}/submit", headers=lhdr, json={"answers": answers}
    )
    assert resubmit.status_code == 409


async def test_wrong_answers_fail_below_pass_score(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920009900")
    course_id, module_id, _ = await _publish_course_with_lessons(client, hdr, n_lessons=1)
    quiz = await client.post(
        f"/v1/modules/{module_id}/quiz",
        headers=hdr,
        json={"title": "Test", "pass_score_pct": 70},
    )
    quiz_id = quiz.json()["id"]
    await _add_two_questions(client, hdr, quiz_id)

    learner = await register_and_verify(client, phone="+998920010000")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    start = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    attempt_id = start.json()["attempt_id"]

    submit = await client.post(
        f"/v1/quiz-attempts/{attempt_id}/submit", headers=lhdr, json={"answers": [1, 1]}
    )
    assert submit.json()["score_pct"] == 0
    assert submit.json()["passed"] is False
    assert submit.json()["review_lesson_titles"] == ["Dars 1"]


async def test_final_theory_quiz_requires_full_progress(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920011100")
    course_id, _, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=2)
    final_quiz = await client.post(
        f"/v1/courses/{course_id}/final-quiz", headers=hdr, json={"title": "Yakuniy test"}
    )
    assert final_quiz.status_code == 201, final_quiz.text
    quiz_id = final_quiz.json()["id"]
    await _add_two_questions(client, hdr, quiz_id)

    learner = await register_and_verify(client, phone="+998920012200")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    # Hali darslar tugallanmagan — 409
    blocked = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    assert blocked.status_code == 409

    # Barcha darslarni tugatgach — ruxsat beriladi
    for lid in lesson_ids:
        await client.post(f"/v1/lessons/{lid}/complete", headers=lhdr)
    allowed = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    assert allowed.status_code == 201


async def test_expired_attempt_fails_regardless_of_score(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920013300")
    course_id, module_id, _lesson_ids = await _publish_course_with_lessons(
        client, hdr, n_lessons=1
    )
    quiz = await client.post(
        f"/v1/modules/{module_id}/quiz",
        headers=hdr,
        json={"title": "Test", "pass_score_pct": 50, "time_limit_seconds": 30},
    )
    quiz_id = quiz.json()["id"]
    await _add_two_questions(client, hdr, quiz_id)

    learner = await register_and_verify(client, phone="+998920014400")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    start = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    attempt_id = start.json()["attempt_id"]

    await db.execute(
        update(QuizAttempt)
        .where(QuizAttempt.id == attempt_id)
        .values(started_at=datetime.now(UTC) - timedelta(seconds=100))
    )
    await db.commit()

    submit = await client.post(
        f"/v1/quiz-attempts/{attempt_id}/submit", headers=lhdr, json={"answers": [0, 0]}
    )
    result = submit.json()
    assert result["expired"] is True
    assert result["passed"] is False


async def test_second_module_locked_until_first_modules_lessons_done(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920020001")
    course_id, _, first_lessons = await _publish_course_with_lessons(client, hdr, n_lessons=2)
    _, second_lessons = await _add_module(client, hdr, course_id, "2-modul", n_lessons=1)
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)

    learner = await register_and_verify(client, phone="+998920020002")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    # Faqat 1-modulning 1-darsi bajarilgan — 2-modulga o'tish hali taqiqlanadi
    await client.post(f"/v1/lessons/{first_lessons[0]}/complete", headers=lhdr)
    blocked = await client.post(f"/v1/lessons/{second_lessons[0]}/complete", headers=lhdr)
    assert blocked.status_code == 403
    assert "1-modul" in blocked.json()["detail"]

    # 1-modulning barcha darslari bajarilgach — 2-modul ochiladi
    await client.post(f"/v1/lessons/{first_lessons[1]}/complete", headers=lhdr)
    unlocked = await client.post(f"/v1/lessons/{second_lessons[0]}/complete", headers=lhdr)
    assert unlocked.status_code == 200, unlocked.text


async def test_second_module_locked_until_first_modules_quiz_passed(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998920021001")
    course_id, module_id, first_lessons = await _publish_course_with_lessons(
        client, hdr, n_lessons=1
    )
    quiz = await client.post(
        f"/v1/modules/{module_id}/quiz", headers=hdr, json={"title": "1-modul testi"}
    )
    quiz_id = quiz.json()["id"]
    await _add_two_questions(client, hdr, quiz_id)
    _, second_lessons = await _add_module(client, hdr, course_id, "2-modul", n_lessons=1)
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)

    learner = await register_and_verify(client, phone="+998920021002")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{first_lessons[0]}/complete", headers=lhdr)

    # Darslar tugagan, lekin test hali o'tilmagan — 2-modul yopiq
    still_blocked = await client.post(f"/v1/lessons/{second_lessons[0]}/complete", headers=lhdr)
    assert still_blocked.status_code == 403
    assert "testini" in still_blocked.json()["detail"]

    # Testni o'tadi
    start = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    attempt_id = start.json()["attempt_id"]
    submit = await client.post(
        f"/v1/quiz-attempts/{attempt_id}/submit", headers=lhdr, json={"answers": [0, 0]}
    )
    assert submit.json()["passed"] is True

    unlocked = await client.post(f"/v1/lessons/{second_lessons[0]}/complete", headers=lhdr)
    assert unlocked.status_code == 200, unlocked.text


async def test_first_module_is_never_locked(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998920022001")
    course_id, _, first_lessons = await _publish_course_with_lessons(client, hdr, n_lessons=1)
    await _add_module(client, hdr, course_id, "2-modul", n_lessons=1)
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)

    learner = await register_and_verify(client, phone="+998920022002")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    resp = await client.post(f"/v1/lessons/{first_lessons[0]}/complete", headers=lhdr)
    assert resp.status_code == 200, resp.text
