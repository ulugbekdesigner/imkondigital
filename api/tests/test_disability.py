"""Nogironlik profili — maxfiylik va moderatsiya oqimi."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from app.models.user import Region, Role, User, UserRole
from tests.helpers import auth_header, register_and_verify


async def _grant_role(db: AsyncSession, phone: str, code: RoleCode) -> None:
    user = (await db.execute(select(User).where(User.phone == phone))).scalar_one()
    role = (await db.execute(select(Role).where(Role.code == code.value))).scalar_one()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    await db.commit()


async def test_me_never_exposes_disability_details(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    hdr = auth_header(tokens["access_token"])

    # Profil to'ldirilmagan — holat None, tafsilot yo'q
    me = (await client.get("/v1/users/me", headers=hdr)).json()
    assert me["disability_verified_status"] is None
    assert "categories" not in me
    assert "group_type" not in me
    assert "work_conditions" not in me

    # Profil to'ldiramiz
    submit = await client.post(
        "/v1/users/me/disability-profile",
        headers=hdr,
        json={
            "group_type": "2",
            "categories": ["ko'rish"],
            "work_conditions": {"remote_only": True},
        },
    )
    assert submit.status_code == 201
    assert submit.json()["verified_status"] == "pending"

    # /me endi faqat HOLATNI ko'rsatadi — tafsilot hali ham yo'q
    me2 = (await client.get("/v1/users/me", headers=hdr)).json()
    assert me2["disability_verified_status"] == "pending"
    assert "categories" not in me2


async def test_owner_can_read_own_disability_details(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    hdr = auth_header(tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=hdr,
        json={"group_type": "3", "categories": ["eshitish"], "work_conditions": {}},
    )
    detail = await client.get("/v1/users/me/disability-profile", headers=hdr)
    assert detail.status_code == 200
    body = detail.json()
    assert body["group_type"] == "3"
    assert body["categories"] == ["eshitish"]


async def test_moderation_verify_updates_trajectory(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    # Foydalanuvchi profil yuboradi
    user_tokens = await register_and_verify(client, phone="+998901112233")
    user_hdr = auth_header(user_tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "1", "categories": ["harakat"], "work_conditions": {}},
    )

    # Tasdiqlashdan oldin trayektoriya 3-bosqichda emas
    traj_before = (await client.get("/v1/users/me/trajectory", headers=user_hdr)).json()
    assert traj_before["current_step"] == 3  # nogironlik tasdig'i — hozirgi qadam

    # Moderator tasdiqlaydi
    mod_tokens = await register_and_verify(client, phone="+998907778899")
    await _grant_role(db, "+998907778899", RoleCode.MODERATOR)
    mod_hdr = auth_header(mod_tokens["access_token"])

    queue = (await client.get("/v1/moderation/disability-profiles", headers=mod_hdr)).json()
    assert len(queue) == 1
    target_id = queue[0]["user_id"]

    approve = await client.post(
        f"/v1/moderation/disability-profiles/{target_id}/verify",
        headers=mod_hdr,
        json={"approve": True},
    )
    assert approve.status_code == 200
    assert approve.json()["verified_status"] == "verified"

    # Tasdiqlashdan keyin trayektoriya oldinga siljiydi
    traj_after = (await client.get("/v1/users/me/trajectory", headers=user_hdr)).json()
    assert traj_after["current_step"] == 4


async def test_moderation_queue_includes_region_and_submitted_at(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_tokens = await register_and_verify(client, phone="+998901113344")
    user_hdr = auth_header(user_tokens["access_token"])
    region = (
        await db.execute(select(Region).where(Region.name == "Toshkent shahri"))
    ).scalar_one()
    await client.patch("/v1/users/me", headers=user_hdr, json={"region_id": region.id})
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "1", "categories": ["harakat"], "work_conditions": {}},
    )

    mod_tokens = await register_and_verify(client, phone="+998907779900")
    await _grant_role(db, "+998907779900", RoleCode.MODERATOR)
    mod_hdr = auth_header(mod_tokens["access_token"])

    queue = (await client.get("/v1/moderation/disability-profiles", headers=mod_hdr)).json()
    item = next(i for i in queue if i["group_type"] == "1")
    assert item["region_name"] == "Toshkent shahri"
    assert item["submitted_at"] is not None


async def test_reject_with_reason_visible_to_owner_and_cleared_on_resubmit(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_tokens = await register_and_verify(client, phone="+998901113355")
    user_hdr = auth_header(user_tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "2", "categories": ["ko'rish"], "work_conditions": {}},
    )

    mod_tokens = await register_and_verify(client, phone="+998907779911")
    await _grant_role(db, "+998907779911", RoleCode.MODERATOR)
    mod_hdr = auth_header(mod_tokens["access_token"])
    target_id = (
        await client.get("/v1/moderation/disability-profiles", headers=mod_hdr)
    ).json()[0]["user_id"]

    reject = await client.post(
        f"/v1/moderation/disability-profiles/{target_id}/verify",
        headers=mod_hdr,
        json={"approve": False, "reason": "Hujjat aniq emas, qaytadan yuboring"},
    )
    assert reject.status_code == 200
    assert reject.json()["verified_status"] == "rejected"

    own = (
        await client.get("/v1/users/me/disability-profile", headers=user_hdr)
    ).json()
    assert own["rejection_reason"] == "Hujjat aniq emas, qaytadan yuboring"

    # Qayta yuborilganda eski rad sababi tozalanadi (yangi tekshiruv kutilmoqda)
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "2", "categories": ["ko'rish", "eshitish"], "work_conditions": {}},
    )
    resubmitted = (
        await client.get("/v1/users/me/disability-profile", headers=user_hdr)
    ).json()
    assert resubmitted["rejection_reason"] is None


async def test_upload_disability_document_sets_doc_url_and_visible_to_moderator(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_tokens = await register_and_verify(client, phone="+998901114400")
    user_hdr = auth_header(user_tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "1", "categories": ["harakat"], "work_conditions": {}},
    )

    files = {"file": ("msek.pdf", b"%PDF-1.4 fake test content", "application/pdf")}
    upload = await client.post(
        "/v1/users/me/disability-profile/document", headers=user_hdr, files=files
    )
    assert upload.status_code == 200
    body = upload.json()
    assert body["doc_url"] is not None
    assert body["doc_url"].endswith("msek.pdf")

    own = (await client.get("/v1/users/me/disability-profile", headers=user_hdr)).json()
    assert own["doc_url"] == body["doc_url"]

    mod_tokens = await register_and_verify(client, phone="+998907779922")
    await _grant_role(db, "+998907779922", RoleCode.MODERATOR)
    mod_hdr = auth_header(mod_tokens["access_token"])
    queue = (await client.get("/v1/moderation/disability-profiles", headers=mod_hdr)).json()
    item = next(i for i in queue if i["group_type"] == "1")
    assert item["doc_url"] == body["doc_url"]


async def test_upload_disability_document_rejects_wrong_content_type(
    client: httpx.AsyncClient,
) -> None:
    tokens = await register_and_verify(client, phone="+998901114411")
    hdr = auth_header(tokens["access_token"])
    files = {"file": ("notes.txt", b"plain text", "text/plain")}
    res = await client.post(
        "/v1/users/me/disability-profile/document", headers=hdr, files=files
    )
    assert res.status_code == 400


async def test_upload_disability_document_resets_rejected_status_to_pending(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_tokens = await register_and_verify(client, phone="+998901114422")
    user_hdr = auth_header(user_tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "2", "categories": ["ko'rish"], "work_conditions": {}},
    )
    mod_tokens = await register_and_verify(client, phone="+998907779933")
    await _grant_role(db, "+998907779933", RoleCode.MODERATOR)
    mod_hdr = auth_header(mod_tokens["access_token"])
    target_id = (
        await client.get("/v1/moderation/disability-profiles", headers=mod_hdr)
    ).json()[0]["user_id"]
    await client.post(
        f"/v1/moderation/disability-profiles/{target_id}/verify",
        headers=mod_hdr,
        json={"approve": False, "reason": "Hujjat kerak"},
    )

    files = {"file": ("msek.jpg", b"\xff\xd8\xff fake jpg bytes", "image/jpeg")}
    upload = await client.post(
        "/v1/users/me/disability-profile/document", headers=user_hdr, files=files
    )
    assert upload.status_code == 200
    assert upload.json()["verified_status"] == "pending"
    assert upload.json()["rejection_reason"] is None
