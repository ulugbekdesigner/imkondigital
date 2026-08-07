"""Imtiyozlar Markazi sxemalari."""

from datetime import datetime

from pydantic import BaseModel, Field


class BenefitCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    category: str = Field(min_length=2, max_length=20)
    provider_type: str = "davlat"
    audience: str = "user"
    region_id: int | None = None
    disability_categories: list[str] = Field(default_factory=list)
    how_to_apply: str = ""
    external_url: str | None = None
    expires_at: datetime | None = None


class BenefitCard(BaseModel):
    id: int
    title: str
    category: str
    provider_type: str
    audience: str
    region_id: int | None
    region_name: str | None
    disability_categories: list[str]
    status: str
    is_relevant_to_me: bool | None
    is_saved: bool
    expires_at: datetime | None
    created_at: datetime


class BenefitDetail(BenefitCard):
    description: str
    how_to_apply: str
    external_url: str | None


class BenefitPage(BaseModel):
    items: list[BenefitCard]
