"""Yakuniy baholash tizimi — nazariy test (Quiz), amaliy imtihon topshirig'i,
AI+Ustoz baholash duetining natijasi (SkillsAssessment). V2-3/B3.

`Quiz` ikkita rolda ishlatiladi (`kind` orqali farqlanadi, xuddi bitta jadval
ikki bog'lanish nuqtasi bilan): modul mini-testi (`module_id` to'ldirilgan) va
kurs darajasidagi yakuniy nazariy test (`course_id` to'ldirilgan). Aynan bittasi
to'ldirilishi xizmat qatlamida ta'minlanadi (CheckConstraint bilan qo'shimcha
himoyalangan).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    ARRAY,
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import AssessmentVerdict, QuizKind


class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = (
        UniqueConstraint("module_id", name="uq_quiz_module"),
        UniqueConstraint("course_id", name="uq_quiz_course"),
        CheckConstraint(
            "(module_id IS NOT NULL AND course_id IS NULL) OR "
            "(module_id IS NULL AND course_id IS NOT NULL)",
            name="ck_quiz_exactly_one_scope",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    kind: Mapped[str] = mapped_column(String(16), default=QuizKind.MODULE_CHECK, nullable=False)
    module_id: Mapped[int | None] = mapped_column(
        ForeignKey("course_modules.id", ondelete="CASCADE"), nullable=True
    )
    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    pass_score_pct: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    time_limit_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    questions: Mapped[list[QuizQuestion]] = relationship(
        back_populates="quiz",
        order_by="QuizQuestion.sort",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"), index=True, nullable=False
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    choices: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    # Savol og'irligi ("ball") — yakuniy natija endi savollar sonidan emas,
    # ball yig'indisidan hisoblanadi (Test konstruktori: savol turlari, ball,
    # vaqt — docs/design/README.md 2-bo'lim). Mavjud savollar uchun sukut 1 — eski
    # teng-og'irlik xulq-atvori o'zgarmaydi.
    points: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    quiz: Mapped[Quiz] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_ids: Mapped[list[int]] = mapped_column(ARRAY(Integer), nullable=False)
    answers: Mapped[list[int] | None] = mapped_column(ARRAY(Integer), nullable=True)
    score_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    expired: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FinalExamSubmission(Base):
    """Yakuniy amaliy imtihon-loyiha topshirig'i — foydalanuvchi+kurs uchun bitta yozuv,

    qayta topshirilsa ustidan yoziladi (GeneratedCv bilan bir xil naqsh).
    """

    __tablename__ = "final_exam_submissions"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_final_exam_submission"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SkillsAssessment(Base):
    """AI + Ustoz duetining yakuniy xulosasi — faqat mentor_verdict=READY bo'lsa

    Certificate.confirmed_at o'rnatiladi (Skills Passport'da "Tasdiqlangan" belgisi).
    """

    __tablename__ = "skills_assessments"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_skills_assessment"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    ai_score_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_readiness_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    ai_verdict: Mapped[str] = mapped_column(String(16), nullable=False)
    mentor_verdict: Mapped[str | None] = mapped_column(String(16), nullable=True)
    mentor_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    mentor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @property
    def final_verdict(self) -> str:
        return self.mentor_verdict or self.ai_verdict


__all__ = [
    "AssessmentVerdict",
    "FinalExamSubmission",
    "Quiz",
    "QuizAttempt",
    "QuizKind",
    "QuizQuestion",
    "SkillsAssessment",
]
