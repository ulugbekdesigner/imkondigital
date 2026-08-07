"""Kurs sharhlari sxemalari — "Fikrlar markazi" (V2-4/B5)."""

from datetime import datetime

from pydantic import BaseModel, Field


class CourseReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)


class CourseReviewReplyIn(BaseModel):
    reply: str = Field(min_length=1, max_length=2000)


class CourseReviewOut(BaseModel):
    id: int
    course_id: int
    reviewer_name: str
    rating: int
    comment: str
    instructor_reply: str | None
    created_at: datetime
