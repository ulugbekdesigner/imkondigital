"""Ustoz Studiyasi endpoint'lari."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import require_roles
from app.modules.instructor_studio import service
from app.schemas.instructor_studio import (
    CourseStatsOut,
    ImpactCertificateOut,
    InstructorDashboardOut,
    InstructorReviewItem,
    InstructorStudentItem,
    InstructorSubmissionItem,
    MessageStudentIn,
    StudentProgressItem,
)

router = APIRouter(tags=["instructor-studio"])
_instructor = require_roles(RoleCode.INSTRUCTOR, RoleCode.ADMIN)


@router.get("/courses/{course_id}/students", response_model=list[StudentProgressItem])
async def list_students(
    course_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> list[StudentProgressItem]:
    return await service.list_students(db, course_id, user)


@router.post("/courses/{course_id}/students/{student_id}/message", status_code=204)
async def message_student(
    course_id: int,
    student_id: int,
    data: MessageStudentIn,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.message_student(db, course_id, student_id, user, data.title, data.body)


@router.get("/courses/{course_id}/stats", response_model=CourseStatsOut)
async def course_stats(
    course_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> CourseStatsOut:
    return await service.get_course_stats(db, course_id, user)


@router.post("/me/impact-certificate", response_model=ImpactCertificateOut)
async def impact_certificate(
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> ImpactCertificateOut:
    return await service.generate_impact_certificate(db, user)


@router.get("/instructor/dashboard", response_model=InstructorDashboardOut)
async def instructor_dashboard(
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> InstructorDashboardOut:
    return await service.get_instructor_dashboard(db, user)


@router.get("/instructor/students", response_model=list[InstructorStudentItem])
async def instructor_students(
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> list[InstructorStudentItem]:
    return await service.list_instructor_students(db, user)


@router.get("/instructor/submissions", response_model=list[InstructorSubmissionItem])
async def instructor_submissions(
    status_filter: str | None = None,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> list[InstructorSubmissionItem]:
    return await service.list_instructor_submissions(db, user, status_filter=status_filter)


@router.get("/instructor/reviews", response_model=list[InstructorReviewItem])
async def instructor_reviews(
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> list[InstructorReviewItem]:
    return await service.list_instructor_reviews(db, user)
