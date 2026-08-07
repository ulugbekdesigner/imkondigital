"""Digital Skills Passport sxemalari — sertifikat, portfolio, public passport."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CertificateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uid: str
    course_id: int | None
    course_title: str | None = None
    pdf_url: str | None
    qr_url: str | None
    issued_at: datetime
    confirmed_at: datetime | None = None
    readiness_pct: int | None = None


class PortfolioItemUpdate(BaseModel):
    """Case-hikoya maydonlarini tahrirlash — barchasi ixtiyoriy (qisman yangilanish)."""

    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    task: str | None = None
    result: str | None = None
    client_feedback: str | None = None
    skills: list[str] | None = None


class PortfolioStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caption: str
    media_url: str
    sort: int


class PortfolioItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    media_urls: list[str]
    source_type: str
    task: str
    result: str
    client_feedback: str | None
    skills: list[str]
    steps: list[PortfolioStepOut] = Field(default_factory=list)
    created_at: datetime


class PassportOut(BaseModel):
    """Public Skills Passport — /u/{username}."""

    full_name: str
    username: str
    visibility: str
    region_name: str | None
    member_since: datetime
    certificates: list[CertificateOut]
    portfolio: list[PortfolioItemOut]
    generosity_tier: str | None = None
