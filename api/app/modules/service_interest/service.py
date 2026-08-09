"""B2B "Xizmatlar" qiziqish - email saqlash (idempotent, dublikat xato bermaydi)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service_interest import ServiceInterestSignup


async def register_interest(db: AsyncSession, email: str) -> None:
    existing = (
        await db.execute(
            select(ServiceInterestSignup).where(ServiceInterestSignup.email == email)
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(ServiceInterestSignup(email=email))
        await db.commit()
