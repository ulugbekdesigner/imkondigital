"""Jonli darslar endpoint'lari — /v1/courses/{id}/live-lessons, /v1/instructor/live-lessons."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import require_roles
from app.modules.live_lessons import service
from app.schemas.live_lesson import LiveLessonIn, LiveLessonOut

router = APIRouter(tags=["live-lessons"])
_instructor = require_roles(RoleCode.INSTRUCTOR, RoleCode.ADMIN)


@router.get("/courses/{course_id}/live-lessons", response_model=list[LiveLessonOut])
async def list_course_live_lessons(
    course_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[LiveLessonOut]:
    return await service.list_course_live_lessons(db, course_id)


@router.post("/courses/{course_id}/live-lessons", response_model=LiveLessonOut, status_code=201)
async def schedule_live_lesson(
    course_id: int,
    data: LiveLessonIn,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> LiveLessonOut:
    return await service.schedule_live_lesson(db, course_id, user, data)


@router.delete("/live-lessons/{lesson_id}", status_code=204)
async def delete_live_lesson(
    lesson_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_live_lesson(db, lesson_id, user)


@router.get("/instructor/live-lessons", response_model=list[LiveLessonOut])
async def instructor_live_lessons(
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> list[LiveLessonOut]:
    return await service.list_instructor_live_lessons(db, user)
