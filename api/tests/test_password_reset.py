"""QA_AUDIT D7 - admin parolni ko'rmasdan tiklash havolasi yaratadi."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def test_non_admin_cannot_create_reset_link(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998942220001")
    target = await register_and_verify(client, phone="+998942220002")
    hdr = auth_header(tokens["access_token"])
    target_id = (await client.get("/v1/users/me", headers=auth_header(target["access_token"]))).json()[
        "id"
    ]

    resp = await client.post(f"/v1/admin/users/{target_id}/password-reset-link", headers=hdr)
    assert resp.status_code == 403


async def test_admin_creates_link_and_user_resets_password(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_tokens = await register_and_verify(client, phone="+998942220003")
    await grant_role(db, "+998942220003", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])

    user_tokens = await register_and_verify(client, phone="+998942220004")
    user_hdr = auth_header(user_tokens["access_token"])
    user_id = (await client.get("/v1/users/me", headers=user_hdr)).json()["id"]

    link_resp = await client.post(
        f"/v1/admin/users/{user_id}/password-reset-link", headers=admin_hdr
    )
    assert link_resp.status_code == 200, link_resp.text
    link = link_resp.json()["link"]
    assert "/parolni-tiklash?token=" in link
    token = link.split("token=")[1]

    reset_resp = await client.post(
        "/v1/auth/reset-password", json={"token": token, "new_password": "yangiParol123"}
    )
    assert reset_resp.status_code == 204

    old_login = await client.post(
        "/v1/auth/login", json={"phone": "+998942220004", "password": "parol12345"}
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/v1/auth/login", json={"phone": "+998942220004", "password": "yangiParol123"}
    )
    assert new_login.status_code == 200


async def test_reset_token_is_single_use(client: httpx.AsyncClient, db: AsyncSession) -> None:
    admin_tokens = await register_and_verify(client, phone="+998942220005")
    await grant_role(db, "+998942220005", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])

    user_tokens = await register_and_verify(client, phone="+998942220006")
    user_id = (
        await client.get("/v1/users/me", headers=auth_header(user_tokens["access_token"]))
    ).json()["id"]

    link_resp = await client.post(
        f"/v1/admin/users/{user_id}/password-reset-link", headers=admin_hdr
    )
    token = link_resp.json()["link"].split("token=")[1]

    first = await client.post(
        "/v1/auth/reset-password", json={"token": token, "new_password": "birinchiParol1"}
    )
    assert first.status_code == 204

    second = await client.post(
        "/v1/auth/reset-password", json={"token": token, "new_password": "ikkinchiParol1"}
    )
    assert second.status_code == 400


async def test_invalid_token_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/v1/auth/reset-password",
        json={"token": "notoqilgan-token", "new_password": "yangiParol123"},
    )
    assert resp.status_code == 400


async def test_reset_revokes_existing_refresh_tokens(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_tokens = await register_and_verify(client, phone="+998942220007")
    await grant_role(db, "+998942220007", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])

    user_tokens = await register_and_verify(client, phone="+998942220008")
    user_id = (
        await client.get("/v1/users/me", headers=auth_header(user_tokens["access_token"]))
    ).json()["id"]
    old_refresh_token = user_tokens["refresh_token"]

    link_resp = await client.post(
        f"/v1/admin/users/{user_id}/password-reset-link", headers=admin_hdr
    )
    token = link_resp.json()["link"].split("token=")[1]
    await client.post(
        "/v1/auth/reset-password", json={"token": token, "new_password": "yangiParol123"}
    )

    refresh_attempt = await client.post(
        "/v1/auth/refresh", json={"refresh_token": old_refresh_token}
    )
    assert refresh_attempt.status_code == 401
