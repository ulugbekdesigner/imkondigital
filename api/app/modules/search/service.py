"""Global qidiruv biznes logikasi — kurs+vakansiya+material+imtiyoz.

Ko'rinish qoidasi materiallar uchun `courses/service.py::course_detail`dagi
`reveal` mantig'i bilan BIR XIL: bepul kurs YOKI ro'yxatdan o'tgan kursning
materiallari qidiruvda ko'rinadi, aks holda yo'q (yangi ochiq yo'l yaratilmaydi).
"""

from sqlalchemy import ColumnElement, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ladder import user_max_ladder_step
from app.core.match_score import compute_match_score
from app.models.benefits import Benefit
from app.models.course import Course, CourseModule, Enrollment, Lesson
from app.models.employer import Company, Vacancy
from app.models.enums import BenefitStatus, CourseStatus, VacancyStatus
from app.models.lesson_material import LessonMaterial
from app.models.user import User
from app.schemas.search import BenefitHit, CourseHit, MaterialHit, SearchResults, VacancyHit

_LIMIT = 6


def _vacancy_match_score(vacancy: Vacancy, viewer: User, user_max_step: int) -> int:
    profile = viewer.disability_profile
    remote_only = bool(profile.work_conditions.get("remote_only", False)) if profile else False
    return compute_match_score(
        vacancy_ladder_step=vacancy.ladder_step,
        user_max_ladder_step=user_max_step,
        work_format=vacancy.work_format,
        user_remote_only=remote_only,
        vacancy_region_id=vacancy.region_id,
        user_region_id=viewer.region_id,
        has_accommodations=bool(vacancy.accommodations),
    )


async def global_search(db: AsyncSession, viewer: User | None, q: str) -> SearchResults:
    pattern = f"%{q}%"

    course_rows = (
        await db.execute(
            select(Course.id, Course.title, Course.slug, Course.is_free, Course.ladder_step)
            .where(Course.status == CourseStatus.PUBLISHED, Course.title.ilike(pattern))
            .order_by(Course.students_count.desc())
            .limit(_LIMIT)
        )
    ).all()
    courses = [
        CourseHit(id=cid, title=title, slug=slug, is_free=is_free, ladder_step=ladder_step)
        for cid, title, slug, is_free, ladder_step in course_rows
    ]

    vacancy_rows = (
        await db.execute(
            select(Vacancy, Company.name)
            .join(Company, Company.id == Vacancy.company_id)
            .where(Vacancy.status == VacancyStatus.PUBLISHED, Vacancy.title.ilike(pattern))
            .order_by(Vacancy.id.desc())
            .limit(_LIMIT)
        )
    ).all()
    user_max_step = await user_max_ladder_step(db, viewer.id) if viewer is not None else 0
    vacancies = [
        VacancyHit(
            id=vacancy.id,
            title=vacancy.title,
            company_name=company_name,
            match_score=(
                _vacancy_match_score(vacancy, viewer, user_max_step) if viewer is not None else None
            ),
        )
        for vacancy, company_name in vacancy_rows
    ]

    benefit_rows = (
        await db.execute(
            select(Benefit.id, Benefit.title)
            .where(Benefit.status == BenefitStatus.PUBLISHED, Benefit.title.ilike(pattern))
            .order_by(Benefit.created_at.desc())
            .limit(_LIMIT)
        )
    ).all()
    benefits = [BenefitHit(id=bid, title=title) for bid, title in benefit_rows]

    materials = await _search_materials(db, viewer, pattern)

    return SearchResults(
        query=q, courses=courses, vacancies=vacancies, benefits=benefits, materials=materials
    )


async def _search_materials(
    db: AsyncSession, viewer: User | None, pattern: str
) -> list[MaterialHit]:
    visibility: ColumnElement[bool] = Course.is_free.is_(True)
    if viewer is not None:
        enrolled_ids = select(Enrollment.course_id).where(Enrollment.user_id == viewer.id)
        visibility = visibility | Course.id.in_(enrolled_ids)

    rows = (
        await db.execute(
            select(LessonMaterial.id, LessonMaterial.title, Course.slug, Course.title)
            .join(Lesson, Lesson.id == LessonMaterial.lesson_id)
            .join(CourseModule, CourseModule.id == Lesson.module_id)
            .join(Course, Course.id == CourseModule.course_id)
            .where(
                Course.status == CourseStatus.PUBLISHED,
                LessonMaterial.title.ilike(pattern),
                visibility,
            )
            .order_by(LessonMaterial.id.desc())
            .limit(_LIMIT)
        )
    ).all()
    return [
        MaterialHit(id=mid, title=title, course_slug=course_slug, course_title=course_title)
        for mid, title, course_slug, course_title in rows
    ]
