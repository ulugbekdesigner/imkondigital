"""HLS AES-128 kalit yetkazish va haqiqiy kirish huquqi tekshiruvi (V2-5/C1)."""

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


async def _create_lesson_with_key(
    client: httpx.AsyncClient,
    db: AsyncSession,
    hdr: dict[str, str],
    *,
    is_free: bool,
) -> tuple[int, int]:
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

    row = await db.get(Lesson, lesson_id)
    assert row is not None
    row.hls_key_hex = "00112233445566778899aabbccddeeff"[:32]
    await db.commit()
    return course_id, lesson_id


async def test_hls_key_requires_no_auth_for_free_course(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998926001100")
    _, lesson_id = await _create_lesson_with_key(client, db, hdr, is_free=True)

    resp = await client.get(f"/v1/lessons/{lesson_id}/hls-key")
    assert resp.status_code == 200
    assert len(resp.content) == 16
    assert resp.headers["content-type"] == "application/octet-stream"


async def test_hls_key_denied_for_paid_course_without_enrollment(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998926002200")
    _, lesson_id = await _create_lesson_with_key(client, db, hdr, is_free=False)

    anon = await client.get(f"/v1/lessons/{lesson_id}/hls-key")
    assert anon.status_code == 403

    learner = await register_and_verify(client, phone="+998926003300")
    lhdr = auth_header(learner["access_token"])
    logged_in_not_enrolled = await client.get(f"/v1/lessons/{lesson_id}/hls-key", headers=lhdr)
    assert logged_in_not_enrolled.status_code == 403


async def test_hls_key_allowed_for_paid_course_after_enrollment(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998926004400")
    course_id, lesson_id = await _create_lesson_with_key(client, db, hdr, is_free=False)

    learner = await register_and_verify(client, phone="+998926005500")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    resp = await client.get(f"/v1/lessons/{lesson_id}/hls-key", headers=lhdr)
    assert resp.status_code == 200
    assert len(resp.content) == 16


async def test_hls_key_404_when_lesson_has_no_key(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998926006600")
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Kurs 2"})
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    lesson = await client.post(
        f"/v1/modules/{module.json()['id']}/lessons", headers=hdr, json={"title": "Dars"}
    )
    resp = await client.get(f"/v1/lessons/{lesson.json()['id']}/hls-key")
    assert resp.status_code == 404


async def test_paid_course_video_hidden_from_anonymous_and_non_enrolled(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998926007700")
    course_id, lesson_id = await _create_lesson_with_key(client, db, hdr, is_free=False)
    # hls_url hali transcode qilinmagani uchun None, lekin `reveal` mantig'ini
    # `subtitle_url`/`transcript` maydonlari orqali ham tekshiramiz — ular ham
    # faqat `reveal_hls=True` bo'lsa ko'rsatiladi.
    row = await db.get(Lesson, lesson_id)
    assert row is not None
    row.hls_url = "http://example.com/master.m3u8"
    row.transcript = "Maxfiy transkript matni"
    await db.commit()

    slug_resp = await client.get(f"/v1/courses/by-id/{course_id}", headers=hdr)
    slug = slug_resp.json()["slug"]

    anon = await client.get(f"/v1/courses/{slug}")
    lesson_out = anon.json()["modules"][0]["lessons"][0]
    assert lesson_out["hls_url"] is None
    assert lesson_out["transcript"] is None

    learner = await register_and_verify(client, phone="+998926008800")
    lhdr = auth_header(learner["access_token"])
    not_enrolled = await client.get(f"/v1/courses/{slug}", headers=lhdr)
    assert not_enrolled.json()["modules"][0]["lessons"][0]["hls_url"] is None

    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    enrolled = await client.get(f"/v1/courses/{slug}", headers=lhdr)
    assert enrolled.json()["modules"][0]["lessons"][0]["hls_url"] == "http://example.com/master.m3u8"
    assert enrolled.json()["modules"][0]["lessons"][0]["transcript"] == "Maxfiy transkript matni"
