"""Yakuniy baholash endpoint'lari — modul/kurs testlari, yakuniy imtihon, ustoz tasdig'i."""

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.assessment import service
from app.modules.auth.deps import get_current_user, require_roles
from app.schemas.assessment import (
    FinalAssessmentStatus,
    FinalExamBriefUpdate,
    FinalExamSubmissionOut,
    MentorReviewDecision,
    MentorReviewQueueItem,
    QuizAttemptResult,
    QuizAttemptStart,
    QuizAttemptSubmit,
    QuizCreate,
    QuizDetailForInstructor,
    QuizQuestionCreate,
    QuizQuestionOut,
    SkillsAssessmentOut,
)

router = APIRouter(tags=["assessment"])
_instructor = require_roles(RoleCode.INSTRUCTOR, RoleCode.ADMIN)


# ---------- Ustoz: quiz konstruktori ----------
@router.post("/modules/{module_id}/quiz", status_code=status.HTTP_201_CREATED)
async def create_module_quiz(
    module_id: int,
    data: QuizCreate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    quiz = await service.create_module_quiz(db, module_id, user, data)
    return {"id": quiz.id, "title": quiz.title}


@router.post("/courses/{course_id}/final-quiz", status_code=status.HTTP_201_CREATED)
async def create_final_quiz(
    course_id: int,
    data: QuizCreate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    quiz = await service.create_final_quiz(db, course_id, user, data)
    return {"id": quiz.id, "title": quiz.title}


@router.get("/quizzes/{quiz_id}", response_model=QuizDetailForInstructor)
async def quiz_detail(
    quiz_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> QuizDetailForInstructor:
    return await service.instructor_quiz_detail(db, quiz_id, user)


@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuizQuestionOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_question(
    quiz_id: int,
    data: QuizQuestionCreate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> QuizQuestionOut:
    question = await service.add_question(db, quiz_id, user, data)
    return QuizQuestionOut.model_validate(question)


@router.delete("/quiz-questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_question(db, question_id, user)


@router.patch("/courses/{course_id}/final-exam-brief")
async def update_final_exam_brief(
    course_id: int,
    data: FinalExamBriefUpdate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    course = await service.update_final_exam_brief(db, course_id, user, data.final_exam_brief)
    return {"course_id": course.id, "final_exam_brief": course.final_exam_brief}


# ---------- O'quvchi: test topshirish ----------
@router.post(
    "/quizzes/{quiz_id}/attempts",
    response_model=QuizAttemptStart,
    status_code=status.HTTP_201_CREATED,
)
async def start_attempt(
    quiz_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptStart:
    return await service.start_attempt(db, quiz_id, user)


@router.post("/quiz-attempts/{attempt_id}/submit", response_model=QuizAttemptResult)
async def submit_attempt(
    attempt_id: int,
    data: QuizAttemptSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptResult:
    return await service.submit_attempt(db, attempt_id, user, data.answers)


# ---------- O'quvchi: yakuniy amaliy imtihon ----------
@router.post(
    "/courses/{course_id}/final-exam-submission",
    response_model=FinalExamSubmissionOut,
    status_code=status.HTTP_201_CREATED,
)
async def submit_final_exam(
    course_id: int,
    text: str = Form(""),
    file: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FinalExamSubmissionOut:
    file_url: str | None = None
    if file is not None and file.filename:
        safe_name = storage.validate_upload(file, "attachment")
        storage.ensure_bucket()
        key = f"final-exam/{user.id}/{course_id}/{safe_name}"
        file_url = storage.upload_fileobj(file.file, key)
    return await service.submit_final_exam(db, user, course_id, text, file_url)


@router.get("/courses/{course_id}/final-status", response_model=FinalAssessmentStatus)
async def final_status(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FinalAssessmentStatus:
    return await service.get_final_status(db, user, course_id)


# ---------- Ustoz: baholashni ko'rib chiqish ----------
@router.get("/me/mentor/assessments", response_model=list[MentorReviewQueueItem])
async def mentor_review_queue(
    pending_only: bool = True,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> list[MentorReviewQueueItem]:
    return await service.mentor_review_queue(db, user, pending_only=pending_only)


@router.post("/assessments/{assessment_id}/confirm", response_model=SkillsAssessmentOut)
async def confirm_assessment(
    assessment_id: int,
    data: MentorReviewDecision,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> SkillsAssessmentOut:
    return await service.confirm_assessment(db, user, assessment_id, data.verdict, data.feedback)
