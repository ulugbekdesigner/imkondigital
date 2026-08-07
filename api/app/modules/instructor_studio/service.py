"""Ustoz Studiyasi biznes logikasi."""

from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.generosity import compute_generosity_tier
from app.core.impact_certificate import issue_impact_certificate
from app.models.course import (
    Assignment,
    Course,
    CourseModule,
    Enrollment,
    Lesson,
    LessonCompletion,
    Submission,
)
from app.models.course_review import CourseReview
from app.models.enums import (
    EnrollmentStatus,
    NotificationCategory,
    NotificationType,
    RoleCode,
    SubmissionStatus,
)
from app.models.user import User
from app.modules.notifications.service import create_notification
from app.schemas.instructor_studio import (
    CourseStatsOut,
    ImpactCertificateOut,
    InstructorDashboardOut,
    InstructorReviewItem,
    InstructorStudentItem,
    InstructorSubmissionItem,
    StudentProgressItem,
)

_STUCK_AFTER = timedelta(days=14)


def _is_admin(user: User) -> bool:
    return any(r.code == RoleCode.ADMIN for r in user.roles)


async def _owned_course(db: AsyncSession, course_id: int, user: User) -> Course:
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    if course.instructor_id != user.id and not _is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu kurs sizniki emas")
    return course


async def list_students(
    db: AsyncSession, course_id: int, user: User
) -> list[StudentProgressItem]:
    await _owned_course(db, course_id, user)

    rows = (
        await db.execute(
            select(Enrollment, User.full_name)
            .join(User, User.id == Enrollment.user_id)
            .where(Enrollment.course_id == course_id)
            .order_by(Enrollment.started_at.desc())
        )
    ).all()

    enrollment_ids = [e.id for e, _ in rows]
    last_activity_map: dict[int, datetime] = {}
    if enrollment_ids:
        activity_rows = (
            await db.execute(
                select(LessonCompletion.enrollment_id, func.max(LessonCompletion.completed_at))
                .where(LessonCompletion.enrollment_id.in_(enrollment_ids))
                .group_by(LessonCompletion.enrollment_id)
            )
        ).all()
        last_activity_map = {eid: ts for eid, ts in activity_rows}

    now = datetime.now(UTC)
    items = []
    for e, full_name in rows:
        last_activity = last_activity_map.get(e.id, e.started_at)
        is_stuck = e.status == EnrollmentStatus.ACTIVE and (now - last_activity) > _STUCK_AFTER
        items.append(
            StudentProgressItem(
                user_id=e.user_id,
                full_name=full_name,
                progress_pct=e.progress_pct,
                status=e.status,
                last_activity_at=last_activity,
                is_stuck=is_stuck,
            )
        )
    return items


async def message_student(
    db: AsyncSession, course_id: int, student_user_id: int, user: User, title: str, body: str
) -> None:
    course = await _owned_course(db, course_id, user)
    enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == student_user_id, Enrollment.course_id == course_id
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="O'quvchi bu kursga yozilmagan"
        )
    await create_notification(
        db,
        user_id=student_user_id,
        notif_type=NotificationType.INSTRUCTOR_MESSAGE,
        category=NotificationCategory.LEARNING,
        title=title,
        body=body,
        link_url=f"/kurslar/{course.slug}",
    )
    await db.commit()


async def _course_dropout(
    db: AsyncSession, course_id: int, total_enrollments: int
) -> tuple[str, int] | None:
    """Kursda o'quvchilar eng ko'p to'xtagan darsni topadi — (nomi, foizi) yoki hech
    qanday tushish yo'q bo'lsa None. Foiz = jami ro'yxatdan o'tganlarga nisbatan
    (bir necha kurs orasida taqqoslash uchun, xom sondan ko'ra adolatliroq)."""
    if total_enrollments == 0:
        return None
    lessons = (
        await db.execute(
            select(Lesson.id, Lesson.title)
            .join(CourseModule, CourseModule.id == Lesson.module_id)
            .where(CourseModule.course_id == course_id)
            .order_by(CourseModule.sort, Lesson.sort)
        )
    ).all()
    if not lessons:
        return None

    count_rows = (
        await db.execute(
            select(LessonCompletion.lesson_id, func.count(LessonCompletion.id))
            .join(Lesson, Lesson.id == LessonCompletion.lesson_id)
            .join(CourseModule, CourseModule.id == Lesson.module_id)
            .where(CourseModule.course_id == course_id)
            .group_by(LessonCompletion.lesson_id)
        )
    ).all()
    completion_counts: dict[int, int] = {lid: cnt for lid, cnt in count_rows}

    prev_count = total_enrollments
    worst_drop = 0
    worst_title: str | None = None
    for lesson_id, title in lessons:
        count = completion_counts.get(lesson_id, 0)
        drop = prev_count - count
        if drop > worst_drop:
            worst_drop = drop
            worst_title = title
        prev_count = count

    if worst_title is None:
        return None
    return worst_title, round(worst_drop / total_enrollments * 100)


