"""Yakuniy baholash biznes logikasi."""

import random
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_quota import check_and_increment_quota
from app.models.assessment import (
    FinalExamSubmission,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    SkillsAssessment,
)
from app.models.certificate import Certificate
from app.models.course import Course, CourseModule, Enrollment
from app.models.enums import (
    AiFeature,
    AssessmentVerdict,
    NotificationCategory,
    NotificationType,
    QuizKind,
    RoleCode,
)
from app.models.user import User
from app.modules.ai import exam_grader
from app.modules.notifications.service import create_notification
from app.modules.streak import service as streak_service
from app.schemas.assessment import (
    FinalAssessmentStatus,
    FinalExamSubmissionOut,
    MentorReviewQueueItem,
    QuizAttemptResult,
    QuizAttemptStart,
    QuizCreate,
    QuizDetailForInstructor,
    QuizQuestionCreate,
    QuizQuestionOut,
    QuizQuestionPublic,
    SkillsAssessmentOut,
)

_VALID_VERDICTS = {v.value for v in AssessmentVerdict}
_ATTEMPT_GRACE_SECONDS = 10


def _is_admin(user: User) -> bool:
    return any(r.code == RoleCode.ADMIN for r in user.roles)


async def _owned_course(db: AsyncSession, course_id: int, user: User) -> Course:
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    if course.instructor_id != user.id and not _is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu kurs sizniki emas")
    return course


async def _owned_module(db: AsyncSession, module_id: int, user: User) -> CourseModule:
    module = await db.get(CourseModule, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modul topilmadi")
    await _owned_course(db, module.course_id, user)
    return module


async def _owned_quiz(db: AsyncSession, quiz_id: int, user: User) -> Quiz:
    quiz = await db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test topilmadi")
    if quiz.module_id is not None:
        await _owned_module(db, quiz.module_id, user)
    else:
        assert quiz.course_id is not None
        await _owned_course(db, quiz.course_id, user)
    return quiz


async def _enrollment_or_403(db: AsyncSession, user: User, course_id: int) -> Enrollment:
    enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user.id, Enrollment.course_id == course_id
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Avval kursga yoziling")
    return enrollment


# --- Ustoz: quiz yaratish/boshqarish ---
async def create_module_quiz(
    db: AsyncSession, module_id: int, user: User, data: QuizCreate
) -> Quiz:
    await _owned_module(db, module_id, user)
    existing = (
        await db.execute(select(Quiz).where(Quiz.module_id == module_id))
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu modulda test allaqachon mavjud"
        )
    quiz = Quiz(
        kind=QuizKind.MODULE_CHECK,
        module_id=module_id,
        title=data.title,
        pass_score_pct=data.pass_score_pct,
        time_limit_seconds=data.time_limit_seconds,
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return quiz


async def create_final_quiz(db: AsyncSession, course_id: int, user: User, data: QuizCreate) -> Quiz:
    await _owned_course(db, course_id, user)
    existing = (
        await db.execute(select(Quiz).where(Quiz.course_id == course_id))
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu kursda yakuniy test allaqachon mavjud"
        )
    quiz = Quiz(
        kind=QuizKind.FINAL_THEORY,
        course_id=course_id,
        title=data.title,
        pass_score_pct=data.pass_score_pct,
        time_limit_seconds=data.time_limit_seconds,
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return quiz


async def add_question(
    db: AsyncSession, quiz_id: int, user: User, data: QuizQuestionCreate
) -> QuizQuestion:
    await _owned_quiz(db, quiz_id, user)
    if data.correct_index >= len(data.choices):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="correct_index variantlar sonidan katta bo'lishi mumkin emas",
        )
    question = QuizQuestion(
        quiz_id=quiz_id,
        prompt=data.prompt,
        choices=data.choices,
        correct_index=data.correct_index,
        points=data.points,
        sort=data.sort,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def delete_question(db: AsyncSession, question_id: int, user: User) -> None:
    question = await db.get(QuizQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savol topilmadi")
    await _owned_quiz(db, question.quiz_id, user)
    await db.delete(question)
    await db.commit()


async def instructor_quiz_detail(
    db: AsyncSession, quiz_id: int, user: User
) -> QuizDetailForInstructor:
    quiz = await _owned_quiz(db, quiz_id, user)
    return QuizDetailForInstructor(
        id=quiz.id,
        kind=quiz.kind,
        title=quiz.title,
        pass_score_pct=quiz.pass_score_pct,
        time_limit_seconds=quiz.time_limit_seconds,
        question_count=len(quiz.questions),
        questions=[QuizQuestionOut.model_validate(q) for q in quiz.questions],
    )


# --- O'quvchi: urinish (attempt) oqimi ---
async def start_attempt(db: AsyncSession, quiz_id: int, user: User) -> QuizAttemptStart:
    quiz = await db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test topilmadi")

    if quiz.course_id is not None:
        course_id = quiz.course_id
    else:
        module = await db.get(CourseModule, quiz.module_id)
        assert module is not None
        course_id = module.course_id

    enrollment = await _enrollment_or_403(db, user, course_id)
    if quiz.kind == QuizKind.FINAL_THEORY and enrollment.progress_pct < 100:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Yakuniy testga kirish uchun avval kursning barcha darslarini tugating",
        )
    if not quiz.questions:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Testda hali savollar yo'q"
        )

    question_ids = [q.id for q in quiz.questions]
    random.shuffle(question_ids)
    attempt = QuizAttempt(quiz_id=quiz.id, user_id=user.id, question_ids=question_ids)
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    by_id = {q.id: q for q in quiz.questions}
    questions = [
        QuizQuestionPublic(id=qid, prompt=by_id[qid].prompt, choices=by_id[qid].choices)
        for qid in question_ids
    ]
    return QuizAttemptStart(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        pass_score_pct=quiz.pass_score_pct,
        time_limit_seconds=quiz.time_limit_seconds,
        started_at=attempt.started_at,
        questions=questions,
    )


async def submit_attempt(
    db: AsyncSession, attempt_id: int, user: User, answers: list[int]
) -> QuizAttemptResult:
    attempt = await db.get(QuizAttempt, attempt_id)
    if attempt is None or attempt.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Urinish topilmadi")
    if attempt.submitted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu urinish allaqachon yakunlangan"
        )

    quiz = await db.get(Quiz, attempt.quiz_id)
    assert quiz is not None
    now = datetime.now(UTC)
    elapsed = (now - attempt.started_at).total_seconds()
    expired = (
        quiz.time_limit_seconds is not None
        and elapsed > quiz.time_limit_seconds + _ATTEMPT_GRACE_SECONDS
    )

    questions_by_id = {
        q.id: q
        for q in (
            await db.execute(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id))
        ).scalars()
    }
    # Ball bo'yicha og'irlashtirilgan natija — har savol xohlagancha ball
    # bilan belgilanishi mumkin (Test konstruktori: "ball"). Eski testlarda
    # barcha savollar sukut 1 ball bo'lgani uchun bu avvalgi teng-og'irlik
    # xulqini o'zgartirmaydi.
    total_points = sum(questions_by_id[qid].points for qid in attempt.question_ids)
    earned_points = 0
    for i, qid in enumerate(attempt.question_ids):
        given = answers[i] if i < len(answers) else None
        if given is not None and given == questions_by_id[qid].correct_index:
            earned_points += questions_by_id[qid].points
    score_pct = round(earned_points / total_points * 100) if total_points else 0
    passed = (not expired) and score_pct >= quiz.pass_score_pct

    attempt.answers = answers
    attempt.score_pct = score_pct
    attempt.passed = passed
    attempt.expired = expired
    attempt.submitted_at = now
    await db.commit()
    await streak_service.record_activity(db, user)

    review_lesson_titles: list[str] = []
    if not passed and quiz.kind == QuizKind.MODULE_CHECK and quiz.module_id is not None:
        module = await db.get(CourseModule, quiz.module_id)
        if module is not None:
            review_lesson_titles = [lesson.title for lesson in module.lessons]

    return QuizAttemptResult(
        attempt_id=attempt.id,
        score_pct=score_pct,
        passed=passed,
        expired=expired,
        pass_score_pct=quiz.pass_score_pct,
        review_lesson_titles=review_lesson_titles,
    )


