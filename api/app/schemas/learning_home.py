"""'Mening yo'lim' — o'quvchi bosh sahifasi sxemalari (V2-3/B2)."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import TrajectoryOut


class ActiveEnrollmentItem(BaseModel):
    course_id: int
    course_title: str
    course_slug: str
    progress_pct: int


class NextLessonItem(BaseModel):
    course_slug: str
    course_title: str
    lesson_id: int
    lesson_title: str


class MentorNoteItem(BaseModel):
    mentor_name: str
    note: str
    created_at: datetime


class AssessmentResultItem(BaseModel):
    course_title: str
    verdict: str
    confirmed_at: datetime


class LearningHomeOut(BaseModel):
    trajectory: TrajectoryOut
    active_enrollments: list[ActiveEnrollmentItem]
    next_lesson: NextLessonItem | None
    latest_mentor_note: MentorNoteItem | None
    recent_assessment_results: list[AssessmentResultItem]
