"""Foydalanuvchining Raqamli Narvon pog'onasi — eng yuqori TUGATILGAN kurs
ladder_step'i. Employer (nomzod moslik), donor (ariza boyitish) va users
(profil) modullari orasida markazlashtirilgan — avval har birida alohida
deyarli bir xil nusxa edi."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, Enrollment
from app.models.enums import EnrollmentStatus


async def user_max_ladder_step(db: AsyncSession, user_id: int) -> int:
    result = (
        await db.execute(
            select(func.max(Course.ladder_step))
            .select_from(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Enrollment.user_id == user_id, Enrollment.status == EnrollmentStatus.COMPLETED)
        )
    ).scalar_one_or_none()
    return result if result is not None else 0


async def ladder_steps_map(db: AsyncSession, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    rows = (
        await db.execute(
            select(Enrollment.user_id, func.max(Course.ladder_step))
            .select_from(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .where(
                Enrollment.user_id.in_(user_ids), Enrollment.status == EnrollmentStatus.COMPLETED
            )
            .group_by(Enrollment.user_id)
        )
    ).all()
    return {row[0]: row[1] for row in rows}
