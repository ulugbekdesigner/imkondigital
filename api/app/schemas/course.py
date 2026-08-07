"""Ta'lim Akademiyasi sxemalari."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.assessment import QuizPublic


# --- Ustoz (yaratish) ---
class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    category_id: int | None = None
    ladder_step: int = Field(default=1, ge=0, le=4)
    price: int = Field(default=0, ge=0)
    is_free: bool = True
    region_id: int | None = None
    duration_weeks: int | None = Field(default=None, ge=1, le=104)


class ModuleCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    sort: int = 0


class ModuleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    sort: int | None = None


class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = ""
    sort: int = 0


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    sort: int | None = None


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = ""
    sort: int = 0


# --- Chiqish ---
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    key: str
    name: str
    ladder_step: int


class LessonMaterialOut(BaseModel):
    id: int
    title: str
    file_url: str


class LessonOut(BaseModel):
    id: int
    title: str
    description: str
    hls_url: str | None
    subtitle_url: str | None
    transcript: str | None
    duration: int | None
    status: str
    sort: int
    materials: list[LessonMaterialOut] = Field(default_factory=list)


class AssignmentOut(BaseModel):
    id: int
    title: str
    description: str
    sort: int


class ModuleOut(BaseModel):
    id: int
    title: str
    sort: int
    lessons: list[LessonOut]
    assignments: list[AssignmentOut]
    quiz: QuizPublic | None = None


class CourseCard(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    ladder_step: int
    is_free: bool
    price: int
    cover_url: str | None
    status: str
    rating: float
    students_count: int
    income_success_rate: float | None
    lessons_count: int
    region_id: int | None
    region_name: str | None
    duration_weeks: int | None


class CourseDetail(CourseCard):
    trailer_url: str | None
    instructor_name: str
    final_exam_brief: str | None
    final_quiz: QuizPublic | None = None
    modules: list[ModuleOut]


class CatalogPage(BaseModel):
    items: list[CourseCard]
    next_cursor: int | None


# --- Ro'yxatga olish / progress ---
class EnrollmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    progress_pct: int
    status: str
    started_at: datetime
    completed_at: datetime | None


class MyEnrollment(BaseModel):
    enrollment: EnrollmentOut
    course_title: str
    course_slug: str


class LessonCompleteOut(BaseModel):
    lesson_id: int
    progress_pct: int
    course_completed: bool
    certificate_uid: str | None = None


# --- Submission ---
class SubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assignment_id: int
    text: str
    file_url: str | None
    status: str
    feedback: str | None
    created_at: datetime


class MySubmissionOut(BaseModel):
    id: int
    assignment_id: int
    assignment_title: str
    course_id: int
    course_title: str
    course_slug: str
    text: str
    file_url: str | None
    status: str
    feedback: str | None
    created_at: datetime


class SubmissionReview(BaseModel):
    approve: bool
    feedback: str = ""


# --- Kurs galereyasi (o'quvchilar ishlari) ---
class CourseGalleryItem(BaseModel):
    id: int
    title: str
    description: str
    media_urls: list[str]
    student_name: str
    student_username: str
    created_at: datetime
