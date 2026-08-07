"""RBAC testlari — noto'g'ri rol rad etiladi."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from app.models.user import Role, User, UserRole
from tests.helpers import auth_header, register_and_verify


async def _grant_role(db: AsyncSession, phone: str, code: RoleCode) -> None:
    user = (await db.execute(select(User).where(User.phone == phone))).scalar_one()
    role = (await db.execute(select(Role).where(Role.code == code.value))).scalar_one()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    await db.commit()


async def test_regular_user_cannot_access_moderation(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client, phone="+998901112233")
    resp = await client.get(
        "/v1/moderation/disability-profiles", headers=auth_header(tokens["access_token"])
    )
    assert resp.status_code == 403


async def test_moderator_can_access_moderation(client: httpx.AsyncClient, db: AsyncSession) -> None:
    tokens = await register_and_verify(client, phone="+998907778899")
    await _grant_role(db, "+998907778899", RoleCode.MODERATOR)

    resp = await client.get(
        "/v1/moderation/disability-profiles", headers=auth_header(tokens["access_token"])
    )
    assert resp.status_code == 200
    assert resp.json() == []


async def test_missing_token_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/users/me")
    assert resp.status_code == 401  # autentifikatsiya yo'q


async def test_invalid_token_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/users/me", headers=auth_header("not.a.valid.token"))
    assert resp.status_code == 401
