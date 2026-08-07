"""Hudud sahifalari — KENGAYISH_PLAN_3.md 8-bo'lim."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _region_id(client: httpx.AsyncClient, slug: str) -> int:
    regions = (await client.get("/v1/regions")).json()
    return next(r["id"] for r in regions if r["slug"] == slug)


async def _moderator_headers(client: httpx.AsyncClient, db: AsyncSession) -> dict[str, str]:
    await register_and_verify(client, phone="+998912221188", full_name="Moderator")
    await grant_role(db, "+998912221188", RoleCode.MODERATOR)
    login = await client.post(
        "/v1/auth/login", json={"phone": "+998912221188", "password": "parol12345"}
    )
    return auth_header(login.json()["access_token"])


async def test_list_regions_returns_seeded_regions_with_slugs(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/regions")
    assert resp.status_code == 200
    slugs = {r["slug"] for r in resp.json()}
    assert {"toshkent-shahri", "andijon-viloyati"}.issubset(slugs)


async def test_unknown_region_slug_returns_404(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/regions/notogri-slug")
    assert resp.status_code == 404


async def test_region_detail_starts_with_zero_stats(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/regions/andijon-viloyati")
    assert resp.status_code == 200
    body = resp.json()
    assert body["stats"]["open_vacancies"] == 0
    assert body["stats"]["registered_users"] == 0
    assert body["vacancies_preview"] == []


async def test_published_vacancy_in_region_appears_in_stats_and_preview(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    region_id = await _region_id(client, "toshkent-shahri")
    tokens = await register_and_verify(client, phone="+998917002200")
    hdr = auth_header(tokens["access_token"])
    await grant_role(db, "+998917002200", RoleCode.EMPLOYER)
    company = await client.post(
        "/v1/companies", headers=hdr, json={"name": "Zamin Soft", "employee_count": 5}
    )
    company_id = company.json()["id"]
    vacancy = await client.post(
        f"/v1/companies/{company_id}/vacancies",
        headers=hdr,
        json={"title": "Backend dasturchi", "region_id": region_id},
    )
    vacancy_id = vacancy.json()["id"]
    await client.post(f"/v1/vacancies/{vacancy_id}/publish", headers=hdr)

    detail = (await client.get("/v1/regions/toshkent-shahri")).json()
    assert detail["stats"]["open_vacancies"] == 1
    assert any(v["id"] == vacancy_id for v in detail["vacancies_preview"])

    other = (await client.get("/v1/regions/andijon-viloyati")).json()
    assert other["stats"]["open_vacancies"] == 0


async def test_universal_benefit_counts_toward_every_region(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit = await client.post(
        "/v1/benefits",
        headers=mod_hdr,
        json={"title": "Butun mamlakat bo'ylab imtiyoz", "category": "moliyaviy"},
    )
    benefit_id = benefit.json()["id"]
    await client.post(f"/v1/benefits/{benefit_id}/publish", headers=mod_hdr)

    for slug in ("toshkent-shahri", "andijon-viloyati"):
        detail = (await client.get(f"/v1/regions/{slug}")).json()
        assert detail["stats"]["published_benefits"] == 1


async def test_registered_user_with_region_counted_in_stats(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    region_id = await _region_id(client, "andijon-viloyati")
    tokens = await register_and_verify(client, phone="+998917002201")
    hdr = auth_header(tokens["access_token"])
    await client.patch("/v1/users/me", headers=hdr, json={"region_id": region_id})

    detail = (await client.get("/v1/regions/andijon-viloyati")).json()
    assert detail["stats"]["registered_users"] == 1


async def test_accepted_application_counts_as_placement_in_applicants_home_region(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    applicant_region_id = await _region_id(client, "andijon-viloyati")
    vacancy_region_id = await _region_id(client, "toshkent-shahri")

    applicant_tokens = await register_and_verify(client, phone="+998917002300")
    applicant_hdr = auth_header(applicant_tokens["access_token"])
    await client.patch(
        "/v1/users/me", headers=applicant_hdr, json={"region_id": applicant_region_id}
    )

    employer_tokens = await register_and_verify(client, phone="+998917002301")
    employer_hdr = auth_header(employer_tokens["access_token"])
    await grant_role(db, "+998917002301", RoleCode.EMPLOYER)
    company = await client.post(
        "/v1/companies", headers=employer_hdr, json={"name": "Zamin Soft", "employee_count": 5}
    )
    vacancy = await client.post(
        f"/v1/companies/{company.json()['id']}/vacancies",
        headers=employer_hdr,
        json={"title": "Backend dasturchi", "region_id": vacancy_region_id},
    )
    vacancy_id = vacancy.json()["id"]
    await client.post(f"/v1/vacancies/{vacancy_id}/publish", headers=employer_hdr)

    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply",
        headers=applicant_hdr,
        json={"share_disability_profile": False},
    )
    application_id = apply_resp.json()["id"]
    await client.post(
        f"/v1/applications/{application_id}/status",
        headers=employer_hdr,
        json={"status": "accepted"},
    )

    # Ishga joylashgan hisoblanadi nomzodning UY hududida, vakansiya hududida emas.
    applicant_region_detail = (await client.get("/v1/regions/andijon-viloyati")).json()
    assert applicant_region_detail["stats"]["placed_count"] == 1

    vacancy_region_detail = (await client.get("/v1/regions/toshkent-shahri")).json()
    assert vacancy_region_detail["stats"]["placed_count"] == 0


async def test_list_regions_with_stats_covers_all_regions(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/regions/with-stats")
    assert resp.status_code == 200
    slugs = {r["slug"] for r in resp.json()}
    assert {"toshkent-shahri", "andijon-viloyati"}.issubset(slugs)
