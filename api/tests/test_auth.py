"""Auth sikli testlari — register → verify → login → refresh → logout."""

import httpx
import pytest

from tests.helpers import auth_header, register_and_verify


async def test_full_auth_cycle(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"] and tokens["refresh_token"]

    # /me access token bilan ishlaydi
    me = await client.get("/v1/users/me", headers=auth_header(tokens["access_token"]))
    assert me.status_code == 200
    body = me.json()
    assert body["phone"] == "+998901112233"
    assert body["status"] == "active"
    assert "user" in body["roles"]

    # refresh → yangi token juftligi
    refreshed = await client.post(
        "/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refreshed.status_code == 200
    new_tokens = refreshed.json()
    assert new_tokens["refresh_token"] != tokens["refresh_token"]

    # logout → refresh bekor qilinadi
    logout = await client.post(
        "/v1/auth/logout", json={"refresh_token": new_tokens["refresh_token"]}
    )
    assert logout.status_code == 204


async def test_refresh_rotation_revokes_old_token(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    old_refresh = tokens["refresh_token"]

    first = await client.post("/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert first.status_code == 200

    # Eski refresh token endi ishlamaydi (rotatsiya)
    reuse = await client.post("/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert reuse.status_code == 401


async def test_login_requires_verification(client: httpx.AsyncClient) -> None:
    reg = await client.post(
        "/v1/auth/register",
        json={"phone": "+998907778899", "password": "parol12345", "full_name": "Tasdiqsiz"},
    )
    assert reg.status_code == 201

    # Tasdiqlanmagan foydalanuvchi kira olmaydi
    login = await client.post(
        "/v1/auth/login", json={"phone": "+998907778899", "password": "parol12345"}
    )
    assert login.status_code == 403


async def test_login_after_verification(client: httpx.AsyncClient) -> None:
    await register_and_verify(client, phone="+998901234567")
    login = await client.post(
        "/v1/auth/login", json={"phone": "+998901234567", "password": "parol12345"}
    )
    assert login.status_code == 200
    assert login.json()["access_token"]


async def test_duplicate_registration_conflicts(client: httpx.AsyncClient) -> None:
    payload = {"phone": "+998905556677", "password": "parol12345", "full_name": "Birinchi"}
    first = await client.post("/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post("/v1/auth/register", json=payload)
    assert second.status_code == 409


async def test_wrong_password_rejected(client: httpx.AsyncClient) -> None:
    await register_and_verify(client, phone="+998901111111")
    login = await client.post(
        "/v1/auth/login", json={"phone": "+998901111111", "password": "notaroganparol"}
    )
    assert login.status_code == 401


async def test_bad_verification_code_rejected(client: httpx.AsyncClient) -> None:
    await client.post(
        "/v1/auth/register",
        json={"phone": "+998902223344", "password": "parol12345", "full_name": "Test"},
    )
    verify = await client.post(
        "/v1/auth/verify-phone", json={"phone": "+998902223344", "code": "000000"}
    )
    assert verify.status_code == 400


@pytest.mark.parametrize("bad_phone", ["12345", "+9989011", "998-abc"])
async def test_invalid_phone_rejected(client: httpx.AsyncClient, bad_phone: str) -> None:
    reg = await client.post(
        "/v1/auth/register",
        json={"phone": bad_phone, "password": "parol12345", "full_name": "Test"},
    )
    assert reg.status_code == 422