async def get_course_stats(db: AsyncSession, course_id: int, user: User) -> CourseStatsOut:
    course = await _owned_course(db, course_id, user)

    total_enrollments = (
        await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
        )
    ).scalar_one()
    completed_enrollments = (
        await db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.COMPLETED,
            )
        )
    ).scalar_one()
    completion_rate_pct = (
        round(completed_enrollments / total_enrollments * 100) if total_enrollments else 0
    )
    review_count = (
        await db.execute(
            select(func.count(CourseReview.id)).where(CourseReview.course_id == course_id)
        )
    ).scalar_one()

    dropout = await _course_dropout(db, course_id, total_enrollments)

    return CourseStatsOut(
        views_count=course.views_count,
        students_count=course.students_count,
        completion_rate_pct=completion_rate_pct,
        average_rating=course.rating,
        review_count=review_count,
        most_dropped_lesson_title=dropout[0] if dropout else None,
        most_dropped_lesson_pct=dropout[1] if dropout else None,
        income_available=False,
    )


async def count_free_course_completions(db: AsyncSession, instructor_id: int) -> int:
    return (
        await db.execute(
            select(func.count(func.distinct(Enrollment.user_id)))
            .select_from(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .where(
                Course.instructor_id == instructor_id,
                Course.is_free.is_(True),
                Enrollment.status == EnrollmentStatus.COMPLETED,
            )
        )
    ).scalar_one()


async def get_generosity_tier(db: AsyncSession, instructor_id: int) -> str | None:
    completions = await count_free_course_completions(db, instructor_id)
    return compute_generosity_tier(completions)


async def generate_impact_certificate(db: AsyncSession, user: User) -> ImpactCertificateOut:
    total = await count_free_course_completions(db, user.id)
    generated_at = datetime.now(UTC)
    pdf_url = issue_impact_certificate(
        full_name=user.full_name,
        total_students=total,
        generated_at=generated_at.strftime("%Y-%m-%d"),
    )
    return ImpactCertificateOut(
        pdf_url=pdf_url, total_students_helped=total, generated_at=generated_at
    )


# --- Dashboard (KENGAYISH_PLAN_3.md 1-bo'lim) — barcha kurslar bo'yicha ---


async def list_instructor_students(db: AsyncSession, user: User) -> list[InstructorStudentItem]:
    """`list_students`ning kurslararo (barcha o'z kurslari bo'yicha) varianti."""
    rows = (
        await db.execute(
            select(Enrollment, User.full_name, Course.id, Course.title)
            .join(User, User.id == Enrollment.user_id)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Course.instructor_id == user.id)
            .order_by(Enrollment.started_at.desc())
        )
    ).all()

    enrollment_ids = [e.id for e, _, _, _ in rows]
    last_activity_map: dict[int, datetime] = {}
    if enrollment_ids:
        activity_rows = (
            await db.execute(
                select(LessonCompletion.enrollment_id, func.max(LessonCompletion.completed_at))
                .where(LessonCompletion.enrollment_id.in_(enrollment_ids))
                .group_by(LessonCompletion.enrollment_id)
            )
        ).all()
        last_activity_map = {eid: ts for eid, ts in activity_rows}

    now = datetime.now(UTC)
    items = []
    for e, full_name, course_id, course_title in rows:
        last_activity = last_activity_map.get(e.id, e.started_at)
        is_stuck = e.status == EnrollmentStatus.ACTIVE and (now - last_activity) > _STUCK_AFTER
        items.append(
            InstructorStudentItem(
                user_id=e.user_id,
                full_name=full_name,
                course_id=course_id,
                course_title=course_title,
                progress_pct=e.progress_pct,
                status=e.status,
                last_activity_at=last_activity,
                is_stuck=is_stuck,
            )
        )
    return items


async def list_instructor_reviews(db: AsyncSession, user: User) -> list[InstructorReviewItem]:
    """`list_course_reviews`ning kurslararo (barcha o'z kurslari bo'yicha) varianti."""
    rows = (
        await db.execute(
            select(CourseReview, User.full_name, Course.id, Course.title)
            .join(User, User.id == CourseReview.user_id)
            .join(Course, Course.id == CourseReview.course_id)
            .where(Course.instructor_id == user.id)
            .order_by(CourseReview.created_at.desc())
        )
    ).all()
    return [
        InstructorReviewItem(
            id=review.id,
            course_id=course_id,
            course_title=course_title,
            reviewer_name=full_name,
            rating=review.rating,
            comment=review.comment,
            instructor_reply=review.instructor_reply,
            created_at=review.created_at,
        )
        for review, full_name, course_id, course_title in rows
    ]


