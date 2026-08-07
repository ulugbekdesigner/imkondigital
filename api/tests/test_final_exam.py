"""Yakuniy amaliy imtihon + AI/Ustoz baholash duetining natijasi (V2-3/B3)."""

from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.certificate import Certificate
from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify

_AI_REPLY_READY = (
    '{"score_pct": 90, "readiness_pct": 85, "feedback": "Juda yaxshi ish.", "verdict": "ready"}'
)


async def _make_instructor(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    return auth_header(tokens["access_token"])


async def _setup_course_ready_for_final_exam(
    client: httpx.AsyncClient, db: AsyncSession, *, instructor_phone: str, learner_phone: str
) -> tuple[int, dict[str, str], dict[str, str]]:
    """Kurs + 1 dars + yakuniy nazariy test (1 savol) yaratadi, o'quvchini ro'yxatga

    oladi, darsni tugatadi va nazariy testdan o'tkazadi — final imtihon
    topshirishga tayyor holatga keltiradi. (course_id, instructor_hdr, learner_hdr).
    """
    hdr = await _make_instructor(client, db, instructor_phone)
    course = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Video Montaj Kursi"}
    )
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]
    lesson = await client.post(
        f"/v1/modules/{module_id}/lessons", headers=hdr, json={"title": "Dars 1"}
    )
    lesson_id = lesson.json()["id"]
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)

    final_quiz = await client.post(
        f"/v1/courses/{course_id}/final-quiz",
        headers=hdr,
        json={"title": "Yakuniy test", "pass_score_pct": 50},
    )
    quiz_id = final_quiz.json()["id"]
    await client.post(
        f"/v1/quizzes/{quiz_id}/questions",
        headers=hdr,
        json={"prompt": "To'g'rimi?", "choices": ["To'g'ri", "Noto'g'ri"], "correct_index": 0},
    )
    await client.patch(
        f"/v1/courses/{course_id}/final-exam-brief",
        headers=hdr,
        json={"final_exam_brief": "Real loyihangizni 5 daqiqalik videoga montaj qiling."},
    )

    learner = await register_and_verify(client, phone=learner_phone)
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_id}/complete", headers=lhdr)

    start = await client.post(f"/v1/quizzes/{quiz_id}/attempts", headers=lhdr)
    attempt_id = start.json()["attempt_id"]
    await client.post(
        f"/v1/quiz-attempts/{attempt_id}/submit", headers=lhdr, json={"answers": [0]}
    )
    return course_id, hdr, lhdr


async def test_submission_blocked_before_theory_quiz_passed(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998921001100")
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Kurs"})
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    lesson = await client.post(
        f"/v1/modules/{module.json()['id']}/lessons", headers=hdr, json={"title": "Dars"}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    await client.post(
        f"/v1/courses/{course_id}/final-quiz", headers=hdr, json={"title": "Yakuniy test"}
    )

    learner = await register_and_verify(client, phone="+998921002200")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson.json()['id']}/complete", headers=lhdr)

    resp = await client.post(
        f"/v1/courses/{course_id}/final-exam-submission", headers=lhdr, data={"text": "Ishim"}
    )
    assert resp.status_code == 409


async def test_submission_triggers_ai_grading_and_creates_assessment(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    course_id, _hdr, lhdr = await _setup_course_ready_for_final_exam(
        client, db, instructor_phone="+998921003300", learner_phone="+998921004400"
    )

    with patch(
        "app.modules.ai.exam_grader.generate_ai_reply",
        new=AsyncMock(return_value=_AI_REPLY_READY),
    ):
        resp = await client.post(
            f"/v1/courses/{course_id}/final-exam-submission",
            headers=lhdr,
            data={"text": "Mening ishim shu"},
        )
    assert resp.status_code == 201, resp.text
    assert resp.json()["text"] == "Mening ishim shu"

    status_resp = await client.get(f"/v1/courses/{course_id}/final-status", headers=lhdr)
    body = status_resp.json()
    assert body["final_quiz_passed"] is True
    assert body["assessment"]["ai_score_pct"] == 90
    assert body["assessment"]["ai_verdict"] == "ready"
    assert body["assessment"]["mentor_verdict"] is None


async def test_malformed_ai_reply_falls_back_to_needs_practice(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    course_id, _hdr, lhdr = await _setup_course_ready_for_final_exam(
        client, db, instructor_phone="+998921005500", learner_phone="+998921006600"
    )
    with patch(
        "app.modules.ai.exam_grader.generate_ai_reply",
        new=AsyncMock(return_value="bu JSON emas"),
    ):
        resp = await client.post(
            f"/v1/courses/{course_id}/final-exam-submission", headers=lhdr, data={"text": "x"}
        )
    assert resp.status_code == 201
    status_resp = await client.get(f"/v1/courses/{course_id}/final-status", headers=lhdr)
    assert status_resp.json()["assessment"]["ai_verdict"] == "needs_practice"


async def test_mentor_confirm_ready_sets_certificate_confirmed(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    course_id, hdr, lhdr = await _setup_course_ready_for_final_exam(
        client, db, instructor_phone="+998921007700", learner_phone="+998921008800"
    )
    with patch(
        "app.modules.ai.exam_grader.generate_ai_reply",
        new=AsyncMock(return_value=_AI_REPLY_READY),
    ):
        await client.post(
            f"/v1/courses/{course_id}/final-exam-submission", headers=lhdr, data={"text": "x"}
        )

    queue = await client.get("/v1/me/mentor/assessments", headers=hdr)
    assert queue.status_code == 200
    assert len(queue.json()) == 1
    assessment_id = queue.json()[0]["assessment"]["id"]
    assert queue.json()[0]["course_title"] == "Video Montaj Kursi"

    confirm = await client.post(
        f"/v1/assessments/{assessment_id}/confirm",
        headers=hdr,
        json={"verdict": "ready", "feedback": "Mustaqil ishlashga tayyor."},
    )
    assert confirm.status_code == 200
    assert confirm.json()["mentor_verdict"] == "ready"
    assert confirm.json()["confirmed_at"] is not None

    # Endi kutilayotganlar navbatida ko'rinmaydi
    queue_after = await client.get("/v1/me/mentor/assessments", headers=hdr)
    assert queue_after.json() == []

    me = await client.get("/v1/users/me", headers=lhdr)
    user_id = me.json()["id"]
    cert = (
        await db.execute(
            select(Certificate).where(
                Certificate.user_id == user_id, Certificate.course_id == course_id
            )
        )
    ).scalar_one()
    assert cert.confirmed_at is not None
    assert cert.readiness_pct == 85


async def test_other_instructor_cannot_confirm_assessment(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    course_id, _hdr, lhdr = await _setup_course_ready_for_final_exam(
        client, db, instructor_phone="+998921009900", learner_phone="+998921010000"
    )
    with patch(
        "app.modules.ai.exam_grader.generate_ai_reply",
        new=AsyncMock(return_value=_AI_REPLY_READY),
    ):
        await client.post(
            f"/v1/courses/{course_id}/final-exam-submission", headers=lhdr, data={"text": "x"}
        )
    status_resp = await client.get(f"/v1/courses/{course_id}/final-status", headers=lhdr)
    assessment_id = status_resp.json()["assessment"]["id"]

    other_hdr = await _make_instructor(client, db, "+998921011100")
    resp = await client.post(
        f"/v1/assessments/{assessment_id}/confirm",
        headers=other_hdr,
        json={"verdict": "ready", "feedback": "..."},
    )
    assert resp.status_code == 403
