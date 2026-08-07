"""Analitika sxemalari — barchasi AGREGAT (shaxsiy ma'lumot yo'q, MASTER_PLAN 3-bo'lim)."""

from pydantic import BaseModel


class BucketStat(BaseModel):
    """Kichik hujayra bostirilgan (k-anonimlik): count < 3 bo'lsa ko'rsatilmaydi."""

    label: str
    count: int | None


class DailyBucket(BaseModel):
    date: str  # ISO YYYY-MM-DD
    count: int


class RegistrationsDaily(BaseModel):
    """Oxirgi 7 kun — kunlik ro'yxatdan o'tganlar soni (eng eskisi birinchi)."""

    days: list[DailyBucket]


class AdminOverview(BaseModel):
    total_users: int
    active_users: int
    verified_disability_profiles: int
    published_courses: int
    total_enrollments: int
    completed_enrollments: int
    published_vacancies: int
    placements: int
    active_gigs: int
    paid_orders_volume: int
    benefit_claims: int
    active_mentorships: int


class DonorOverview(BaseModel):
    programs_count: int
    total_applicants: int
    approved_enrollees: int
    completed_courses_among_enrollees: int
    placements_among_enrollees: int
    region_breakdown: list[BucketStat]
    disability_group_breakdown: list[BucketStat]


class GovOverview(BaseModel):
    # Platforma qamrovi — xom, agregat sonlar (shaxsga bog'lanmaydi)
    total_students: int
    total_employed: int
    total_companies: int
    region_coverage: int
    # Natijalar — tasdiqlangan nogironlik profiliga ega foydalanuvchilar orasida
    total_verified_disability_profiles: int
    employment_rate_pct: float
    course_completion_rate_pct: float
    marketplace_volume_som: int
    benefit_claims: int
    region_employment_breakdown: list[BucketStat]
    region_breakdown: list[BucketStat]
    disability_group_breakdown: list[BucketStat]
