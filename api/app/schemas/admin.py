"""Admin panel sxemalari — foydalanuvchi boshqaruvi, audit jurnali."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RoleCode, UserStatus


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    email: str | None
    full_name: str
    username: str
    status: str
    created_at: datetime
    roles: list[str] = Field(default_factory=list)
    subscription_plan: str = "free"


class AdminUserPage(BaseModel):
    items: list[AdminUserOut]
    next_cursor: int | None


class AdminUserStats(BaseModel):
    total: int
    blocked: int


class UserStatusUpdate(BaseModel):
    status: UserStatus


class UserRoleUpdate(BaseModel):
    role: RoleCode


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: int
    actor_name: str
    action: str
    action_label: str
    target_type: str
    target_id: str
    target_name: str | None
    meta: dict[str, Any]
    created_at: datetime


class AuditLogPage(BaseModel):
    items: list[AuditLogOut]
    next_cursor: int | None


class AdminCourseOut(BaseModel):
    id: int
    title: str
    slug: str
    status: str
    instructor_name: str
    students_count: int


class AdminCoursePage(BaseModel):
    items: list[AdminCourseOut]
    next_cursor: int | None


class CourseModerateRequest(BaseModel):
    """Kurs moderatsiyasi qarori — moderation.ModerateRequest bilan bir xil shakl."""

    approve: bool
    reason: str | None = None


class AdminDisputeOut(BaseModel):
    id: int
    order_id: int
    order_title: str
    amount: int
    opened_by_name: str
    client_name: str
    freelancer_name: str
    reason: str
    status: str
    created_at: datetime


class AdminDisputePage(BaseModel):
    items: list[AdminDisputeOut]
    next_cursor: int | None


class AdminCompanyOut(BaseModel):
    id: int
    name: str
    inn: str | None
    employee_count: int | None
    verified: bool
    vacancies_count: int
    created_at: datetime


class AdminCompanyPage(BaseModel):
    items: list[AdminCompanyOut]
    next_cursor: int | None


class CompanyVerifyUpdate(BaseModel):
    verified: bool


class AdminInstructorOut(BaseModel):
    id: int
    full_name: str
    phone: str
    username: str
    status: str
    courses_count: int
    published_courses_count: int
    total_students: int
    average_rating: float
    generosity_tier: str | None


class AdminInstructorPage(BaseModel):
    items: list[AdminInstructorOut]
    next_cursor: int | None


class AdminInstructorCourseOut(BaseModel):
    id: int
    title: str
    slug: str
    status: str
    is_free: bool
    students_count: int
    views_count: int
    rating: float
    completion_rate_pct: int
    review_count: int


class AdminInstructorDetail(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str | None
    username: str
    status: str
    created_at: datetime
    generosity_tier: str | None
    courses: list[AdminInstructorCourseOut]
