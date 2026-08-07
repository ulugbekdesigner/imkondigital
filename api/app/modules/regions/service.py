"""Hudud sahifalari biznes logikasi — KENGAYISH_PLAN_3.md 8-bo'lim.

Faqat HAQIQIY, jonli hisoblanadigan statistika (vakansiya/imtiyoz/foydalanuvchi/
ishga joylashganlar soni) — "mahalliy jamoa/koordinator" (5-bo'lim, B2B) hali
qurilmagani uchun ATAYLAB ko'rsatilmaydi (CONTRIBUTING.md 2-qoida: placeholder yo'q).
"""

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.benefits import Benefit
from app.models.employer import Application, Placement, Vacancy
from app.models.enums import BenefitStatus, VacancyStatus
from app.models.user import Region, User
from app.modules.employer import service as employer_service
from app.schemas.region import RegionCard, RegionDetail, RegionOut, RegionStats


async def list_regions(db: AsyncSession) -> list[RegionOut]:
    rows = (await db.execute(select(Region).order_by(Region.name))).scalars().all()
    return [RegionOut(id=r.id, name=r.name, slug=r.slug) for r in rows]


async def _universal_benefit_count(db: AsyncSession) -> int:
    return (
        await db.execute(
            select(func.count(Benefit.id)).where(
                Benefit.status == BenefitStatus.PUBLISHED, Benefit.region_id.is_(None)
            )
        )
    ).scalar_one()


async def _vacancy_counts_by_region(db: AsyncSession) -> dict[int, int]:
    rows = (
        await db.execute(
            select(Vacancy.region_id, func.count(Vacancy.id))
            .where(Vacancy.status == VacancyStatus.PUBLISHED, Vacancy.region_id.is_not(None))
            .group_by(Vacancy.region_id)
        )
    ).all()
    return {r[0]: r[1] for r in rows}


async def _benefit_counts_by_region(db: AsyncSession) -> dict[int, int]:
    rows = (
        await db.execute(
            select(Benefit.region_id, func.count(Benefit.id))
            .where(Benefit.status == BenefitStatus.PUBLISHED, Benefit.region_id.is_not(None))
            .group_by(Benefit.region_id)
        )
    ).all()
    return {r[0]: r[1] for r in rows}


async def _user_counts_by_region(db: AsyncSession) -> dict[int, int]:
    rows = (
        await db.execute(
            select(User.region_id, func.count(User.id))
            .where(User.region_id.is_not(None))
            .group_by(User.region_id)
        )
    ).all()
    return {r[0]: r[1] for r in rows}


async def _placement_counts_by_region(db: AsyncSession) -> dict[int, int]:
    """Nomzod ishga joylashgan — o'z uy hududi bo'yicha (ish beruvchi hududi emas,
    masofadan ishlash ham hisobga kirishi uchun)."""
    rows = (
        await db.execute(
            select(User.region_id, func.count(Placement.id))
            .select_from(Placement)
            .join(Application, Application.id == Placement.application_id)
            .join(User, User.id == Application.user_id)
            .where(User.region_id.is_not(None))
            .group_by(User.region_id)
        )
    ).all()
    return {r[0]: r[1] for r in rows}


async def list_regions_with_stats(db: AsyncSession) -> list[RegionCard]:
    regions = (await db.execute(select(Region).order_by(Region.name))).scalars().all()

    vacancy_counts = await _vacancy_counts_by_region(db)
    benefit_counts = await _benefit_counts_by_region(db)
    user_counts = await _user_counts_by_region(db)
    placement_counts = await _placement_counts_by_region(db)
    universal_benefits = await _universal_benefit_count(db)

    return [
        RegionCard(
            id=r.id,
            name=r.name,
            slug=r.slug,
            stats=RegionStats(
                open_vacancies=vacancy_counts.get(r.id, 0),
                published_benefits=benefit_counts.get(r.id, 0) + universal_benefits,
                registered_users=user_counts.get(r.id, 0),
                placed_count=placement_counts.get(r.id, 0),
            ),
        )
        for r in regions
    ]


async def get_region_detail(db: AsyncSession, slug: str) -> RegionDetail:
    region = (
        await db.execute(select(Region).where(Region.slug == slug))
    ).scalar_one_or_none()
    if region is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hudud topilmadi")

    open_vacancies = (
        await db.execute(
            select(func.count(Vacancy.id)).where(
                Vacancy.status == VacancyStatus.PUBLISHED, Vacancy.region_id == region.id
            )
        )
    ).scalar_one()
    region_benefits = (
        await db.execute(
            select(func.count(Benefit.id)).where(
                Benefit.status == BenefitStatus.PUBLISHED, Benefit.region_id == region.id
            )
        )
    ).scalar_one()
    universal_benefits = await _universal_benefit_count(db)
    registered_users = (
        await db.execute(select(func.count(User.id)).where(User.region_id == region.id))
    ).scalar_one()
    placed_count = (
        await db.execute(
            select(func.count(Placement.id))
            .select_from(Placement)
            .join(Application, Application.id == Placement.application_id)
            .join(User, User.id == Application.user_id)
            .where(User.region_id == region.id)
        )
    ).scalar_one()

    vacancy_page = await employer_service.catalog(
        db,
        step=None,
        work_format=None,
        region_id=region.id,
        min_salary=None,
        q=None,
        cursor=None,
        limit=6,
        viewer=None,
    )

    return RegionDetail(
        id=region.id,
        name=region.name,
        slug=region.slug,
        stats=RegionStats(
            open_vacancies=open_vacancies,
            published_benefits=region_benefits + universal_benefits,
            registered_users=registered_users,
            placed_count=placed_count,
        ),
        vacancies_preview=vacancy_page.items,
    )
