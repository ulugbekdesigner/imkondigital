"""Kurs sharhlari biznes logikasi."""

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, Enrollment
from app.models.course_review import CourseReview
from app.models.enums import RoleCode
from app.models.user import User
from app.schemas.course_review import CourseReviewOut


def _is_admin(user: User) -> bool:
    return any(r.code == RoleCode.ADMIN for r in user.roles)


async def _recompute_course_rating(db: AsyncSession, course_id: int) -> None:
    avg_rating = (
        await db.execute(
            select(func.avg(CourseReview.rating)).where(CourseReview.course_id == course_id)
        )
    ).scalar_one()
    course = await db.get(Course, course_id)
    assert course is not None
    course.rating = round(float(avg_rating), 2) if avg_rating is not None else 0.0


async def upsert_review(
    db: AsyncSession, user: User, course_id: int, rating: int, comment: str
) -> CourseReview:
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")

    enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user.id, Enrollment.course_id == course_id
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sharh qoldirish uchun avval kursga yozilishingiz kerak",
        )

    existing = (
        await db.execute(
            select(CourseReview).where(
                CourseReview.course_id == course_id, CourseReview.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        review = CourseReview(
            course_id=course_id, user_id=user.id, rating=rating, comment=comment
        )
        db.add(review)
    else:
        existing.rating = rating
        existing.comment = comment
        review = existing
    await db.flush()

    await _recompute_course_rating(db, course_id)
    await db.commit()
    await db.refresh(review)
    return review


async def reply_to_review(
    db: AsyncSession, user: User, review_id: int, reply: str
) -> CourseReview:
    review = await db.get(CourseReview, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sharh topilmadi")
    course = await db.get(Course, review.course_id)
    assert course is not None
    if course.instructor_id != user.id and not _is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu kurs sizniki emas")

    review.instructor_reply = reply
    await db.commit()
    await db.refresh(review)
    return review


async def list_course_reviews(db: AsyncSession, course_id: int) -> list[CourseReviewOut]:
    rows = (
        await db.execute(
            select(CourseReview, User.full_name)
            .join(User, User.id == CourseReview.user_id)
            .where(CourseReview.course_id == course_id)
            .order_by(CourseReview.created_at.desc())
        )
    ).all()
    return [
        CourseReviewOut(
            id=r.id,
            course_id=r.course_id,
            reviewer_name=full_name,
            rating=r.rating,
            comment=r.comment,
            instructor_reply=r.instructor_reply,
            created_at=r.created_at,
        )
        for r, full_name in rows
    ]