# --- Ustoz: yakuniy imtihon brifi ---
async def update_final_exam_brief(
    db: AsyncSession, course_id: int, user: User, brief: str
) -> Course:
    course = await _owned_course(db, course_id, user)
    course.final_exam_brief = brief
    await db.commit()
    await db.refresh(course)
    return course


# --- O'quvchi: yakuniy amaliy imtihon topshirig'i ---
async def _my_final_exam_submission(
    db: AsyncSession, user_id: int, course_id: int
) -> FinalExamSubmission | None:
    return (
        await db.execute(
            select(FinalExamSubmission).where(
                FinalExamSubmission.user_id == user_id, FinalExamSubmission.course_id == course_id
            )
        )
    ).scalar_one_or_none()


async def _my_skills_assessment(
    db: AsyncSession, user_id: int, course_id: int
) -> SkillsAssessment | None:
    return (
        await db.execute(
            select(SkillsAssessment).where(
                SkillsAssessment.user_id == user_id, SkillsAssessment.course_id == course_id
            )
        )
    ).scalar_one_or_none()


async def _has_passed_final_quiz(db: AsyncSession, user_id: int, course_id: int) -> bool:
    final_quiz = (
        await db.execute(select(Quiz).where(Quiz.course_id == course_id))
    ).scalar_one_or_none()
    if final_quiz is None:
        return True  # kursda yakuniy nazariy test yo'q bo'lsa, to'siq qo'yilmaydi
    passed_attempt = (
        await db.execute(
            select(QuizAttempt).where(
                QuizAttempt.quiz_id == final_quiz.id,
                QuizAttempt.user_id == user_id,
                QuizAttempt.passed.is_(True),
            )
        )
    ).scalars().first()
    return passed_attempt is not None


