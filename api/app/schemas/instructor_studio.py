"""Ustoz Studiyasi 2.0 sxemalari — o'quvchilar, statistika, xabar (V2-4/B5)."""

from datetime import datetime

from pydantic import BaseModel, Field


class StudentProgressItem(BaseModel):
    user_id: int
    full_name: str
    progress_pct: int
    status: str
    last_activity_at: datetime
    is_stuck: bool


class MessageStudentIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(default="", max_length=2000)


class CourseStatsOut(BaseModel):
    views_count: int
    students_count: int
    completion_rate_pct: int
    average_rating: float
    review_count: int
    most_dropped_lesson_title: str | None
    most_dropped_lesson_pct: int | None
    income_available: bool


class ImpactCertificateOut(BaseModel):
    pdf_url: str
    total_students_helped: int
    generated_at: datetime


# --- Dashboard (KENGAYISH_PLAN_3.md 1-bo'lim) ---
class InstructorStudentItem(BaseModel):
    user_id: int
    full_name: str
    course_id: int
    course_title: str
    progress_pct: int
    status: str
    last_activity_at: datetime
    is_stuck: bool


class InstructorSubmissionItem(BaseModel):
    id: int
    course_id: int
    course_title: str
    assignment_id: int
    assignment_title: str
    student_name: str
    student_username: str
    text: str
    file_url: str | None
    status: str
    feedback: str | None
    created_at: datetime


class InstructorReviewItem(BaseModel):
    id: int
    course_id: int
    course_title: str
    reviewer_name: str
    rating: int
    comment: str
    instructor_reply: str | None
    created_at: datetime


class InstructorDashboardOut(BaseModel):
    new_students_today: int
    ungraded_submissions_count: int
    average_rating: float | None
    oldest_ungraded: list[InstructorSubmissionItem]
    courses_count: int
    students_count: int
    new_students_this_month: int
    completion_rate_pct: int
    most_dropped_lesson_title: str | None
    most_dropped_lesson_pct: int | None
    free_completions_count: int
