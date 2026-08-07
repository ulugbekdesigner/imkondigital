"""Imtiyozlar Markazi — CRUD (moderator), shaxsiylashtirilgan katalog, saqlash."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _moderator_headers(client: httpx.AsyncClient, db: AsyncSession) -> dict[str, str]:
    await register_and_verify(client, phone="+998912221100", full_name="Moderator")
    await grant_role(db, "+998912221100", RoleCode.MODERATOR)
    login = await client.post(
        "/v1/auth/login", json={"phone": "+998912221100", "password": "parol12345"}
    )
    return auth_header(login.json()["access_token"])


async def _create_published_benefit(
    client: httpx.AsyncClient, mod_hdr: dict[str, str], **overrides: object
) -> int:
    payload = {
        "title": "Nafaqa qo'shimchasi",
        "description": "Har oy to'lanadigan qo'shimcha nafaqa",
        "category": "moliyaviy",
        "audience": "user",
        "region_id": None,
        "disability_categories": [],
        "how_to_apply": "Fuqarolar yig'inida ariza bering",
        "external_url": None,
    }
    payload.update(overrides)
    resp = await client.post("/v1/benefits", headers=mod_hdr, json=payload)
    assert resp.status_code == 201, resp.text
    benefit_id = resp.json()["id"]
    pub = await client.post(f"/v1/benefits/{benefit_id}/publish", headers=mod_hdr)
    assert pub.status_code == 200, pub.text
    return benefit_id


async def test_create_benefit_requires_moderator(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998912223344")
    hdr = auth_header(tokens["access_token"])
    resp = await client.post(
        "/v1/benefits",
        headers=hdr,
        json={
            "title": "Ruxsatsiz urinish",
            "category": "boshqa",
        },
    )
    assert resp.status_code == 403


async def test_create_and_publish_benefit_appears_in_catalog(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(client, mod_hdr)

    catalog = await client.get("/v1/benefits")
    assert any(b["id"] == benefit_id for b in catalog.json()["items"])


async def test_draft_benefit_not_in_catalog_and_404_on_detail(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)
    resp = await client.post(
        "/v1/benefits",
        headers=mod_hdr,
        json={"title": "Qoralama imtiyoz", "category": "boshqa"},
    )
    benefit_id = resp.json()["id"]

    catalog = await client.get("/v1/benefits")
    assert all(b["id"] != benefit_id for b in catalog.json()["items"])

    detail = await client.get(f"/v1/benefits/{benefit_id}")
    assert detail.status_code == 404


async def test_catalog_personalization_sorts_relevant_first(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)

    user_tokens = await register_and_verify(client, phone="+998912225566")
    uhdr = auth_header(user_tokens["access_token"])
    await client.patch("/v1/users/me", headers=uhdr, json={"region_id": 1})
    await client.post(
        "/v1/users/me/disability-profile",
        headers=uhdr,
        json={"categories": ["eshitish"]},
    )

    not_relevant_id = await _create_published_benefit(
        client,
        mod_hdr,
        title="Boshqa hudud imtiyozi",
        region_id=2,
    )
    relevant_id = await _create_published_benefit(
        client,
        mod_hdr,
        title="Eshitish uchun imtiyoz",
        region_id=1,
        disability_categories=["eshitish"],
    )

    catalog = await client.get("/v1/benefits", headers=uhdr)
    items = catalog.json()["items"]
    by_id = {b["id"]: b for b in items}
    assert by_id[relevant_id]["is_relevant_to_me"] is True
    assert by_id[not_relevant_id]["is_relevant_to_me"] is False

    relevant_index = next(i for i, b in enumerate(items) if b["id"] == relevant_id)
    not_relevant_index = next(i for i, b in enumerate(items) if b["id"] == not_relevant_id)
    assert relevant_index < not_relevant_index


async def test_catalog_without_auth_has_no_personalization(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(client, mod_hdr)

    catalog = await client.get("/v1/benefits")
    item = next(b for b in catalog.json()["items"] if b["id"] == benefit_id)
    assert item["is_relevant_to_me"] is None
    assert item["is_saved"] is False


async def test_employer_audience_benefit_has_no_personalization(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(
        client, mod_hdr, title="Soliq imtiyozi", audience="employer"
    )

    user_tokens = await register_and_verify(client, phone="+998912227788")
    uhdr = auth_header(user_tokens["access_token"])

    detail = await client.get(f"/v1/benefits/{benefit_id}", headers=uhdr)
    assert detail.json()["is_relevant_to_me"] is None


async def test_save_and_unsave_benefit(client: httpx.AsyncClient, db: AsyncSession) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(client, mod_hdr)

    user_tokens = await register_and_verify(client, phone="+998912229900")
    uhdr = auth_header(user_tokens["access_token"])

    save = await client.post(f"/v1/benefits/{benefit_id}/save", headers=uhdr)
    assert save.status_code == 204

    saved_list = await client.get("/v1/benefits/me/saved", headers=uhdr)
    assert any(b["id"] == benefit_id for b in saved_list.json())

    detail = await client.get(f"/v1/benefits/{benefit_id}", headers=uhdr)
    assert detail.json()["is_saved"] is True

    # Idempotent — qayta saqlash xato bermaydi
    save_again = await client.post(f"/v1/benefits/{benefit_id}/save", headers=uhdr)
    assert save_again.status_code == 204

    unsave = await client.post(f"/v1/benefits/{benefit_id}/unsave", headers=uhdr)
    assert unsave.status_code == 204
    saved_list_after = await client.get("/v1/benefits/me/saved", headers=uhdr)
    assert all(b["id"] != benefit_id for b in saved_list_after.json())


async def test_catalog_audience_filter(client: httpx.AsyncClient, db: AsyncSession) -> None:
    mod_hdr = await _moderator_headers(client, db)
    user_benefit_id = await _create_published_benefit(client, mod_hdr, title="Foydalanuvchiga")
    employer_benefit_id = await _create_published_benefit(
        client, mod_hdr, title="Ish beruvchiga", audience="employer"
    )

    only_user = await client.get("/v1/benefits", params={"audience": "user"})
    ids = {b["id"] for b in only_user.json()["items"]}
    assert user_benefit_id in ids
    assert employer_benefit_id not in ids


async def test_catalog_provider_type_filter(client: httpx.AsyncClient, db: AsyncSession) -> None:
    mod_hdr = await _moderator_headers(client, db)
    gov_id = await _create_published_benefit(
        client, mod_hdr, title="Davlat imtiyozi", provider_type="davlat"
    )
    company_id = await _create_published_benefit(
        client, mod_hdr, title="Kompaniya imtiyozi", provider_type="kompaniya"
    )

    only_company = await client.get("/v1/benefits", params={"provider_type": "kompaniya"})
    ids = {b["id"] for b in only_company.json()["items"]}
    assert company_id in ids
    assert gov_id not in ids


async def test_benefit_defaults_to_davlat_provider_type(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(client, mod_hdr)
    detail = await client.get(f"/v1/benefits/{benefit_id}")
    assert detail.json()["provider_type"] == "davlat"


async def test_benefit_expires_at_roundtrips(client: httpx.AsyncClient, db: AsyncSession) -> None:
    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(client, mod_hdr, expires_at="2026-12-31T00:00:00Z")
    detail = await client.get(f"/v1/benefits/{benefit_id}")
    assert detail.json()["expires_at"] is not None
    assert detail.json()["expires_at"].startswith("2026-12-31")


async def test_publish_endpoint_does_not_fail_when_queue_unavailable(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """Celery navbatiga ulanish vaqtincha ishlamasa ham nashr muvaffaqiyatli bo'lishi kerak

    (test muhitida haqiqiy worker ishlab turmaydi — .delay() jim yutilishi kutiladi)."""
    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(client, mod_hdr)
    detail = await client.get(f"/v1/benefits/{benefit_id}")
    assert detail.status_code == 200
    assert detail.json()["status"] == "published"


async def test_fan_out_notifies_only_matching_users_in_government_category(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    from app.models.benefits import Benefit
    from app.modules.benefits.service import fan_out_benefit_matches

    mod_hdr = await _moderator_headers(client, db)

    matching = await register_and_verify(client, phone="+998912231100")
    matching_hdr = auth_header(matching["access_token"])
    await client.patch("/v1/users/me", headers=matching_hdr, json={"region_id": 1})
    await client.post(
        "/v1/users/me/disability-profile",
        headers=matching_hdr,
        json={"categories": ["eshitish"]},
    )

    non_matching = await register_and_verify(client, phone="+998912231200")
    non_matching_hdr = auth_header(non_matching["access_token"])
    await client.patch("/v1/users/me", headers=non_matching_hdr, json={"region_id": 2})

    benefit_id = await _create_published_benefit(
        client,
        mod_hdr,
        title="Eshitish uchun yangi imtiyoz",
        region_id=1,
        disability_categories=["eshitish"],
    )
    benefit = await db.get(Benefit, benefit_id)
    assert benefit is not None

    notified = await fan_out_benefit_matches(db, benefit)
    assert notified == 1

    matching_notifs = await client.get("/v1/me/notifications", headers=matching_hdr)
    items = matching_notifs.json()["items"]
    assert any(n["type"] == "benefit_match" and n["category"] == "government" for n in items)

    non_matching_notifs = await client.get("/v1/me/notifications", headers=non_matching_hdr)
    assert all(n["type"] != "benefit_match" for n in non_matching_notifs.json()["items"])


async def test_fan_out_skips_employer_audience_benefits(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    from app.models.benefits import Benefit
    from app.modules.benefits.service import fan_out_benefit_matches

    mod_hdr = await _moderator_headers(client, db)
    benefit_id = await _create_published_benefit(
        client, mod_hdr, title="Soliq imtiyozi", audience="employer"
    )
    benefit = await db.get(Benefit, benefit_id)
    assert benefit is not None

    notified = await fan_out_benefit_matches(db, benefit)
    assert notified == 0


async def test_fan_out_is_idempotent_does_not_duplicate_notifications(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """Regression: yakuniy vizual auditda topilgan haqiqiy xato — bitta imtiyoz

    uchun fan-out bir necha marta chaqirilsa (masalan navbat qayta ishga
    tushishi yoki qayta-qayta "nashr etish" chaqiruvi), bir xil foydalanuvchiga
    ikkinchi marta bildirishnoma yubormasligi kerak."""
    from app.models.benefits import Benefit
    from app.modules.benefits.service import fan_out_benefit_matches

    mod_hdr = await _moderator_headers(client, db)

    matching = await register_and_verify(client, phone="+998912231300")
    matching_hdr = auth_header(matching["access_token"])
    await client.patch("/v1/users/me", headers=matching_hdr, json={"region_id": 1})
    await client.post(
        "/v1/users/me/disability-profile",
        headers=matching_hdr,
        json={"categories": ["eshitish"]},
    )

    benefit_id = await _create_published_benefit(
        client,
        mod_hdr,
        title="Takroriy fan-out sinovi",
        region_id=1,
        disability_categories=["eshitish"],
    )
    benefit = await db.get(Benefit, benefit_id)
    assert benefit is not None

    first_run = await fan_out_benefit_matches(db, benefit)
    assert first_run == 1

    second_run = await fan_out_benefit_matches(db, benefit)
    assert second_run == 0

    matching_notifs = await client.get("/v1/me/notifications", headers=matching_hdr)
    benefit_notifs = [
        n for n in matching_notifs.json()["items"] if n["link_url"] == f"/imtiyozlar/{benefit_id}"
    ]
    assert len(benefit_notifs) == 1


async def test_republishing_already_published_benefit_does_not_refan_out(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """Regression: `publish_benefit` avval har chaqiruvda fan-out navbatiga

    qo'yardi — allaqachon chop etilgan imtiyozni qayta "nashr etish" (masalan
    ustma-ust bosish yoki takroriy so'rov) har safar BARCHA mos foydalanuvchiga
    yana bildirishnoma yuborardi. Endi faqat draft->published o'tishida."""
    from unittest.mock import patch

    mod_hdr = await _moderator_headers(client, db)
    create = await client.post(
        "/v1/benefits",
        headers=mod_hdr,
        json={
            "title": "Qayta nashr sinovi",
            "description": "Tavsif",
            "category": "moliyaviy",
            "audience": "user",
        },
    )
    benefit_id = create.json()["id"]

    with patch("app.modules.benefits.service.fan_out_benefit_notification") as mock_task:
        first_publish = await client.post(f"/v1/benefits/{benefit_id}/publish", headers=mod_hdr)
        assert first_publish.status_code == 200
        assert mock_task.delay.call_count == 1

        second_publish = await client.post(f"/v1/benefits/{benefit_id}/publish", headers=mod_hdr)
        assert second_publish.status_code == 200
        assert mock_task.delay.call_count == 1  # qayta chaqirilmadi
