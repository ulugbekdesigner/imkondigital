"""Global qidiruv — KENGAYISH_PLAN_3.md 8-bo'lim."""

from pydantic import BaseModel


class CourseHit(BaseModel):
    id: int
    title: str
    slug: str
    is_free: bool
    ladder_step: int


class VacancyHit(BaseModel):
    id: int
    title: str
    company_name: str
    match_score: int | None = None


class BenefitHit(BaseModel):
    id: int
    title: str


class MaterialHit(BaseModel):
    id: int
    title: str
    course_slug: str
    course_title: str


class SearchResults(BaseModel):
    query: str
    courses: list[CourseHit]
    vacancies: list[VacancyHit]
    benefits: list[BenefitHit]
    materials: list[MaterialHit]
