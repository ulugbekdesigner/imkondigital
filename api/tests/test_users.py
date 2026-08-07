"""/v1/users/me/deactivate — foydalanuvchi o'zi hisobini yopadi."""

import httpx

from tests.helpers import auth_header, register_and_verify


async def test_deactivate_blocks_further_access(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998901230001")
    header = auth_header(tokens["access_token"])

    res = await client.post("/v1/users/me/deactivate", headers=header)
    assert res.status_code == 204

    # Bir xil access token endi rad etiladi — status 'blocked'ga o'tdi
    me = await client.get("/v1/users/me", headers=header)
    assert me.status_code == 403


async def test_deactivate_revokes_refresh_token(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998901230002")

    res = await client.post(
        "/v1/users/me/deactivate", headers=auth_header(tokens["access_token"])
    )
    assert res.status_code == 204

    refreshed = await client.post(
        "/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refreshed.status_code == 401


async def test_deactivate_requires_auth(client: httpx.AsyncClient) -> None:
    res = await client.post("/v1/users/me/deactivate")
    assert res.status_code == 401
