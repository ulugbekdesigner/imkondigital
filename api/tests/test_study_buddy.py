"""AI Study Buddy — dars konteksti (transkript), kvota, ruxsat nazorati (V2-3/B2)."""

from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Lesson
from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_instructor(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    return auth_header(tokens["access_token"])


async def _create_lesson(
    client: httpx.AsyncClient,
    db: AsyncSession,
    hdr: dict[str, str],
    *,
    is_free: bool,
    transcript: str | None = None,
) -> int:
    course = await client.post(
        "/v1/courses",
        headers=hdr,
        json={"title": "Kurs", "is_free": is_free, "price": 0 if is_free else 50000},
    )
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    lesson = await client.post(
        f"/v1/modules/{module.json()['id']}/lessons", headers=hdr, json={"title": "Dars 1"}
    )
    lesson_id = lesson.json()["id"]
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)

    if transcript is not None:
        row = await db.get(Lesson, lesson_id)
        assert row is not None
        row.transcript = transcript
        await db.commit()
    return lesson_id


async def test_send_message_uses_lesson_transcript_in_prompt(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998922001100")
    lesson_id = await _create_lesson(
        client, db, hdr, is_free=True, transcript="Bugun ranglar nazariyasini o'rganamiz."
    )
    learner = await register_and_verify(client, phone="+998922002200")
    lhdr = auth_header(learner["access_token"])

    with patch(
        "app.modules.ai.study_buddy.generate_ai_reply", new=AsyncMock(return_value="Albatta!")
    ) as mocked:
        resp = await client.post(
            f"/v1/ai/study-buddy/{lesson_id}/messages",
            headers=lhdr,
            json={"content": "Tushunmadim, soddaroq tushuntiring"},
        )
    assert resp.status_code == 200, resp.text
    assert resp.json()["content"] == "Albatta!"
    system_prompt = mocked.call_args.kwargs["system"]
    assert "ranglar nazariyasini" in system_prompt


async def test_history_scoped_per_lesson(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998922003300")
    lesson_a = await _create_lesson(client, db, hdr, is_free=True)
    lesson_b = await _create_lesson(client, db, hdr, is_free=True)
    learner = await register_and_verify(client, phone="+998922004400")
    lhdr = auth_header(learner["access_token"])

    with patch(
        "app.modules.ai.study_buddy.generate_ai_reply", new=AsyncMock(return_value="Javob A")
    ):
        await client.post(
            f"/v1/ai/study-buddy/{lesson_a}/messages", headers=lhdr, json={"content": "Salom"}
        )

    history_b = await client.get(f"/v1/ai/study-buddy/{lesson_b}/messages", headers=lhdr)
    assert history_b.json() == []
    history_a = await client.get(f"/v1/ai/study-buddy/{lesson_a}/messages", headers=lhdr)
    assert len(history_a.json()) == 2  # user + assistant


async def test_paid_course_lesson_requires_enrollment(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998922005500")
    lesson_id = await _create_lesson(client, db, hdr, is_free=False)
    learner = await register_and_verify(client, phone="+998922006600")
    lhdr = auth_header(learner["access_token"])

    with patch(
        "app.modules.ai.study_buddy.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ):
        blocked = await client.post(
            f"/v1/ai/study-buddy/{lesson_id}/messages", headers=lhdr, json={"content": "Salom"}
        )
        assert blocked.status_code == 403

        # Kursga yozilgach — ruxsat beriladi.
        course = await client.get("/v1/me/courses", headers=hdr)
        course_id = course.json()[0]["id"]
        await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

        allowed = await client.post(
            f"/v1/ai/study-buddy/{lesson_id}/messages", headers=lhdr, json={"content": "Salom"}
        )
        assert allowed.status_code == 200


async def test_quota_exceeded_returns_429(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998922007700")
    lesson_id = await _create_lesson(client, db, hdr, is_free=True)
    learner = await register_and_verify(client, phone="+998922008800")
    lhdr = auth_header(learner["access_token"])

    with patch(
        "app.modules.ai.study_buddy.generate_ai_reply", new=AsyncMock(return_value="Javob")
    ):
        for _ in range(30):  # ai_daily_quota_study_buddy=30 (standart)
            resp = await client.post(
                f"/v1/ai/study-buddy/{lesson_id}/messages", headers=lhdr, json={"content": "?"}
            )
            assert resp.status_code == 200
        limited = await client.post(
            f"/v1/ai/study-buddy/{lesson_id}/messages", headers=lhdr, json={"content": "?"}
        )
    assert limited.status_code == 429
