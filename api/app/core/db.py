"""SQLAlchemy 2 — async engine, sessiya va deklarativ Base."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=settings.debug, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    """Barcha modellar shu Base'dan meros oladi (Alembic autogenerate uchun)."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — so'rov davomiyligidagi DB sessiyasi."""
    async with SessionLocal() as session:
        yield session
