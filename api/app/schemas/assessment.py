"""Yakuniy baholash sxemalari — Quiz (modul mini-test + yakuniy nazariy test),
QuizAttempt, FinalExamSubmission, SkillsAssessment (AI+Ustoz duet natijasi)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# --- Ustoz: quiz/savol yaratish ---
class QuizCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    pass_score_pct: int = Field(default=70, ge=1, le=100)
    time_limit_seconds: int | None = Field(default=None, ge=30)


class QuizQuestionCreate(BaseModel):
    prompt: str = Field(min_length=2, max_length=2000)
    choices: list[str] = Field(min_length=2, max_length=6)
    correct_index: int = Field(ge=0)
    # Savol og'irligi — yakuniy foiz endi ball yig'indisidan hisoblanadi.
    points: int = Field(default=1, ge=1, le=100)
    sort: int = 0


# --- O'quvchi uchun ochiq shakl (to'g'ri javobsiz) ---
class QuizQuestionPublic(BaseModel):
    id: int
    prompt: str
    choices: list[str]


class QuizPublic(BaseModel):
    id: int
    kind: str
    title: str
    pass_score_pct: int
    time_limit_seconds: int | None
    question_count: int


# --- Ustoz konstruktori uchun — to'g'ri javob ko'rinadi ---
class QuizQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    prompt: str
    choices: list[str]
    correct_index: int
    points: int
    sort: int


class QuizDetailForInstructor(QuizPublic):
    questions: list[QuizQuestionOut]


# --- Urinish (attempt) ---
class QuizAttemptStart(BaseModel):
    attempt_id: int
    quiz_id: int
    pass_score_pct: int
    time_limit_seconds: int | None
    started_at: datetime
    questions: list[QuizQuestionPublic]


class QuizAttemptSubmit(BaseModel):
    answers: list[int]


class QuizAttemptResult(BaseModel):
    attempt_id: int
    score_pct: int
    passed: bool
    expired: bool
    pass_score_pct: int
    # O'tmaganda — shu modulning darslarini qayta ko'rish tavsiyasi (mastery qoidasi)
    review_lesson_titles: list[str] = Field(default_factory=list)


# --- Yakuniy amaliy imtihon ---
class FinalExamBriefUpdate(BaseModel):
    final_exam_brief: str = Field(min_length=10, max_length=4000)


class FinalExamSubmissionIn(BaseModel):
    text: str = Field(default="", max_length=8000)


class FinalExamSubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    text: str
    file_url: str | None
    submitted_at: datetime


# --- AI + Ustoz duet natijasi ---
class SkillsAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    ai_score_pct: int
    ai_readiness_pct: int
    ai_feedback: str
    ai_verdict: str
    mentor_verdict: str | None
    mentor_feedback: str | None
    confirmed_at: datetime | None
    created_at: datetime


class MentorReviewQueueItem(BaseModel):
    assessment: SkillsAssessmentOut
    course_title: str
    student_name: str
    student_id: int


class MentorReviewDecision(BaseModel):
    verdict: str
    feedback: str = Field(min_length=1, max_length=2000)


class FinalAssessmentStatus(BaseModel):
    final_quiz_passed: bool
    submission: FinalExamSubmissionOut | None
    assessment: SkillsAssessmentOut | None
