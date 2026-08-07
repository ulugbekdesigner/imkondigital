"""Bandlik testlari — RBAC, to'liq oqim, Match Score integratsiyasi, maxfiylik."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.certificate import Certificate
from app.models.course import Enrollment
from app.models.employer import Company
from app.models.enums import EnrollmentStatus, RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_employer(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.EMPLOYER)
    return auth_header(tokens["access_token"])


async def _create_published_vacancy(
    client: httpx.AsyncClient,
    hdr: dict[str, str],
    *,
    ladder_step: int = 1,
    work_format: str = "remote",
) -> tuple[int, int]:
    company = await client.post(
        "/v1/companies", headers=hdr, json={"name": "Alfa Telekom", "employee_count": 50}
    )
    assert company.status_code == 201, company.text
    company_id = company.json()["id"]

    vacancy = await client.post(
        f"/v1/companies/{company_id}/vacancies",
        headers=hdr,
        json={
            "title": "Call-markaz operatori",
            "ladder_step": ladder_step,
            "work_format": work_format,
        },
    )
    assert vacancy.status_code == 201, vacancy.text
    vacancy_id = vacancy.json()["id"]

    pub = await client.post(f"/v1/vacancies/{vacancy_id}/publish", headers=hdr)
    assert pub.status_code == 200
    return company_id, vacancy_id


async def test_unauthenticated_user_cannot_create_company(client: httpx.AsyncClient) -> None:
    resp = await client.post("/v1/companies", json={"name": "Test MChJ"})
    assert resp.status_code == 401


async def test_regular_user_can_self_register_company(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    hdr = auth_header(tokens["access_token"])

    resp = await client.post("/v1/companies", headers=hdr, json={"name": "Test MChJ"})
    assert resp.status_code == 201, resp.text
    company_id = resp.json()["id"]

    me = await client.get("/v1/users/me", headers=hdr)
    assert "employer" in me.json()["roles"]

    # Endi vakansiya joylashtira oladi — yangi berilgan rol darhol ishlaydi
    vacancy = await client.post(
        f"/v1/companies/{company_id}/vacancies",
        headers=hdr,
        json={"title": "Loyihaga ishchi kerak"},
    )
    assert vacancy.status_code == 201, vacancy.text


async def test_second_company_does_not_duplicate_employer_role(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778811")
    resp = await client.post("/v1/companies", headers=hdr, json={"name": "Ikkinchi kompaniya"})
    assert resp.status_code == 201, resp.text

    me = await client.get("/v1/users/me", headers=hdr)
    assert me.json()["roles"].count("employer") == 1


async def test_verified_companies_endpoint_only_lists_verified(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778822")
    company = await client.post(
        "/v1/companies", headers=hdr, json={"name": "Yashirin Ishonch MChJ"}
    )
    company_id = company.json()["id"]

    before = await client.get("/v1/companies/verified")
    assert before.status_code == 200
    assert all(c["id"] != company_id for c in before.json())

    row = await db.get(Company, company_id)
    assert row is not None
    row.verified = True
    await db.commit()

    after = await client.get("/v1/companies/verified")
    ids = [c["id"] for c in after.json()]
    assert company_id in ids


async def test_published_vacancy_appears_in_public_catalog(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr)

    catalog = await client.get("/v1/vacancies")
    assert catalog.status_code == 200
    ids = [v["id"] for v in catalog.json()["items"]]
    assert vacancy_id in ids
    # Anonim so'rovda match_score yo'q
    card = next(v for v in catalog.json()["items"] if v["id"] == vacancy_id)
    assert card["match_score"] is None


async def test_authed_catalog_includes_match_score(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr, work_format="remote")

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])

    catalog = await client.get("/v1/vacancies", headers=lhdr)
    card = next(v for v in catalog.json()["items"] if v["id"] == vacancy_id)
    assert isinstance(card["match_score"], int)
    assert 0 <= card["match_score"] <= 100


async def test_accommodations_mark_vacancy_inclusive_and_boost_match_score(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    company = await client.post("/v1/companies", headers=hdr, json={"name": "Beta MChJ"})
    company_id = company.json()["id"]

    plain = await client.post(
        f"/v1/companies/{company_id}/vacancies",
        headers=hdr,
        json={"title": "Oddiy vakansiya", "ladder_step": 3, "work_format": "office"},
    )
    inclusive = await client.post(
        f"/v1/companies/{company_id}/vacancies",
        headers=hdr,
        json={
            "title": "Inklyuziv vakansiya",
            "ladder_step": 3,
            "work_format": "office",
            "accommodations": {"flexible_schedule": True},
        },
    )
    for v in (plain, inclusive):
        await client.post(f"/v1/vacancies/{v.json()['id']}/publish", headers=hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])
    catalog = (await client.get("/v1/vacancies", headers=lhdr)).json()["items"]
    plain_card = next(v for v in catalog if v["id"] == plain.json()["id"])
    inclusive_card = next(v for v in catalog if v["id"] == inclusive.json()["id"])

    assert plain_card["is_inclusive"] is False
    assert inclusive_card["is_inclusive"] is True
    assert inclusive_card["match_score"] == plain_card["match_score"] + 5


async def test_apply_persists_match_score_and_prevents_duplicate(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(
        client, hdr, ladder_step=0, work_format="remote"
    )

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])

    apply1 = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    assert apply1.status_code == 201, apply1.text
    body = apply1.json()
    assert body["status"] == "submitted"
    assert isinstance(body["match_score"], int)

    apply2 = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    assert apply2.status_code == 409

    mine = (await client.get("/v1/me/applications", headers=lhdr)).json()
    assert len(mine) == 1
    assert mine[0]["vacancy_id"] == vacancy_id


async def test_disability_hidden_unless_shared(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=lhdr,
        json={"group_type": "2", "categories": ["eshitish"], "work_conditions": {}},
    )
    await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )

    applicants = await client.get(f"/v1/vacancies/{vacancy_id}/applicants", headers=hdr)
    assert applicants.status_code == 200
    assert applicants.json()[0]["disability"] is None


async def test_disability_visible_when_shared(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=lhdr,
        json={"group_type": "2", "categories": ["eshitish"], "work_conditions": {}},
    )
    await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": True}
    )

    applicants = (await client.get(f"/v1/vacancies/{vacancy_id}/applicants", headers=hdr)).json()
    assert applicants[0]["disability"]["group_type"] == "2"
    assert applicants[0]["disability"]["categories"] == ["eshitish"]


async def test_applicants_sorted_by_match_score_desc(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    # office, step=3 — yuqori pog'ona talab qiladi, farqli match_score beradi
    _, vacancy_id = await _create_published_vacancy(
        client, hdr, ladder_step=3, work_format="office"
    )

    weak = await register_and_verify(client, phone="+998901112233")
    strong = await register_and_verify(client, phone="+998905556677")

    await client.post(
        f"/v1/vacancies/{vacancy_id}/apply",
        headers=auth_header(weak["access_token"]),
        json={"share_disability_profile": False},
    )
    await client.post(
        f"/v1/vacancies/{vacancy_id}/apply",
        headers=auth_header(strong["access_token"]),
        json={"share_disability_profile": False},
    )

    applicants = (await client.get(f"/v1/vacancies/{vacancy_id}/applicants", headers=hdr)).json()
    assert len(applicants) == 2
    assert applicants[0]["match_score"] >= applicants[1]["match_score"]


async def test_foreign_employer_cannot_view_applicants(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    owner_hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, owner_hdr)

    stranger_hdr = await _make_employer(client, db, "+998905556677")
    resp = await client.get(f"/v1/vacancies/{vacancy_id}/applicants", headers=stranger_hdr)
    assert resp.status_code == 403


async def test_full_placement_flow_with_checkins(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])
    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    application_id = apply_resp.json()["id"]

    # Suhbat bosqichi
    interview = await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "interview"}
    )
    assert interview.status_code == 200
    assert interview.json()["status"] == "interview"

    # Qabul qilish — Placement avtomatik yaratiladi
    accept = await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "accepted"}
    )
    assert accept.status_code == 200
    assert accept.json()["status"] == "accepted"

    applicants = (await client.get(f"/v1/vacancies/{vacancy_id}/applicants", headers=hdr)).json()
    assert applicants[0]["status"] == "accepted"

    # Placement ID'ni bevosita DB orqali olamiz (endpoint uni qaytarmaydi)
    from sqlalchemy import select

    from app.models.employer import Placement

    placement = (
        await db.execute(select(Placement).where(Placement.application_id == application_id))
    ).scalar_one()
    placement_id = placement.id

    # 3 check-in: 1 hafta, 1 oy, 3 oy — foydalanuvchi tomonidan
    for period in ("1w", "1m", "3m"):
        resp = await client.post(
            f"/v1/placements/{placement_id}/checkin", headers=lhdr, json={"period": period}
        )
        assert resp.status_code == 200, resp.text

    final = resp.json()
    assert final["checkin_1w"] is True
    assert final["checkin_1m"] is True
    assert final["checkin_3m"] is True
    assert final["stable_confirmed_at"] is not None


async def test_public_employer_stats_computes_hire_time_and_retention(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778900")
    _, vacancy_id = await _create_published_vacancy(client, hdr)

    learner = await register_and_verify(client, phone="+998901112240")
    lhdr = auth_header(learner["access_token"])
    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    application_id = apply_resp.json()["id"]
    await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "accepted"}
    )

    from datetime import UTC, datetime, timedelta

    from app.models.employer import Placement, Vacancy

    placement = (
        await db.execute(select(Placement).where(Placement.application_id == application_id))
    ).scalar_one()
    vacancy = await db.get(Vacancy, vacancy_id)
    assert vacancy is not None
    # Vakansiya 110 kun oldin ochilgan, joylashtirish 100 kun oldin sodir bo'lgan —
    # yollash 10 kun davom etgan va joylashtirish 3 oy (90 kun)dan eski, ya'ni
    # saqlanish foiziga "loyiq" hisoblanadi.
    vacancy.created_at = datetime.now(UTC) - timedelta(days=110)
    placement.started_at = datetime.now(UTC) - timedelta(days=100)
    await db.commit()

    checkin = await client.post(
        f"/v1/placements/{placement.id}/checkin", headers=lhdr, json={"period": "3m"}
    )
    assert checkin.status_code == 200

    stats = (await client.get("/v1/employer/public-stats")).json()
    assert stats["avg_days_to_hire"] == 10
    assert stats["retention_3m_pct"] == 100


async def test_public_employer_stats_none_when_no_placements(
    client: httpx.AsyncClient,
) -> None:
    stats = (await client.get("/v1/employer/public-stats")).json()
    assert stats["avg_days_to_hire"] is None
    assert stats["retention_3m_pct"] is None


async def test_applicants_include_ladder_step_portfolio_and_certificate_counts(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr, ladder_step=2)

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])
    learner_id = (await client.get("/v1/users/me", headers=lhdr)).json()["id"]

    # 2-pog'onadagi kursni tugatgan
    instr_tokens = await register_and_verify(client, phone="+998909998877")
    instr_hdr = auth_header(instr_tokens["access_token"])
    await grant_role(db, "+998909998877", RoleCode.INSTRUCTOR)
    course = await client.post(
        "/v1/courses", headers=instr_hdr, json={"title": "Frontend asoslari", "ladder_step": 2}
    )
    course_id = course.json()["id"]
    await client.post(
        f"/v1/courses/{course_id}/modules", headers=instr_hdr, json={"title": "1-modul"}
    )
    await client.post(f"/v1/courses/{course_id}/publish", headers=instr_hdr)
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    enrollment = (
        await db.execute(select(Enrollment).where(Enrollment.user_id == learner_id))
    ).scalar_one()
    enrollment.status = EnrollmentStatus.COMPLETED
    await db.commit()

    # 2 ta portfolio ishi
    await client.post("/v1/me/portfolio", headers=lhdr, data={"title": "Loyiha 1"})
    await client.post("/v1/me/portfolio", headers=lhdr, data={"title": "Loyiha 2"})

    # 1 ta sertifikat — kurs 100% tugallanganda avtomatik beriladi (bu yerda to'g'ridan-to'g'ri)
    db.add(Certificate(user_id=learner_id, course_id=course_id, uid="cert-test-1"))
    await db.commit()

    await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )

    applicants = (await client.get(f"/v1/vacancies/{vacancy_id}/applicants", headers=hdr)).json()
    assert len(applicants) == 1
    assert applicants[0]["ladder_step"] == 2
    assert applicants[0]["portfolio_count"] == 2
    assert applicants[0]["certificates_count"] == 1


async def test_applicant_without_history_has_zero_counts(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    lhdr = auth_header(learner["access_token"])
    await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )

    applicants = (await client.get(f"/v1/vacancies/{vacancy_id}/applicants", headers=hdr)).json()
    assert applicants[0]["ladder_step"] == 0
    assert applicants[0]["portfolio_count"] == 0
    assert applicants[0]["certificates_count"] == 0


async def test_company_stats_counts_active_new_applications_and_hired(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    company_id, vacancy_id = await _create_published_vacancy(client, hdr)
    # Ikkinchi (qoralama) vakansiya — faol hisoblanmasligi kerak
    await client.post(
        f"/v1/companies/{company_id}/vacancies", headers=hdr, json={"title": "Qoralama vakansiya"}
    )

    submitted = await register_and_verify(client, phone="+998901112233")
    hired = await register_and_verify(client, phone="+998905556677")
    submitted_hdr = auth_header(submitted["access_token"])
    hired_hdr = auth_header(hired["access_token"])

    await client.post(
        f"/v1/vacancies/{vacancy_id}/apply",
        headers=submitted_hdr,
        json={"share_disability_profile": False},
    )
    hired_apply = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply",
        headers=hired_hdr,
        json={"share_disability_profile": False},
    )
    await client.post(
        f"/v1/applications/{hired_apply.json()['id']}/status",
        headers=hdr,
        json={"status": "accepted"},
    )

    stats = await client.get(f"/v1/companies/{company_id}/stats", headers=hdr)
    assert stats.status_code == 200, stats.text
    assert stats.json() == {"active_vacancies": 1, "new_applications": 1, "hired": 1}


async def test_owner_can_view_draft_and_closed_vacancy_summary(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    company = await client.post(
        "/v1/companies", headers=hdr, json={"name": "Alfa Telekom", "employee_count": 50}
    )
    company_id = company.json()["id"]
    draft = await client.post(
        f"/v1/companies/{company_id}/vacancies", headers=hdr, json={"title": "Qoralama rol"}
    )
    draft_id = draft.json()["id"]

    # Qoralama holatida ham egasi ko'ra oladi — jamoat /v1/vacancies/{id} bunda 404 beradi
    draft_summary = await client.get(f"/v1/vacancies/{draft_id}/owner", headers=hdr)
    assert draft_summary.status_code == 200, draft_summary.text
    assert draft_summary.json() == {"id": draft_id, "title": "Qoralama rol", "status": "draft"}

    public_view = await client.get(f"/v1/vacancies/{draft_id}")
    assert public_view.status_code == 404

    # Yopilgandan keyin ham — arizachilarni ko'rib chiqish davom etadi
    await client.post(f"/v1/vacancies/{draft_id}/publish", headers=hdr)
    closed = await db.get(Company, company_id)
    assert closed is not None

    from app.models.employer import Vacancy

    vacancy_row = await db.get(Vacancy, draft_id)
    assert vacancy_row is not None
    vacancy_row.status = "closed"
    await db.commit()

    closed_summary = await client.get(f"/v1/vacancies/{draft_id}/owner", headers=hdr)
    assert closed_summary.status_code == 200
    assert closed_summary.json()["status"] == "closed"


async def test_stranger_cannot_view_vacancy_owner_summary(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    owner_hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, owner_hdr)

    stranger_hdr = await _make_employer(client, db, "+998905556677")
    resp = await client.get(f"/v1/vacancies/{vacancy_id}/owner", headers=stranger_hdr)
    assert resp.status_code == 403


async def test_foreign_employer_cannot_view_company_stats(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    owner_hdr = await _make_employer(client, db, "+998907778899")
    company_id, _ = await _create_published_vacancy(client, owner_hdr)

    stranger_hdr = await _make_employer(client, db, "+998905556677")
    resp = await client.get(f"/v1/companies/{company_id}/stats", headers=stranger_hdr)
    assert resp.status_code == 403


async def test_stranger_cannot_checkin_placement(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998907778899")
    _, vacancy_id = await _create_published_vacancy(client, hdr)

    learner = await register_and_verify(client, phone="+998901112233")
    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply",
        headers=auth_header(learner["access_token"]),
        json={"share_disability_profile": False},
    )
    application_id = apply_resp.json()["id"]
    await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "accepted"}
    )

    from sqlalchemy import select

    from app.models.employer import Placement

    placement = (
        await db.execute(select(Placement).where(Placement.application_id == application_id))
    ).scalar_one()

    stranger = await register_and_verify(client, phone="+998905556677")
    resp = await client.post(
        f"/v1/placements/{placement.id}/checkin",
        headers=auth_header(stranger["access_token"]),
        json={"period": "1w"},
    )
    assert resp.status_code == 403