async def submit_final_exam(
    db: AsyncSession, user: User, course_id: int, text: str, file_url: str | None
) -> FinalExamSubmissionOut:
    enrollment = await _enrollment_or_403(db, user, course_id)
    if enrollment.progress_pct < 100:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Avval kursning barcha darslarini tugating",
        )
    if not await _has_passed_final_quiz(db, user.id, course_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Avval yakuniy nazariy testdan o'ting (70%+)",
        )

    course = await db.get(Course, course_id)
    assert course is not None

    # Kvota — har qanday DB yozuvidan OLDIN tekshiriladi (career_coach bilan bir xil naqsh):
    # AI chaqiruvi muvaffaqiyatsiz bo'lsa, butun tranzaksiya (kvota + submission) rollback bo'ladi.
    await check_and_increment_quota(db, user.id, AiFeature.EXAM_GRADER)

    existing = await _my_final_exam_submission(db, user.id, course_id)
    if existing is None:
        submission = FinalExamSubmission(
            user_id=user.id, course_id=course_id, text=text, file_url=file_url
        )
        db.add(submission)
    else:
        existing.text = text
        existing.file_url = file_url
        submission = existing
    await db.flush()

    result = await exam_grader.grade_submission(
        user=user, course=course, submission_text=text, has_file=file_url is not None
    )

    assessment = await _my_skills_assessment(db, user.id, course_id)
    if assessment is None:
        assessment = SkillsAssessment(
            user_id=user.id,
            course_id=course_id,
            ai_score_pct=result.score_pct,
            ai_readiness_pct=result.readiness_pct,
            ai_feedback=result.feedback,
            ai_verdict=result.verdict,
        )
        db.add(assessment)
    else:
        assessment.ai_score_pct = result.score_pct
        assessment.ai_readiness_pct = result.readiness_pct
        assessment.ai_feedback = result.feedback
        assessment.ai_verdict = result.verdict
        # Qayta topshirilgan bo'lsa — eski ustoz xulosasi endi eskirgan, qayta ko'rib chiqiladi
        assessment.mentor_verdict = None
        assessment.mentor_feedback = None
        assessment.mentor_id = None
        assessment.confirmed_at = None

    await db.commit()
    await db.refresh(submission)
    return FinalExamSubmissionOut.model_validate(submission)


async def get_final_status(db: AsyncSession, user: User, course_id: int) -> FinalAssessmentStatus:
    passed = await _has_passed_final_quiz(db, user.id, course_id)
    submission = await _my_final_exam_submission(db, user.id, course_id)
    assessment = await _my_skills_assessment(db, user.id, course_id)
    return FinalAssessmentStatus(
        final_quiz_passed=passed,
        submission=FinalExamSubmissionOut.model_validate(submission) if submission else None,
        assessment=SkillsAssessmentOut.model_validate(assessment) if assessment else None,
    )


# --- Ustoz: baholashni ko'rib chiqish/tasdiqlash ---
async def mentor_review_queue(
    db: AsyncSession, user: User, *, pending_only: bool
) -> list[MentorReviewQueueItem]:
    stmt = (
        select(SkillsAssessment, Course.title, User.full_name, User.id)
        .join(Course, Course.id == SkillsAssessment.course_id)
        .join(User, User.id == SkillsAssessment.user_id)
        .where(Course.instructor_id == user.id)
        .order_by(SkillsAssessment.created_at.desc())
    )
    if pending_only:
        stmt = stmt.where(SkillsAssessment.mentor_verdict.is_(None))
    rows = (await db.execute(stmt)).all()
    return [
        MentorReviewQueueItem(
            assessment=SkillsAssessmentOut.model_validate(a),
            course_title=course_title,
            student_name=student_name,
            student_id=student_id,
        )
        for a, course_title, student_name, student_id in rows
    ]


async def confirm_assessment(
    db: AsyncSession, user: User, assessment_id: int, verdict: str, feedback: str
) -> SkillsAssessmentOut:
    if verdict not in _VALID_VERDICTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Noma'lum xulosa"
        )
    assessment = await db.get(SkillsAssessment, assessment_id)
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Baholash topilmadi")
    course = await db.get(Course, assessment.course_id)
    assert course is not None
    if course.instructor_id != user.id and not _is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu kurs sizniki emas")

    assessment.mentor_verdict = verdict
    assessment.mentor_feedback = feedback
    assessment.mentor_id = user.id
    assessment.confirmed_at = datetime.now(UTC)

    if verdict == AssessmentVerdict.READY:
        cert = (
            await db.execute(
                select(Certificate).where(
                    Certificate.user_id == assessment.user_id,
                    Certificate.course_id == assessment.course_id,
                )
            )
        ).scalar_one_or_none()
        if cert is not None:
            cert.confirmed_at = datetime.now(UTC)
            cert.readiness_pct = assessment.ai_readiness_pct

    await create_notification(
        db,
        user_id=assessment.user_id,
        notif_type=NotificationType.SYSTEM,
        category=NotificationCategory.LEARNING,
        title="Yakuniy baholash natijasi tayyor",
        body=course.title,
        link_url="/profil",
    )
    await db.commit()
    await db.refresh(assessment)
    return SkillsAssessmentOut.model_validate(assessment)
