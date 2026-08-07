"""Pullik daraja (Subscription) — grant/revoke, AI kvota farqi, nogironlik stipendiyasi."""

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_quota import check_and_increment_quota
from app.models.enums import AiFeature, RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_user_id(client: httpx.AsyncClient, phone: str) -> tuple[int, dict[str, str]]:
    tokens = await register_and_verify(client, phone=phone)
    hdr = auth_header(tokens["access_token"])
    me = await client.get("/v1/users/me", headers=hdr)
    return int(me.json()["id"]), hdr


async def _make_admin(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.ADMIN)
    return auth_header(tokens["access_token"])


async def test_default_plan_is_free(client: httpx.AsyncClient) -> None:
    _, hdr = await _make_user_id(client, "+998919001100")
    resp = await client.get("/v1/me/subscription", headers=hdr)
    assert resp.status_code == 200
    assert resp.json() == {
        "plan": "free",
        "granted_by": None,
        "started_at": None,
        "expires_at": None,
    }


async def test_admin_can_grant_and_revoke_plan(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id, user_hdr = await _make_user_id(client, "+998919002200")
    admin_hdr = await _make_admin(client, db, "+998919003300")

    grant = await client.patch(
        f"/v1/admin/users/{user_id}/subscription", headers=admin_hdr, json={"plan": "pro"}
    )
    assert grant.status_code == 200
    assert grant.json()["plan"] == "pro"
    assert grant.json()["granted_by"] == "admin"

    mine = await client.get("/v1/me/subscription", headers=user_hdr)
    assert mine.json()["plan"] == "pro"

    revoke = await client.patch(
        f"/v1/admin/users/{user_id}/subscription", headers=admin_hdr, json={"plan": "free"}
    )
    assert revoke.status_code == 200
    assert revoke.json()["plan"] == "free"

    mine_after = await client.get("/v1/me/subscription", headers=user_hdr)
    assert mine_after.json()["plan"] == "free"


async def test_non_admin_cannot_grant_plan(client: httpx.AsyncClient) -> None:
    user_id, hdr = await _make_user_id(client, "+998919004400")
    resp = await client.patch(
        f"/v1/admin/users/{user_id}/subscription", headers=hdr, json={"plan": "pro"}
    )
    assert resp.status_code == 403


async def test_ziyo_quota_scales_with_plan(client: httpx.AsyncClient, db: AsyncSession) -> None:
    user_id, user_hdr = await _make_user_id(client, "+998919005500")
    admin_hdr = await _make_admin(client, db, "+998919006600")

    # FREE — sozlamadagi standart ai_daily_quota_ziyo=30 dan tugatib qo'yamiz emas,
    # PLUS'ga o'tkazamiz (limit=80) va 30 tadan ko'p so'rov FREE'da bloklanishini,
    # xuddi shu son PLUS'da bloklanmasligini solishtiramiz.
    for _ in range(30):
        await check_and_increment_quota(db, user_id, AiFeature.ZIYO)
    await db.commit()
    with pytest.raises(HTTPException) as exc_info:
        await check_and_increment_quota(db, user_id, AiFeature.ZIYO)
    assert exc_info.value.status_code == 429

    # PLUS'ga o'tkazish — bugungi 30 ta hisoblangan foydalanish saqlanadi,
    # lekin limit endi 80 bo'lgani uchun yana so'rov o'tadi
    await client.patch(
        f"/v1/admin/users/{user_id}/subscription", headers=admin_hdr, json={"plan": "plus"}
    )
    await check_and_increment_quota(db, user_id, AiFeature.ZIYO)
    await db.commit()


async def test_disability_approval_grants_stipend(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_tokens = await register_and_verify(client, phone="+998919007700")
    user_hdr = auth_header(user_tokens["access_token"])
    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "1", "categories": ["harakat"], "work_conditions": {}},
    )

    mod_hdr = await _make_admin(client, db, "+998919008800")
    queue = (await client.get("/v1/moderation/disability-profiles", headers=mod_hdr)).json()
    target_id = queue[0]["user_id"]
    approve = await client.post(
        f"/v1/moderation/disability-profiles/{target_id}/verify",
        headers=mod_hdr,
        json={"approve": True},
    )
    assert approve.status_code == 200

    sub = await client.get("/v1/me/subscription", headers=user_hdr)
    assert sub.json()["plan"] == "plus"
    assert sub.json()["granted_by"] == "stipend"


async def test_stipend_does_not_downgrade_existing_pro(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id, user_hdr = await _make_user_id(client, "+998919009900")
    admin_hdr = await _make_admin(client, db, "+998919010000")
    await client.patch(
        f"/v1/admin/users/{user_id}/subscription", headers=admin_hdr, json={"plan": "pro"}
    )

    await client.post(
        "/v1/users/me/disability-profile",
        headers=user_hdr,
        json={"group_type": "1", "categories": ["harakat"], "work_conditions": {}},
    )
    queue = (await client.get("/v1/moderation/disability-profiles", headers=admin_hdr)).json()
    target_id = next(q["user_id"] for q in queue if q["user_id"] == user_id)
    await client.post(
        f"/v1/moderation/disability-profiles/{target_id}/verify",
        headers=admin_hdr,
        json={"approve": True},
    )

    sub = await client.get("/v1/me/subscription", headers=user_hdr)
    assert sub.json()["plan"] == "pro"


async def test_pricing_endpoint(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/subscriptions/pricing")
    assert resp.status_code == 200
    body = resp.json()
    assert body["plus_price_som"] > 0
    assert body["pro_price_som"] > body["plus_price_som"]
