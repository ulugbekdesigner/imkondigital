"""Global qidiruv — KENGAYISH_PLAN_3.md 8-bo'lim."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _instructor_headers(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    return auth_header(tokens["access_token"])


async def _create_course(
    client: httpx.AsyncClient, hdr: dict[str, str], *, title: str, is_free: bool
) -> tuple[int, int]:
    course = await client.post(
        "/v1/courses", headers=hdr, json={"title": title, "is_free": is_free}
    )
    assert course.status_code == 201, course.text
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]
    lesson = await client.post(
        f"/v1/modules/{module_id}/lessons", headers=hdr, json={"title": "Dars 1", "sort": 0}
    )
    lesson_id = lesson.json()["id"]
    material = await client.post(
        f"/v1/lessons/{lesson_id}/materials",
        headers=hdr,
        data={"title": "Amaliy shablon.xlsx"},
        files={"file": ("shablon.xlsx", b"fake xlsx content", "application/octet-stream")},
    )
    assert material.status_code == 201, material.text
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    return course_id, lesson_id


async def _moderator_headers(client: httpx.AsyncClient, db: AsyncSession) -> dict[str, str]:
    await register_and_verify(client, phone="+998912221199", full_name="Moderator")
    await grant_role(db, "+998912221199", RoleCode.MODERATOR)
    login = await client.post(
        "/v1/auth/login", json={"phone": "+998912221199", "password": "parol12345"}
    )
    return auth_header(login.json()["access_token"])


async def test_query_too_short_is_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/search", params={"q": "a"})
    assert resp.status_code == 422


async def test_search_finds_published_course_by_partial_title(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _instructor_headers(client, db, "+998917001100")
    await _create_course(client, hdr, title="Excel bo'yicha chuqurlashtirilgan kurs", is_free=True)

    resp = await client.get("/v1/search", params={"q": "Excel"})
    assert resp.status_code == 200, resp.text
    titles = [c["title"] for c in resp.json()["courses"]]
    assert any("Excel" in t for t in titles)


async def test_search_excludes_draft_course(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _instructor_headers(client, db, "+998917001101")
    course = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Qoralama SMM kursi"}
    )
    assert course.status_code == 201

    resp = await client.get("/v1/search", params={"q": "Qoralama"})
    assert resp.json()["courses"] == []


async def test_search_finds_published_vacancy_with_company_name(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998917001102")
    hdr = auth_header(tokens["access_token"])
    await grant_role(db, "+998917001102", RoleCode.EMPLOYER)
    company = await client.post(
        "/v1/companies", headers=hdr, json={"name": "Ozod IT", "employee_count": 10}
    )
    company_id = company.json()["id"]
    vacancy = await client.post(
        f"/v1/companies/{company_id}/vacancies",
        headers=hdr,
        json={"title": "Frontend dasturchi (masofaviy)", "ladder_step": 3},
    )
    vacancy_id = vacancy.json()["id"]
    await client.post(f"/v1/vacancies/{vacancy_id}/publish", headers=hdr)

    resp = await client.get("/v1/search", params={"q": "Frontend"})
    hits = resp.json()["vacancies"]
    assert any(v["id"] == vacancy_id and v["company_name"] == "Ozod IT" for v in hits)


async def test_search_finds_published_benefit(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit = await client.post(
        "/v1/benefits",
        headers=mod_hdr,
        json={
            "title": "Nogironlar uchun transport subsidiyasi",
            "category": "transport",
            "audience": "user",
        },
    )
    benefit_id = benefit.json()["id"]
    await client.post(f"/v1/benefits/{benefit_id}/publish", headers=mod_hdr)

    resp = await client.get("/v1/search", params={"q": "transport"})
    hits = resp.json()["benefits"]
    assert any(b["id"] == benefit_id for b in hits)


async def test_guest_sees_materials_only_from_free_courses(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _instructor_headers(client, db, "+998917001103")
    await _create_course(client, hdr, title="Bepul kurs", is_free=True)
    await _create_course(client, hdr, title="Pullik kurs", is_free=False)

    resp = await client.get("/v1/search", params={"q": "shablon"})
    materials = resp.json()["materials"]
    assert len(materials) == 1
    assert materials[0]["course_title"] == "Bepul kurs"


async def test_enrolled_user_sees_material_from_paid_course(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _instructor_headers(client, db, "+998917001104")
    course_id, _lesson_id = await _create_course(
        client, hdr, title="Pullik dizayn kursi", is_free=False
    )

    learner_tokens = await register_and_verify(client, phone="+998917001105")
    lhdr = auth_header(learner_tokens["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})

    resp = await client.get("/v1/search", params={"q": "shablon"}, headers=lhdr)
    materials = resp.json()["materials"]
    assert any(m["course_title"] == "Pullik dizayn kursi" for m in materials)

    guest_resp = await client.get("/v1/search", params={"q": "shablon"})
    assert guest_resp.json()["materials"] == []
