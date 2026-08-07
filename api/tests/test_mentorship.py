"""Ustoz (Mentor) kabineti — so'rov, qabul/rad, check-in, RBAC."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Enrollment
from app.models.enums import EnrollmentStatus, RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_mentor(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone, full_name="Ustoz Aziz")
    await grant_role(db, phone, RoleCode.MENTOR)
    return auth_header(tokens["access_token"])


async def test_list_mentors_returns_only_mentor_role(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    await _make_mentor(client, db, "+998916001100")
    await register_and_verify(client, phone="+998916002200")  # oddiy foydalanuvchi

    mentors = (await client.get("/v1/mentors")).json()
    assert len(mentors) == 1
    assert mentors[0]["full_name"] == "Ustoz Aziz"


async def test_request_mentorship_notifies_mentor(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916003300")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]

    mentee_tokens = await register_and_verify(client, phone="+998916004400")
    mentee_hdr = auth_header(mentee_tokens["access_token"])

    resp = await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "pending"

    notifs = (await client.get("/v1/me/notifications", headers=mentor_hdr)).json()
    assert any(n["type"] == "mentorship" for n in notifs["items"])


async def test_cannot_request_from_non_mentor(client: httpx.AsyncClient) -> None:
    mentee_tokens = await register_and_verify(client, phone="+998916005500")
    mentee_hdr = auth_header(mentee_tokens["access_token"])
    other_tokens = await register_and_verify(client, phone="+998916006600")
    other_id = (
        await client.get("/v1/users/me", headers=auth_header(other_tokens["access_token"]))
    ).json()["id"]

    resp = await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": other_id})
    assert resp.status_code == 404


async def test_cannot_request_same_mentor_twice(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916007700")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916008800")
    mentee_hdr = auth_header(mentee_tokens["access_token"])

    await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    second = await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    assert second.status_code == 409


async def test_respond_accept_activates_and_notifies_mentee(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916009900")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916010101")
    mentee_hdr = auth_header(mentee_tokens["access_token"])

    request = (
        await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    ).json()

    resp = await client.post(
        f"/v1/mentorships/{request['id']}/respond", headers=mentor_hdr, json={"accept": True}
    )
    assert resp.json()["status"] == "active"

    notifs = (await client.get("/v1/me/notifications", headers=mentee_hdr)).json()
    assert any("qabul qildi" in n["title"] for n in notifs["items"])


async def test_respond_decline(client: httpx.AsyncClient, db: AsyncSession) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916011111")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916012121")
    mentee_hdr = auth_header(mentee_tokens["access_token"])

    request = (
        await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    ).json()
    resp = await client.post(
        f"/v1/mentorships/{request['id']}/respond", headers=mentor_hdr, json={"accept": False}
    )
    assert resp.json()["status"] == "declined"


async def test_non_owner_cannot_respond(client: httpx.AsyncClient, db: AsyncSession) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916013131")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916014141")
    mentee_hdr = auth_header(mentee_tokens["access_token"])
    request = (
        await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    ).json()

    stranger_tokens = await register_and_verify(client, phone="+998916015151")
    stranger_hdr = auth_header(stranger_tokens["access_token"])
    resp = await client.post(
        f"/v1/mentorships/{request['id']}/respond", headers=stranger_hdr, json={"accept": True}
    )
    assert resp.status_code == 404


async def test_checkin_requires_active_mentorship(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916016161")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916017171")
    mentee_hdr = auth_header(mentee_tokens["access_token"])
    request = (
        await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    ).json()

    # hali qabul qilinmagan (pending) — check-in rad etiladi
    pending_checkin = await client.post(
        f"/v1/mentorships/{request['id']}/checkins", headers=mentor_hdr, json={"note": "Salom"}
    )
    assert pending_checkin.status_code == 409

    await client.post(
        f"/v1/mentorships/{request['id']}/respond", headers=mentor_hdr, json={"accept": True}
    )
    checkin = await client.post(
        f"/v1/mentorships/{request['id']}/checkins",
        headers=mentor_hdr,
        json={"note": "Birinchi uchrashuv yaxshi o'tdi"},
    )
    assert checkin.status_code == 201

    notifs = (await client.get("/v1/me/notifications", headers=mentee_hdr)).json()
    assert any("check-in" in n["title"] for n in notifs["items"])


async def test_mentorship_detail_includes_checkins_and_is_party_scoped(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916018181")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916019191")
    mentee_hdr = auth_header(mentee_tokens["access_token"])
    request = (
        await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    ).json()
    await client.post(
        f"/v1/mentorships/{request['id']}/respond", headers=mentor_hdr, json={"accept": True}
    )
    await client.post(
        f"/v1/mentorships/{request['id']}/checkins", headers=mentor_hdr, json={"note": "Yaxshi"}
    )

    detail = await client.get(f"/v1/mentorships/{request['id']}", headers=mentee_hdr)
    assert detail.status_code == 200
    assert len(detail.json()["checkins"]) == 1

    stranger_tokens = await register_and_verify(client, phone="+998916020202")
    stranger_hdr = auth_header(stranger_tokens["access_token"])
    forbidden = await client.get(f"/v1/mentorships/{request['id']}", headers=stranger_hdr)
    assert forbidden.status_code == 403


async def test_request_message_visible_to_mentor(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916023232")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916024242")
    mentee_hdr = auth_header(mentee_tokens["access_token"])

    resp = await client.post(
        "/v1/mentorships",
        headers=mentee_hdr,
        json={
            "mentor_id": mentor_id,
            "message": "Portfolio tayyorlashda va suhbatga tayyorgarlikda yordam kerak.",
        },
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["message"] == (
        "Portfolio tayyorlashda va suhbatga tayyorgarlikda yordam kerak."
    )

    mentor_view = (await client.get("/v1/me/mentorships", headers=mentor_hdr)).json()
    assert mentor_view[0]["message"] == (
        "Portfolio tayyorlashda va suhbatga tayyorgarlikda yordam kerak."
    )


async def test_request_without_message_is_none(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916025252")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916026262")
    mentee_hdr = auth_header(mentee_tokens["access_token"])

    resp = await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    assert resp.json()["message"] is None


async def test_mentee_ladder_step_reflects_completed_course(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916027272")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]

    instr_tokens = await register_and_verify(client, phone="+998916028282")
    instr_hdr = auth_header(instr_tokens["access_token"])
    await grant_role(db, "+998916028282", RoleCode.INSTRUCTOR)
    course = await client.post(
        "/v1/courses", headers=instr_hdr, json={"title": "Frontend asoslari", "ladder_step": 3}
    )
    course_id = course.json()["id"]
    await client.post(
        f"/v1/courses/{course_id}/modules", headers=instr_hdr, json={"title": "1-modul"}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=instr_hdr)

    mentee_tokens = await register_and_verify(client, phone="+998916029292")
    mentee_hdr = auth_header(mentee_tokens["access_token"])
    mentee_id = (await client.get("/v1/users/me", headers=mentee_hdr)).json()["id"]
    await client.post("/v1/enrollments", headers=mentee_hdr, data={"course_id": course_id})
    enrollment = (
        await db.execute(select(Enrollment).where(Enrollment.user_id == mentee_id))
    ).scalar_one()
    enrollment.status = EnrollmentStatus.COMPLETED
    await db.commit()

    resp = await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})
    assert resp.json()["mentee_ladder_step"] == 3


async def test_my_mentorships_lists_both_roles(client: httpx.AsyncClient, db: AsyncSession) -> None:
    mentor_hdr = await _make_mentor(client, db, "+998916021212")
    mentor_id = (await client.get("/v1/users/me", headers=mentor_hdr)).json()["id"]
    mentee_tokens = await register_and_verify(client, phone="+998916022222")
    mentee_hdr = auth_header(mentee_tokens["access_token"])
    await client.post("/v1/mentorships", headers=mentee_hdr, json={"mentor_id": mentor_id})

    mentor_view = (await client.get("/v1/me/mentorships", headers=mentor_hdr)).json()
    mentee_view = (await client.get("/v1/me/mentorships", headers=mentee_hdr)).json()
    assert len(mentor_view) == 1
    assert len(mentee_view) == 1
