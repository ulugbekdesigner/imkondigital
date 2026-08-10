"""Ta'lim Akademiyasi modellari — kurslar, modullar, darslar, ro'yxatga olish."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import CourseStatus, EnrollmentStatus, LessonStatus, SubmissionStatus
from app.models.lesson_material import LessonMaterial


class CourseCategory(Base):
    __tablename__ = "course_categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    key: Mapped[str] = mapped_column(String(4), unique=True, nullable=False)  # A..H
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    ladder_step: Mapped[int] = mapped_column(Integer, nullable=False)  # 0..4
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("course_categories.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    ladder_step: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # so'm
    is_free: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    trailer_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    region_id: Mapped[int | None] = mapped_column(ForeignKey("regions.id"), nullable=True)
    duration_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default=CourseStatus.DRAFT, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    students_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    income_success_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    final_exam_brief: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    modules: Mapped[list[CourseModule]] = relationship(
        back_populates="course", order_by="CourseModule.sort", lazy="selectin"
    )


class CourseModule(Base):
    __tablename__ = "course_modules"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    course: Mapped[Course] = relationship(back_populates="modules")
    lessons: Mapped[list[Lesson]] = relationship(
        back_populates="module",
        order_by="Lesson.sort",
        lazy="selectin",
        passive_deletes=True,
    )
    assignments: Mapped[list[Assignment]] = relationship(
        back_populates="module",
        order_by="Assignment.sort",
        lazy="selectin",
        passive_deletes=True,
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    module_id: Mapped[int] = mapped_column(
        ForeignKey("course_modules.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    raw_video_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hls_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hls_key_hex: Mapped[str | None] = mapped_column(String(32), nullable=True)
    subtitle_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Edge-TTS orqali `transcript`dan generatsiya qilingan ovoz fayli — bir marta
    # yasalib keshlanadi (voice_tts bayrogʻi ortida, "O'qib ber" tugmasi uchun).
    audio_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # soniya
    status: Mapped[str] = mapped_column(String(16), default=LessonStatus.DRAFT, nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    module: Mapped[CourseModule] = relationship(back_populates="lessons")
    materials: Mapped[list[LessonMaterial]] = relationship(
        order_by="LessonMaterial.created_at",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    module_id: Mapped[int] = mapped_column(
        ForeignKey("course_modules.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    module: Mapped[CourseModule] = relationship(back_populates="assignments")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), default=SubmissionStatus.SUBMITTED, nullable=False
    )
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_enrollment"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    progress_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default=EnrollmentStatus.ACTIVE, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    completions: Mapped[list[LessonCompletion]] = relationship(
        back_populates="enrollment", lazy="selectin", cascade="all, delete-orphan"
    )


class LessonCompletion(Base):
    __tablename__ = "lesson_completions"
    __table_args__ = (UniqueConstraint("enrollment_id", "lesson_id", name="uq_lesson_completion"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    enrollment_id: Mapped[int] = mapped_column(
        ForeignKey("enrollments.id", ondelete="CASCADE"), index=True, nullable=False
    )
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    enrollment: Mapped[Enrollment] = relationship(back_populates="completions")
