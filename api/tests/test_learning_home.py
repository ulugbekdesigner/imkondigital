"""'Mening yo'lim' — o'quvchi bosh sahifasi agregatsiyasi (V2-3/B2)."""

from datetime import UTC, datetime

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import SkillsAssessment
from app.models.enums import AssessmentVerdict, RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_instructor(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    return auth_header(tokens["access_token"])


async def test_learning_home_includes_trajectory(client: httpx.AsyncClient) -> None:
    learner = await register_and_verify(client, phone="+998923001100")
    lhdr = auth_header(learner["access_token"])
    resp = await client.get("/v1/me/learning-home", headers=lhdr)
    assert resp.status_code == 200
    body = resp.json()
    assert body["trajectory"]["current_step"] >= 1
    assert body["active_enrollments"] == []
    assert body["next_lesson"] is None
    assert body["latest_mentor_note"] is None
    assert body["recent_assessment_results"] == []


async def test_learning_home_active_enrollment_and_next_lesson(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998923002200")
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Fotografiya"})
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]
    lesson1 = await client.post(
        f"/v1/modules/{module_id}/lessons", headers=hdr, json={"title": "Dars 1", "sort": 0}
    )
    lesson2 = await client.post(
        f"/v1/modules/{module_id}/lessons", headers=hdr, json={"title": "Dars 2", "sort": 1}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)

    learner = await register_and_verify(client, phone="+998923003300")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson1.json()['id']}/complete", headers=lhdr)

    home = (await client.get("/v1/me/learning-home", headers=lhdr)).json()
    assert len(home["active_enrollments"]) == 1
    assert home["active_enrollments"][0]["progress_pct"] == 50
    assert home["next_lesson"]["lesson_id"] == lesson2.json()["id"]


async def test_learning_home_shows_latest_mentor_note(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_tokens = await register_and_verify(client, phone="+998923004400")
    await grant_role(db, "+998923004400", RoleCode.MENTOR)
    mentor_hdr = auth_header(mentor_tokens["access_token"])

    mentee = await register_and_verify(client, phone="+998923005500")
    mhdr = auth_header(mentee["access_token"])

    mentors = (await client.get("/v1/mentors", headers=mhdr)).json()
    mentor_id = next(m["id"] for m in mentors if m["full_name"] == "Test Foydalanuvchi")
    req = await client.post("/v1/mentorships", headers=mhdr, json={"mentor_id": mentor_id})
    mentorship_id = req.json()["id"]
    await client.post(
        f"/v1/mentorships/{mentorship_id}/respond", headers=mentor_hdr, json={"accept": True}
    )
    await client.post(
        f"/v1/mentorships/{mentorship_id}/checkins",
        headers=mentor_hdr,
        json={"note": "Yaxshi davom etyapsiz, davom eting!"},
    )

    home = (await client.get("/v1/me/learning-home", headers=mhdr)).json()
    assert home["latest_mentor_note"]["note"] == "Yaxshi davom etyapsiz, davom eting!"
    assert home["latest_mentor_note"]["mentor_name"] == "Test Foydalanuvchi"


async def test_learning_home_shows_recent_confirmed_assessment(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998923006600")
    course = await client.post("/v1/courses", headers=hdr, json={"title": "3D Modellashtirish"})
    course_id = course.json()["id"]

    learner = await register_and_verify(client, phone="+998923007700")
    lhdr = auth_header(learner["access_token"])
    me = await client.get("/v1/users/me", headers=lhdr)
    user_id = me.json()["id"]

    db.add(
        SkillsAssessment(
            user_id=user_id,
            course_id=course_id,
            ai_score_pct=88,
            ai_readiness_pct=80,
            ai_feedback="Yaxshi",
            ai_verdict=AssessmentVerdict.READY,
            mentor_verdict=AssessmentVerdict.READY,
            mentor_feedback="Tasdiqlayman",
            confirmed_at=datetime.now(UTC),
        )
    )
    await db.commit()

    home = (await client.get("/v1/me/learning-home", headers=lhdr)).json()
    assert len(home["recent_assessment_results"]) == 1
    assert home["recent_assessment_results"][0]["course_title"] == "3D Modellashtirish"
    assert home["recent_assessment_results"][0]["verdict"] == "ready"
