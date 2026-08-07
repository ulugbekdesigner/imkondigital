"""Bandlik — kompaniya, vakansiya, ariza, ishga joylashtirish sxemalari."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EmploymentType, WorkFormat


# --- Kompaniya ---
class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    inn: str | None = None
    description: str = ""
    employee_count: int | None = Field(default=None, ge=0)


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    inn: str | None
    logo_url: str | None
    description: str
    employee_count: int | None
    inclusive_rating: float
    verified: bool
    quota_recommended: int | None = None


# --- Vakansiya ---
class VacancyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    ladder_step: int = Field(default=1, ge=0, le=4)
    work_format: WorkFormat = WorkFormat.REMOTE
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    salary_from: int | None = Field(default=None, ge=0)
    salary_to: int | None = Field(default=None, ge=0)
    region_id: int | None = None
    accommodations: dict[str, Any] = Field(default_factory=dict)
    skills_required: list[str] = Field(default_factory=list)


class VacancyCard(BaseModel):
    id: int
    title: str
    company_name: str
    company_verified: bool
    ladder_step: int
    work_format: str
    employment_type: str
    salary_from: int | None
    salary_to: int | None
    region_name: str | None
    status: str
    created_at: datetime
    match_score: int | None = None
    is_inclusive: bool


class VacancyDetail(VacancyCard):
    description: str
    accommodations: dict[str, Any]
    skills_required: list[str]
    company_id: int


class VacancyPage(BaseModel):
    items: list[VacancyCard]
    next_cursor: int | None


# --- Ariza ---
class ApplicationCreate(BaseModel):
    share_disability_profile: bool = False


class ApplicationOut(BaseModel):
    id: int
    vacancy_id: int
    vacancy_title: str
    company_name: str
    match_score: int
    status: str
    created_at: datetime


class DisabilitySummary(BaseModel):
    """Nomzod roziligi bilangina ish beruvchiga ko'rinadi."""

    group_type: str | None
    categories: list[str]


# --- Placement ---
class PlacementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    started_at: datetime
    checkin_1w: bool
    checkin_1m: bool
    checkin_3m: bool
    stable_confirmed_at: datetime | None


class CheckinRequest(BaseModel):
    period: Literal["1w", "1m", "3m"]


class ApplicantOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    username: str
    match_score: int
    status: str
    created_at: datetime
    ladder_step: int
    portfolio_count: int
    certificates_count: int
    disability: DisabilitySummary | None = None
    placement: PlacementOut | None = None


class ApplicationStatusUpdate(BaseModel):
    status: Literal["viewed", "interview", "accepted", "rejected"]


# --- Ish beruvchi kabineti statistikasi ---
class CompanyStats(BaseModel):
    active_vacancies: int
    new_applications: int
    hired: int


# --- /ish-beruvchilarga ochiq marketing statistikasi (loginsiz) ---
class EmployerPublicStatsOut(BaseModel):
    avg_days_to_hire: int | None
    retention_3m_pct: int | None
