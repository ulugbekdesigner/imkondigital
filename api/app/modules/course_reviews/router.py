"""Kurs sharhlari endpoint'lari — /v1/courses/{id}/reviews, /v1/course-reviews/{id}/reply."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.course_reviews import service
from app.schemas.course_review import CourseReviewIn, CourseReviewOut, CourseReviewReplyIn

router = APIRouter(tags=["course-reviews"])


@router.get("/courses/{course_id}/reviews", response_model=list[CourseReviewOut])
async def list_reviews(
    course_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[CourseReviewOut]:
    return await service.list_course_reviews(db, course_id)


@router.post("/courses/{course_id}/reviews", response_model=CourseReviewOut)
async def upsert_review(
    course_id: int,
    data: CourseReviewIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CourseReviewOut:
    review = await service.upsert_review(db, user, course_id, data.rating, data.comment)
    return CourseReviewOut(
        id=review.id,
        course_id=review.course_id,
        reviewer_name=user.full_name,
        rating=review.rating,
        comment=review.comment,
        instructor_reply=review.instructor_reply,
        created_at=review.created_at,
    )


@router.patch("/course-reviews/{review_id}/reply", response_model=CourseReviewOut)
async def reply_to_review(
    review_id: int,
    data: CourseReviewReplyIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CourseReviewOut:
    review = await service.reply_to_review(db, user, review_id, data.reply)
    reviewer = await db.get(User, review.user_id)
    assert reviewer is not None
    return CourseReviewOut(
        id=review.id,
        course_id=review.course_id,
        reviewer_name=reviewer.full_name,
        rating=review.rating,
        comment=review.comment,
        instructor_reply=review.instructor_reply,
        created_at=review.created_at,
    )
