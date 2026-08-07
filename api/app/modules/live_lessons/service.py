"""Jonli darslar biznes logikasi."""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.enums import RoleCode
from app.models.live_lesson import LiveLesson
from app.models.user import User
from app.schemas.live_lesson import LiveLessonIn, LiveLessonOut


def _is_admin(user: User) -> bool:
    return any(r.code == RoleCode.ADMIN for r in user.roles)


async def _owned_course(db: AsyncSession, course_id: int, user: User) -> Course:
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    if course.instructor_id != user.id and not _is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu kurs sizniki emas")
    return course


def _to_out(lesson: LiveLesson, course_title: str) -> LiveLessonOut:
    return LiveLessonOut(
        id=lesson.id,
        course_id=lesson.course_id,
        course_title=course_title,
        title=lesson.title,
        description=lesson.description,
        scheduled_at=lesson.scheduled_at,
        meeting_url=lesson.meeting_url,
        is_past=lesson.scheduled_at < datetime.now(UTC),
        created_at=lesson.created_at,
    )


async def schedule_live_lesson(
    db: AsyncSession, course_id: int, user: User, data: LiveLessonIn
) -> LiveLessonOut:
    course = await _owned_course(db, course_id, user)
    lesson = LiveLesson(
        course_id=course_id,
        title=data.title,
        description=data.description,
        scheduled_at=data.scheduled_at,
        meeting_url=data.meeting_url,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return _to_out(lesson, course.title)


async def delete_live_lesson(db: AsyncSession, lesson_id: int, user: User) -> None:
    lesson = await db.get(LiveLesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jonli dars topilmadi")
    await _owned_course(db, lesson.course_id, user)
    await db.delete(lesson)
    await db.commit()


async def list_course_live_lessons(db: AsyncSession, course_id: int) -> list[LiveLessonOut]:
    """Kurs sahifasida ko'rinadigan ro'yxat — enrollmentdan qat'i nazar, ochiq."""
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    rows = (
        await db.execute(
            select(LiveLesson)
            .where(LiveLesson.course_id == course_id)
            .order_by(LiveLesson.scheduled_at.asc())
        )
    ).scalars().all()
    return [_to_out(lesson, course.title) for lesson in rows]


async def list_instructor_live_lessons(db: AsyncSession, user: User) -> list[LiveLessonOut]:
    """Ustozning BARCHA kurslari bo'yicha jonli darslar — kelayotgani yuqorida."""
    rows = (
        await db.execute(
            select(LiveLesson, Course.title)
            .join(Course, Course.id == LiveLesson.course_id)
            .where(Course.instructor_id == user.id)
            .order_by(LiveLesson.scheduled_at.asc())
        )
    ).all()
    return [_to_out(lesson, course_title) for lesson, course_title in rows]
