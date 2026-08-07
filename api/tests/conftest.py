"""Pytest fixtures — test DB, izolyatsiya va HTTP mijoz."""

import os
from collections.abc import AsyncGenerator

import httpx
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.db import Base, get_db
from app.main import app
from app.models.course import CourseCategory
from app.models.enums import RoleCode
from app.models.user import Region, Role
from app.modules.ai.router import _limit_ziyo
from app.modules.auth.router import _limit_login, _limit_register, _limit_verify

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://imkon:imkon@localhost:5433/imkon_test",
)

# NullPool — ulanishlar qayta ishlatilmaydi, shuning uchun event-loop'lararo
# konflikt bo'lmaydi (pytest har testda alohida loop yaratadi).
_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
_Session = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)

# Har testdan keyin tozalanadigan jadvallar (roles/regions/categories seed saqlanadi)
_MUTABLE_TABLES = (
    "audit_log",
    "external_jobs",
    "support_contents",
    "support_resources",
    "success_stories",
    "course_reviews",
    "study_buddy_messages",
    "skills_assessments",
    "final_exam_submissions",
    "quiz_attempts",
    "quiz_questions",
    "quizzes",
    "donations",
    "donation_projects",
    "program_enrollments",
    "donor_programs",
    "mentor_checkins",
    "mentorships",
    "interview_messages",
    "interview_sessions",
    "generated_cvs",
    "career_coach_messages",
    "ai_usage",
    "user_benefits",
    "benefits",
    "notifications",
    "telegram_link_codes",
    "telegram_links",
    "disputes",
    "reviews",
    "order_messages",
    "order_milestones",
    "payments",
    "orders",
    "gigs",
    "placements",
    "applications",
    "vacancies",
    "company_members",
    "companies",
    "portfolio_items",
    "lesson_completions",
    "submissions",
    "enrollments",
    "lessons",
    "assignments",
    "course_modules",
    "courses",
    "certificates",
    "user_roles",
    "refresh_tokens",
    "phone_verifications",
    "disability_profiles",
    "users",
)


@pytest_asyncio.fixture(scope="session", loop_scope="session", autouse=True)
async def _schema() -> AsyncGenerator[None, None]:
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    # Rollar, hududlar va kategoriyalarni seed qilamiz (migratsiya seedi ekvivalenti)
    async with _Session() as session:
        session.add_all([Role(code=c.value) for c in RoleCode])
        session.add_all(
            [
                Region(name="Toshkent shahri", slug="toshkent-shahri"),
                Region(name="Andijon viloyati", slug="andijon-viloyati"),
            ]
        )
        session.add_all(
            [
                CourseCategory(key=k, name=n, ladder_step=s, sort=i)
                for i, (k, n, s) in enumerate(
                    [("E", "Ofis va masofaviy ishlar", 1), ("G", "IT", 3)], start=1
                )
            ]
        )
        await session.commit()
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def _clean() -> AsyncGenerator[None, None]:
    yield
    async with _engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {', '.join(_MUTABLE_TABLES)} RESTART IDENTITY CASCADE"))


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with _Session() as session:
        yield session


async def _noop_rate_limit() -> None:
    return None


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[httpx.AsyncClient, None]:
    async def _get_db() -> AsyncGenerator[AsyncSession, None]:
        async with _Session() as session:
            yield session

    app.dependency_overrides[get_db] = _get_db
    # Testlar bir xil "IP"dan (ASGITransport) ko'plab register/login qiladi —
    # rate-limit'ni bu yerda o'chiramiz; haqiqiy 429 sinovi test_rate_limit.py'da.
    app.dependency_overrides[_limit_register] = _noop_rate_limit
    app.dependency_overrides[_limit_login] = _noop_rate_limit
    app.dependency_overrides[_limit_verify] = _noop_rate_limit
    app.dependency_overrides[_limit_ziyo] = _noop_rate_limit
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
