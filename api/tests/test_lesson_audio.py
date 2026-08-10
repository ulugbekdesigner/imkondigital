"""Dars matnini ovozga aylantirish (Edge-TTS, "O'qib ber") — /v1/lessons/{id}/audio."""

from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Lesson
from tests.helpers import auth_header, register_and_verify
from tests.test_courses import _make_instructor, _publish_course_with_lessons


async def _set_transcript(db: AsyncSession, lesson_id: int, text: str | None) -> None:
    lesson = await db.get(Lesson, lesson_id)
    assert lesson is not None
    lesson.transcript = text
    await db.commit()


async def test_generates_and_caches_audio(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    _slug, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=1)
    await _set_transcript(db, lesson_ids[0], "Bu darsning matni.")

    with patch(
        "app.core.tts.synthesize_lesson_audio",
        new=AsyncMock(return_value="https://media.imkondigital.uz/tts/lessons/1.mp3"),
    ) as fake_tts:
        first = await client.post(f"/v1/lessons/{lesson_ids[0]}/audio")
        assert first.status_code == 200, first.text
        assert first.json()["audio_url"] == "https://media.imkondigital.uz/tts/lessons/1.mp3"
        fake_tts.assert_awaited_once()

        second = await client.post(f"/v1/lessons/{lesson_ids[0]}/audio")
        assert second.status_code == 200
        assert second.json()["audio_url"] == first.json()["audio_url"]
        fake_tts.assert_awaited_once()  # keshdan qaytdi, qayta generatsiya qilinmadi


async def test_lesson_without_transcript_returns_404(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    _slug, lesson_ids = await _publish_course_with_lessons(client, hdr, n_lessons=1)

    resp = await client.post(f"/v1/lessons/{lesson_ids[0]}/audio")
    assert resp.status_code == 404


async def test_unenrolled_viewer_forbidden_on_paid_course(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998907778899")
    course = await client.post(
        "/v1/courses",
        headers=hdr,
        json={"title": "Pullik kurs", "description": "...", "ladder_step": 1, "is_free": False},
    )
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    lesson = await client.post(
        f"/v1/modules/{module.json()['id']}/lessons",
        headers=hdr,
        json={"title": "Dars 1", "sort": 0},
    )
    lesson_id = lesson.json()["id"]
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    await _set_transcript(db, lesson_id, "Maxfiy dars matni.")

    stranger = await register_and_verify(client, phone="+998901112233")
    shdr = auth_header(stranger["access_token"])

    resp = await client.post(f"/v1/lessons/{lesson_id}/audio", headers=shdr)
    assert resp.status_code == 403
