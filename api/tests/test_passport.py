"""Skills Passport testlari — username, portfolio, submission review, maxfiylik."""

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


async def _publish_course_with_assignment(
    client: httpx.AsyncClient, hdr: dict[str, str]
) -> tuple[int, int]:
    """Kurs + modul + topshiriq yaratadi va publish qiladi. (course_id, assignment_id) qaytaradi."""
    course = await client.post("/v1/courses", headers=hdr, json={"title": "Grafik dizayn asoslari"})
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]
    assignment = await client.post(
        f"/v1/modules/{module_id}/assignments",
        headers=hdr,
        json={"title": "Logotip yasang"},
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    return course_id, assignment.json()["id"]


# --- Username ---
async def test_username_auto_generated_at_registration(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, full_name="Dilnoza Karimova")
    me = (await client.get("/v1/users/me", headers=auth_header(tokens["access_token"]))).json()
    assert me["username"].startswith("dilnoza_karimova_")
    assert me["passport_visibility"] == "unlisted"


async def test_username_update_and_conflict(client: httpx.AsyncClient) -> None:
    t1 = await register_and_verify(client, phone="+998901112233")
    t2 = await register_and_verify(client, phone="+998907778899")
    h1 = auth_header(t1["access_token"])
    h2 = auth_header(t2["access_token"])

    ok = await client.patch(
        "/v1/users/me/username", headers=h1, json={"username": "birinchi_foydalanuvchi"}
    )
    assert ok.status_code == 200
    assert ok.json()["username"] == "birinchi_foydalanuvchi"

    conflict = await client.patch(
        "/v1/users/me/username", headers=h2, json={"username": "birinchi_foydalanuvchi"}
    )
    assert conflict.status_code == 409

    invalid = await client.patch("/v1/users/me/username", headers=h1, json={"username": "AB"})
    assert invalid.status_code == 422


# --- Portfolio ---
async def test_portfolio_create_list_delete(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    hdr = auth_header(tokens["access_token"])

    create = await client.post(
        "/v1/me/portfolio",
        headers=hdr,
        data={"title": "Birinchi loyiham", "description": "Tikuvchilik namunasi"},
        files={"files": ("namuna.txt", b"hello world", "text/plain")},
    )
    assert create.status_code == 201, create.text
    item = create.json()
    assert item["title"] == "Birinchi loyiham"
    assert item["source_type"] == "manual"
    assert len(item["media_urls"]) == 1

    listing = (await client.get("/v1/me/portfolio", headers=hdr)).json()
    assert len(listing) == 1

    delete = await client.delete(f"/v1/me/portfolio/{item['id']}", headers=hdr)
    assert delete.status_code == 204
    assert (await client.get("/v1/me/portfolio", headers=hdr)).json() == []


async def test_portfolio_update_case_story_fields(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    hdr = auth_header(tokens["access_token"])
    create = await client.post(
        "/v1/me/portfolio", headers=hdr, data={"title": "Mijozga sayt", "description": ""}
    )
    item_id = create.json()["id"]
    assert create.json()["task"] == ""
    assert create.json()["skills"] == []

    update = await client.patch(
        f"/v1/me/portfolio/{item_id}",
        headers=hdr,
        json={
            "task": "Kichik do'kon uchun onlayn-do'kon yaratish",
            "result": "Savdo 20% oshdi",
            "client_feedback": "Juda mamnunmiz!",
            "skills": ["Figma", "React"],
        },
    )
    assert update.status_code == 200, update.text
    body = update.json()
    assert body["task"] == "Kichik do'kon uchun onlayn-do'kon yaratish"
    assert body["result"] == "Savdo 20% oshdi"
    assert body["client_feedback"] == "Juda mamnunmiz!"
    assert body["skills"] == ["Figma", "React"]
    assert body["title"] == "Mijozga sayt"  # tegilmagan maydon o'zgarmadi

    # Qisman yangilanish — faqat title
    partial = await client.patch(
        f"/v1/me/portfolio/{item_id}", headers=hdr, json={"title": "Yangi nom"}
    )
    assert partial.json()["title"] == "Yangi nom"
    assert partial.json()["task"] == "Kichik do'kon uchun onlayn-do'kon yaratish"  # saqlanib qoldi


async def test_portfolio_update_by_non_owner_fails(client: httpx.AsyncClient) -> None:
    owner = await register_and_verify(client, phone="+998901112233")
    other = await register_and_verify(client, phone="+998907778899")
    create = await client.post(
        "/v1/me/portfolio",
        headers=auth_header(owner["access_token"]),
        data={"title": "Ishim", "description": ""},
    )
    item_id = create.json()["id"]

    resp = await client.patch(
        f"/v1/me/portfolio/{item_id}",
        headers=auth_header(other["access_token"]),
        json={"task": "Boshqa birov yozmoqchi"},
    )
    assert resp.status_code == 404


async def test_portfolio_step_add_and_delete(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    hdr = auth_header(tokens["access_token"])
    create = await client.post(
        "/v1/me/portfolio", headers=hdr, data={"title": "Loyiha", "description": ""}
    )
    item_id = create.json()["id"]

    step1 = await client.post(
        f"/v1/me/portfolio/{item_id}/steps",
        headers=hdr,
        data={"caption": "Boshlang'ich eskiz"},
        files={"file": ("eskiz.png", b"fake png", "image/png")},
    )
    assert step1.status_code == 201, step1.text
    assert step1.json()["caption"] == "Boshlang'ich eskiz"
    assert step1.json()["sort"] == 0

    step2 = await client.post(
        f"/v1/me/portfolio/{item_id}/steps",
        headers=hdr,
        data={"caption": "Yakuniy versiya"},
        files={"file": ("yakuniy.png", b"fake png 2", "image/png")},
    )
    assert step2.json()["sort"] == 1

    item = (await client.get("/v1/me/portfolio", headers=hdr)).json()[0]
    assert len(item["steps"]) == 2
    assert item["steps"][0]["caption"] == "Boshlang'ich eskiz"

    delete = await client.delete(f"/v1/me/portfolio/steps/{step1.json()['id']}", headers=hdr)
    assert delete.status_code == 204
    item_after = (await client.get("/v1/me/portfolio", headers=hdr)).json()[0]
    assert len(item_after["steps"]) == 1


async def test_portfolio_step_delete_by_non_owner_fails(client: httpx.AsyncClient) -> None:
    owner = await register_and_verify(client, phone="+998901112233")
    other = await register_and_verify(client, phone="+998907778899")
    owner_hdr = auth_header(owner["access_token"])
    create = await client.post(
        "/v1/me/portfolio", headers=owner_hdr, data={"title": "Ishim", "description": ""}
    )
    item_id = create.json()["id"]
    step = await client.post(
        f"/v1/me/portfolio/{item_id}/steps",
        headers=owner_hdr,
        data={"caption": "Bosqich"},
        files={"file": ("f.png", b"data", "image/png")},
    )
    step_id = step.json()["id"]

    resp = await client.delete(
        f"/v1/me/portfolio/steps/{step_id}", headers=auth_header(other["access_token"])
    )
    assert resp.status_code == 404


async def test_portfolio_delete_by_non_owner_fails(client: httpx.AsyncClient) -> None:
    owner = await register_and_verify(client, phone="+998901112233")
    other = await register_and_verify(client, phone="+998907778899")
    owner_hdr = auth_header(owner["access_token"])
    other_hdr = auth_header(other["access_token"])

    create = await client.post(
        "/v1/me/portfolio", headers=owner_hdr, data={"title": "Mening ishim", "description": ""}
    )
    item_id = create.json()["id"]

    resp = await client.delete(f"/v1/me/portfolio/{item_id}", headers=other_hdr)
    assert resp.status_code == 404


# --- Submission review + avtomatik portfolio ---
async def test_approved_submission_becomes_portfolio_item(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    instructor_hdr = await _make_instructor(client, db, "+998907778899")
    course_id, assignment_id = await _publish_course_with_assignment(client, instructor_hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    learner_hdr = auth_header(learner["access_token"])

    submit = await client.post(
        "/v1/submissions",
        headers=learner_hdr,
        data={"assignment_id": assignment_id, "text": "Mana mening logotipim"},
    )
    assert submit.status_code == 201
    submission_id = submit.json()["id"]

    review = await client.post(
        f"/v1/submissions/{submission_id}/review",
        headers=instructor_hdr,
        json={"approve": True, "feedback": "Ajoyib ish!"},
    )
    assert review.status_code == 200
    assert review.json()["status"] == "approved"
    assert review.json()["feedback"] == "Ajoyib ish!"

    portfolio = (await client.get("/v1/me/portfolio", headers=learner_hdr)).json()
    assert len(portfolio) == 1
    assert portfolio[0]["source_type"] == "submission"

    me = (await client.get("/v1/users/me", headers=learner_hdr)).json()
    gallery = await client.get(f"/v1/courses/{course_id}/gallery")
    assert gallery.status_code == 200, gallery.text
    assert len(gallery.json()) == 1
    assert gallery.json()[0]["student_username"] == me["username"]
    assert gallery.json()[0]["title"] == portfolio[0]["title"]


async def test_gallery_hides_private_passport_students(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    instructor_hdr = await _make_instructor(client, db, "+998907778800")
    course_id, assignment_id = await _publish_course_with_assignment(client, instructor_hdr)

    learner = await register_and_verify(client, phone="+998901112244")
    learner_hdr = auth_header(learner["access_token"])
    await client.patch(
        "/v1/users/me", headers=learner_hdr, json={"passport_visibility": "private"}
    )

    submit = await client.post(
        "/v1/submissions",
        headers=learner_hdr,
        data={"assignment_id": assignment_id, "text": "Mening ishim"},
    )
    submission_id = submit.json()["id"]
    await client.post(
        f"/v1/submissions/{submission_id}/review",
        headers=instructor_hdr,
        json={"approve": True, "feedback": "Yaxshi"},
    )

    gallery = await client.get(f"/v1/courses/{course_id}/gallery")
    assert gallery.status_code == 200
    assert gallery.json() == []


async def test_my_submissions_scoped_to_course_and_user(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    instructor_hdr = await _make_instructor(client, db, "+998907779911")
    course_id, assignment_id = await _publish_course_with_assignment(client, instructor_hdr)

    learner = await register_and_verify(client, phone="+998901113344")
    learner_hdr = auth_header(learner["access_token"])
    await client.post(
        "/v1/submissions",
        headers=learner_hdr,
        data={"assignment_id": assignment_id, "text": "Ishim"},
    )

    mine = await client.get(f"/v1/courses/{course_id}/my-submissions", headers=learner_hdr)
    assert mine.status_code == 200
    assert len(mine.json()) == 1
    assert mine.json()[0]["assignment_id"] == assignment_id

    other = await register_and_verify(client, phone="+998901114455")
    other_mine = await client.get(
        f"/v1/courses/{course_id}/my-submissions", headers=auth_header(other["access_token"])
    )
    assert other_mine.json() == []


async def test_rejected_submission_not_added_to_portfolio(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    instructor_hdr = await _make_instructor(client, db, "+998907778899")
    _, assignment_id = await _publish_course_with_assignment(client, instructor_hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    learner_hdr = auth_header(learner["access_token"])
    submit = await client.post(
        "/v1/submissions", headers=learner_hdr, data={"assignment_id": assignment_id, "text": "..."}
    )
    submission_id = submit.json()["id"]

    review = await client.post(
        f"/v1/submissions/{submission_id}/review",
        headers=instructor_hdr,
        json={"approve": False, "feedback": "Qayta ishlang"},
    )
    assert review.json()["status"] == "rejected"
    assert (await client.get("/v1/me/portfolio", headers=learner_hdr)).json() == []


async def test_other_instructor_cannot_review_foreign_submission(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    owner_hdr = await _make_instructor(client, db, "+998907778899")
    _, assignment_id = await _publish_course_with_assignment(client, owner_hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    submit = await client.post(
        "/v1/submissions",
        headers=auth_header(learner["access_token"]),
        data={"assignment_id": assignment_id, "text": "..."},
    )
    submission_id = submit.json()["id"]

    stranger_hdr = await _make_instructor(client, db, "+998905556677")
    resp = await client.post(
        f"/v1/submissions/{submission_id}/review",
        headers=stranger_hdr,
        json={"approve": True},
    )
    assert resp.status_code == 403


# --- Public passport maxfiyligi ---
async def test_public_passport_unlisted_accessible_by_link(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, full_name="Ochiq Foydalanuvchi")
    me = (await client.get("/v1/users/me", headers=auth_header(tokens["access_token"]))).json()

    # Anonim (token'siz) — unlisted (default) baribir ko'rinadi, faqat havola bilan
    resp = await client.get(f"/v1/passport/{me['username']}")
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Ochiq Foydalanuvchi"


async def test_public_passport_private_hidden_from_others(client: httpx.AsyncClient) -> None:
    owner = await register_and_verify(client, phone="+998901112233", full_name="Maxfiy Inson")
    owner_hdr = auth_header(owner["access_token"])
    me = (await client.get("/v1/users/me", headers=owner_hdr)).json()

    set_private = await client.patch(
        "/v1/users/me", headers=owner_hdr, json={"passport_visibility": "private"}
    )
    assert set_private.status_code == 200

    # Anonim — 404
    anon = await client.get(f"/v1/passport/{me['username']}")
    assert anon.status_code == 404

    # Boshqa foydalanuvchi — 404
    stranger = await register_and_verify(client, phone="+998907778899")
    stranger_resp = await client.get(
        f"/v1/passport/{me['username']}", headers=auth_header(stranger["access_token"])
    )
    assert stranger_resp.status_code == 404

    # Egasining o'zi — ko'radi
    owner_resp = await client.get(f"/v1/passport/{me['username']}", headers=owner_hdr)
    assert owner_resp.status_code == 200
    assert owner_resp.json()["full_name"] == "Maxfiy Inson"


async def test_public_passport_not_found(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/passport/yoq_boladigan_foydalanuvchi")
    assert resp.status_code == 404
