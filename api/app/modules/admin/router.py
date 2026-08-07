"""Admin panel endpoint'lari — /v1/admin/* (faqat admin, ba'zilari moderator ham)."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.admin import service
from app.modules.auth.deps import require_roles
from app.schemas.admin import (
    AdminCompanyOut,
    AdminCompanyPage,
    AdminCourseOut,
    AdminCoursePage,
    AdminDisputePage,
    AdminInstructorDetail,
    AdminInstructorPage,
    AdminUserOut,
    AdminUserPage,
    AdminUserStats,
    AuditLogPage,
    CompanyVerifyUpdate,
    CourseModerateRequest,
    UserRoleUpdate,
    UserStatusUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_admin = require_roles(RoleCode.ADMIN)
_admin_or_moderator = require_roles(RoleCode.ADMIN, RoleCode.MODERATOR)


@router.get("/users", response_model=AdminUserPage)
async def list_users(
    cursor: int | None = None,
    limit: int = 20,
    search: str | None = None,
    role: RoleCode | None = None,
    user_status: str | None = None,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserPage:
    return await service.list_users(
        db, cursor=cursor, limit=min(limit, 100), search=search, role=role, user_status=user_status
    )


@router.get("/users/stats", response_model=AdminUserStats)
async def user_stats(
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserStats:
    return await service.get_user_stats(db)


@router.get("/users/export")
async def export_users(
    search: str | None = None,
    role: RoleCode | None = None,
    user_status: str | None = None,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    csv_text = await service.export_users_csv(db, search=search, role=role, user_status=user_status)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=foydalanuvchilar.csv"},
    )


@router.patch("/users/{user_id}/status", response_model=AdminUserOut)
async def set_user_status(
    user_id: int,
    data: UserStatusUpdate,
    admin: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserOut:
    return await service.set_user_status(db, admin, user_id, data.status.value)


@router.post("/users/{user_id}/roles", response_model=AdminUserOut)
async def assign_role(
    user_id: int,
    data: UserRoleUpdate,
    admin: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserOut:
    return await service.assign_role(db, admin, user_id, data.role)


@router.delete("/users/{user_id}/roles/{role}", response_model=AdminUserOut)
async def revoke_role(
    user_id: int,
    role: RoleCode,
    admin: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserOut:
    return await service.revoke_role(db, admin, user_id, role)


@router.get("/audit-log", response_model=AuditLogPage)
async def audit_log(
    cursor: int | None = None,
    limit: int = 30,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AuditLogPage:
    return await service.list_audit_log(db, cursor=cursor, limit=min(limit, 100))


@router.get("/audit-log/export")
async def export_audit_log(
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    csv_text = await service.export_audit_log_csv(db)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit-jurnali.csv"},
    )


@router.get("/courses", response_model=AdminCoursePage)
async def courses_for_moderation(
    cursor: int | None = None,
    limit: int = 20,
    _mod: User = Depends(_admin_or_moderator),
    db: AsyncSession = Depends(get_db),
) -> AdminCoursePage:
    return await service.list_courses_for_moderation(db, cursor=cursor, limit=min(limit, 100))


@router.post("/courses/{course_id}/archive", response_model=AdminCourseOut)
async def archive_course(
    course_id: int,
    moderator: User = Depends(_admin_or_moderator),
    db: AsyncSession = Depends(get_db),
) -> AdminCourseOut:
    return await service.archive_course(db, moderator, course_id)


@router.get("/courses/pending", response_model=AdminCoursePage)
async def pending_courses(
    cursor: int | None = None,
    limit: int = 20,
    _mod: User = Depends(_admin_or_moderator),
    db: AsyncSession = Depends(get_db),
) -> AdminCoursePage:
    return await service.list_pending_courses(db, cursor=cursor, limit=min(limit, 100))


@router.post("/courses/{course_id}/decision", response_model=AdminCourseOut)
async def decide_course(
    course_id: int,
    data: CourseModerateRequest,
    moderator: User = Depends(_admin_or_moderator),
    db: AsyncSession = Depends(get_db),
) -> AdminCourseOut:
    return await service.decide_course(db, moderator, course_id, data.approve, data.reason)


@router.get("/disputes", response_model=AdminDisputePage)
async def open_disputes(
    cursor: int | None = None,
    limit: int = 20,
    _mod: User = Depends(_admin_or_moderator),
    db: AsyncSession = Depends(get_db),
) -> AdminDisputePage:
    return await service.list_open_disputes(db, cursor=cursor, limit=min(limit, 100))


@router.get("/instructors", response_model=AdminInstructorPage)
async def list_instructors(
    cursor: int | None = None,
    limit: int = 20,
    search: str | None = None,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminInstructorPage:
    return await service.list_instructors(db, cursor=cursor, limit=min(limit, 100), search=search)


@router.get("/instructors/{instructor_id}", response_model=AdminInstructorDetail)
async def instructor_detail(
    instructor_id: int,
    admin: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminInstructorDetail:
    return await service.get_instructor_detail(db, admin, instructor_id)


@router.get("/companies", response_model=AdminCompanyPage)
async def list_companies(
    cursor: int | None = None,
    limit: int = 20,
    verified: bool | None = None,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminCompanyPage:
    return await service.list_companies(db, cursor=cursor, limit=min(limit, 100), verified=verified)


@router.patch("/companies/{company_id}/verify", response_model=AdminCompanyOut)
async def set_company_verified(
    company_id: int,
    data: CompanyVerifyUpdate,
    admin: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminCompanyOut:
    return await service.set_company_verified(db, admin, company_id, data.verified)
