"""B2B "Xizmatlar" (tez kunda) qiziqish - ochiq email ro'yxatga olish."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service_interest import ServiceInterestSignup


async def test_guest_can_register_interest(client: httpx.AsyncClient, db: AsyncSession) -> None:
    resp = await client.post("/v1/service-interest", json={"email": "ish@misol.uz"})
    assert resp.status_code == 204

    row = (
        await db.execute(
            select(ServiceInterestSignup).where(ServiceInterestSignup.email == "ish@misol.uz")
        )
    ).scalar_one()
    assert row.email == "ish@misol.uz"


async def test_duplicate_email_does_not_error(client: httpx.AsyncClient, db: AsyncSession) -> None:
    payload = {"email": "takror@misol.uz"}
    first = await client.post("/v1/service-interest", json=payload)
    second = await client.post("/v1/service-interest", json=payload)
    assert first.status_code == 204
    assert second.status_code == 204

    rows = (
        (
            await db.execute(
                select(ServiceInterestSignup).where(
                    ServiceInterestSignup.email == "takror@misol.uz"
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_invalid_email_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.post("/v1/service-interest", json={"email": "notanemail"})
    assert resp.status_code == 422
