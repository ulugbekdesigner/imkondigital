"""15 bosqichli Trayektoriya — real, mustaqil signallardan hisoblash.

test_disability.py::test_moderation_verify_updates_trajectory allaqachon
3/4-bosqich (nogironlik tasdig'i / ish sharoiti) o'tishini tekshiradi.
Bu fayl qolgan signallarni (kurs, sertifikat, ustoz roli) va CHIZIQLI
BO'LMAGAN done holatini (masalan 15-bosqich 6-14 tugallanmasdan ham "done"
bo'lib ko'rinishi) qamrab oladi.
"""

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
    course = await client.post(
        "/v1/courses",
        headers=hdr,
        json={"title": "Raqamli savodxonlik", "description": "Boshlang'ich kurs"},
    )
    assert course.status_code == 201, course.text
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    lesson = await client.post(
        f"/v1/modules/{module.json()['id']}/lessons",
        headers=hdr,
        json={"title": "1-dars", "sort": 0},
    )
    assert lesson.status_code == 201
    pub = await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    assert pub.status_code == 200
    return course_id


async def test_fresh_user_only_step_one_done(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998901112233")
    hdr = auth_header(tokens["access_token"])

    traj = (await client.get("/v1/users/me/trajectory", headers=hdr)).json()
    by_number = {s["number"]: s["status"] for s in traj["steps"]}
    assert by_number[1] == "done"  # profil yaratilgan
    assert by_number[2] == "done"  # telefon tasdiqlangan (register_and_verify)
    assert by_number[3] == "current"  # nogironlik maqomi hali tasdiqlanmagan
    assert traj["current_step"] == 3
    assert all(by_number[n] == "locked" for n in range(4, 16))


async def test_enrollment_marks_step_six_done_independently(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    instructor_hdr = await _make_instructor(client, db, "+998907778899")
    course_id = await _publish_course(client, instructor_hdr)

    learner_tokens = await register_and_verify(client, phone="+998901112233")
    learner_hdr = auth_header(learner_tokens["access_token"])
    enroll = await client.post(
        "/v1/enrollments", headers=learner_hdr, data={"course_id": course_id}
    )
    assert enroll.status_code == 201

    traj = (await client.get("/v1/users/me/trajectory", headers=learner_hdr)).json()
    by_number = {s["number"]: s["status"] for s in traj["steps"]}
    # 6-bosqich (kurslarga yozilish) bajarilgan, lekin 3/4/5 hali yo'q —
    # "current" baribir eng kichik bajarilmagan (3) bo'lib qoladi.
    assert by_number[6] == "done"
    assert by_number[3] == "current"
    assert traj["current_step"] == 3


async def test_instructor_role_marks_step_fifteen_done_out_of_order(
    client: httpx.AsyncClient,
) -> None:
    tokens = await register_and_verify(client, phone="+998901112233")
    hdr = auth_header(tokens["access_token"])

    become = await client.post("/v1/users/me/become-instructor", headers=hdr)
    assert become.status_code == 200

    traj = (await client.get("/v1/users/me/trajectory", headers=hdr)).json()
    by_number = {s["number"]: s["status"] for s in traj["steps"]}
    # 15-bosqich (mentor darajasi) 6-14 tugallanmasdan ham "done" —
    # bosqichlar chiziqli talab qilinmaydi, har biri mustaqil haqiqiy signal.
    assert by_number[15] == "done"
    assert by_number[14] == "locked"  # "Biznes boshlash" — real signal yo'q, doim locked
    assert traj["current_step"] == 3
