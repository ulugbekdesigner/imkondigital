"""'Mening yo'lim' biznes logikasi — real mavjud ma'lumotlarni yig'adi.

Soxta/statik "AI maslahati" o'rniga real progress/mentor/baholash ma'lumotlari
ko'rsatiladi (CONTRIBUTING.md 2-qoidasi — placeholder yo'q); chuqurroq AI maslahat
kerak bo'lsa foydalanuvchi Career Coach/Study Buddy'ga o'tadi (frontend link).
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.trajectory import build_trajectory
from app.models.assessment import SkillsAssessment
from app.models.course import Course, CourseModule, Enrollment, Lesson, LessonCompletion
from app.models.enums import EnrollmentStatus, MentorshipStatus
from app.models.mentorship import MentorCheckin, Mentorship
from app.models.user import User
from app.schemas.learning_home import (
    ActiveEnrollmentItem,
    AssessmentResultItem,
    LearningHomeOut,
    MentorNoteItem,
    NextLessonItem,
)

_RECENT_ASSESSMENTS_LIMIT = 3


async def _active_enrollments(db: AsyncSession, user_id: int) -> list[ActiveEnrollmentItem]:
    rows = (
        await db.execute(
            select(Enrollment, Course.title, Course.slug)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Enrollment.user_id == user_id, Enrollment.status == EnrollmentStatus.ACTIVE)
            .order_by(Enrollment.started_at.desc())
        )
    ).all()
    return [
        ActiveEnrollmentItem(
            course_id=e.course_id, course_title=title, course_slug=slug, progress_pct=e.progress_pct
        )
        for e, title, slug in rows
    ]


async def _next_lesson(
    db: AsyncSession, user_id: int, active: list[ActiveEnrollmentItem]
) -> NextLessonItem | None:
    for item in active:
        enrollment = (
            await db.execute(
                select(Enrollment).where(
                    Enrollment.user_id == user_id, Enrollment.course_id == item.course_id
                )
            )
        ).scalar_one()
        done_ids = set(
            (
                await db.execute(
                    select(LessonCompletion.lesson_id).where(
                        LessonCompletion.enrollment_id == enrollment.id
                    )
                )
            ).scalars()
        )
        lessons = (
            (
                await db.execute(
                    select(Lesson)
                    .join(CourseModule, CourseModule.id == Lesson.module_id)
                    .where(CourseModule.course_id == item.course_id)
                    .order_by(CourseModule.sort, Lesson.sort)
                )
            )
            .scalars()
            .all()
        )
        for lesson in lessons:
            if lesson.id not in done_ids:
                return NextLessonItem(
                    course_slug=item.course_slug,
                    course_title=item.course_title,
                    lesson_id=lesson.id,
                    lesson_title=lesson.title,
                )
    return None


async def _latest_mentor_note(db: AsyncSession, user_id: int) -> MentorNoteItem | None:
    row = (
        await db.execute(
            select(MentorCheckin, User.full_name)
            .join(Mentorship, Mentorship.id == MentorCheckin.mentorship_id)
            .join(User, User.id == Mentorship.mentor_id)
            .where(
                Mentorship.mentee_id == user_id, Mentorship.status == MentorshipStatus.ACTIVE
            )
            .order_by(MentorCheckin.created_at.desc())
            .limit(1)
        )
    ).first()
    if row is None:
        return None
    checkin, mentor_name = row
    return MentorNoteItem(mentor_name=mentor_name, note=checkin.note, created_at=checkin.created_at)


async def _recent_assessment_results(db: AsyncSession, user_id: int) -> list[AssessmentResultItem]:
    rows = (
        await db.execute(
            select(SkillsAssessment, Course.title)
            .join(Course, Course.id == SkillsAssessment.course_id)
            .where(
                SkillsAssessment.user_id == user_id, SkillsAssessment.confirmed_at.is_not(None)
            )
            .order_by(SkillsAssessment.confirmed_at.desc())
            .limit(_RECENT_ASSESSMENTS_LIMIT)
        )
    ).all()
    return [
        AssessmentResultItem(
            course_title=title, verdict=a.final_verdict, confirmed_at=a.confirmed_at
        )
        for a, title in rows
        if a.confirmed_at is not None
    ]


async def get_learning_home(db: AsyncSession, user: User) -> LearningHomeOut:
    active = await _active_enrollments(db, user.id)
    return LearningHomeOut(
        trajectory=await build_trajectory(db, user),
        active_enrollments=active,
        next_lesson=await _next_lesson(db, user.id, active),
        latest_mentor_note=await _latest_mentor_note(db, user.id),
        recent_assessment_results=await _recent_assessment_results(db, user.id),
    )