async def list_instructor_submissions(
    db: AsyncSession, user: User, *, status_filter: str | None = None, limit: int | None = None
) -> list[InstructorSubmissionItem]:
    """Ustozning BARCHA kurslari bo'yicha topshiriqlar navbati — tekshirish uchun."""
    query = (
        select(
            Submission, Assignment.title, Course.id, Course.title, User.full_name, User.username
        )
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .join(CourseModule, CourseModule.id == Assignment.module_id)
        .join(Course, Course.id == CourseModule.course_id)
        .join(User, User.id == Submission.user_id)
        .where(Course.instructor_id == user.id)
    )
    if status_filter:
        query = query.where(Submission.status == status_filter)
    query = query.order_by(Submission.created_at.asc())
    if limit:
        query = query.limit(limit)

    rows = (await db.execute(query)).all()
    items = []
    for (
        submission,
        assignment_title,
        course_id,
        course_title,
        student_name,
        student_username,
    ) in rows:
        items.append(
            InstructorSubmissionItem(
                id=submission.id,
                course_id=course_id,
                course_title=course_title,
                assignment_id=submission.assignment_id,
                assignment_title=assignment_title,
                student_name=student_name,
                student_username=student_username,
                text=submission.text,
                file_url=submission.file_url,
                status=submission.status,
                feedback=submission.feedback,
                created_at=submission.created_at,
            )
        )
    return items


async def get_instructor_dashboard(db: AsyncSession, user: User) -> InstructorDashboardOut:
    today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today_start.replace(day=1)

    new_students_today = (
        await db.execute(
            select(func.count(Enrollment.id))
            .select_from(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Course.instructor_id == user.id, Enrollment.started_at >= today_start)
        )
    ).scalar_one()

    new_students_this_month = (
        await db.execute(
            select(func.count(Enrollment.id))
            .select_from(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Course.instructor_id == user.id, Enrollment.started_at >= month_start)
        )
    ).scalar_one()

    ungraded_count = (
        await db.execute(
            select(func.count(Submission.id))
            .select_from(Submission)
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .join(CourseModule, CourseModule.id == Assignment.module_id)
            .join(Course, Course.id == CourseModule.course_id)
            .where(
                Course.instructor_id == user.id,
                Submission.status == SubmissionStatus.SUBMITTED,
            )
        )
    ).scalar_one()

    average_rating = (
        await db.execute(
            select(func.avg(Course.rating)).where(
                Course.instructor_id == user.id, Course.rating > 0
            )
        )
    ).scalar_one()

    oldest_ungraded = await list_instructor_submissions(
        db, user, status_filter=SubmissionStatus.SUBMITTED, limit=5
    )

    course_ids = (
        (await db.execute(select(Course.id).where(Course.instructor_id == user.id)))
        .scalars()
        .all()
    )

    students_count = (
        await db.execute(
            select(func.count(func.distinct(Enrollment.user_id))).where(
                Enrollment.course_id.in_(course_ids)
            )
        )
    ).scalar_one() if course_ids else 0

    total_enrollments_count = (
        await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.course_id.in_(course_ids))
        )
    ).scalar_one() if course_ids else 0
    completed_enrollments_count = (
        await db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.course_id.in_(course_ids),
                Enrollment.status == EnrollmentStatus.COMPLETED,
            )
        )
    ).scalar_one() if course_ids else 0
    completion_rate_pct = (
        round(completed_enrollments_count / total_enrollments_count * 100)
        if total_enrollments_count
        else 0
    )

    worst_title: str | None = None
    worst_pct: int | None = None
    for course_id in course_ids:
        course_total = (
            await db.execute(
                select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
            )
        ).scalar_one()
        dropout = await _course_dropout(db, course_id, course_total)
        if dropout and (worst_pct is None or dropout[1] > worst_pct):
            worst_title, worst_pct = dropout

    free_completions_count = await count_free_course_completions(db, user.id)

    return InstructorDashboardOut(
        new_students_today=new_students_today,
        ungraded_submissions_count=ungraded_count,
        average_rating=round(average_rating, 1) if average_rating is not None else None,
        oldest_ungraded=oldest_ungraded,
        courses_count=len(course_ids),
        students_count=students_count,
        new_students_this_month=new_students_this_month,
        completion_rate_pct=completion_rate_pct,
        most_dropped_lesson_title=worst_title,
        most_dropped_lesson_pct=worst_pct,
        free_completions_count=free_completions_count,
    )
