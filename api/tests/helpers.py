"""Test yordamchilari."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from app.models.user import Role, User, UserRole


async def grant_role(db: AsyncSession, phone: str, code: RoleCode) -> None:
    user = (await db.execute(select(User).where(User.phone == phone))).scalar_one()
    role = (await db.execute(select(Role).where(Role.code == code.value))).scalar_one()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    await db.commit()


async def register_and_verify(
    client: httpx.AsyncClient,
    phone: str = "+998901112233",
    password: str = "parol12345",
    full_name: str = "Test Foydalanuvchi",
) -> dict[str, str]:
    """Ro'yxatdan o'tkazadi, telefonni tasdiqlaydi va token juftligini qaytaradi."""
    reg = await client.post(
        "/v1/auth/register",
        json={"phone": phone, "password": password, "full_name": full_name},
    )
    assert reg.status_code == 201, reg.text
    code = reg.json()["dev_code"]
    assert code is not None

    verify = await client.post("/v1/auth/verify-phone", json={"phone": phone, "code": code})
    assert verify.status_code == 200, verify.text
    return verify.json()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
