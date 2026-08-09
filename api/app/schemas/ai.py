"""AI qatlami sxemalari — Career Coach, CV Builder, Interview Coach."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CareerCoachMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CareerCoachMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: datetime


class CvGenerateRequest(BaseModel):
    vacancy_id: int | None = None


class GeneratedCvOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    content: str
    pdf_url: str | None
    generated_at: datetime


class InterviewStartRequest(BaseModel):
    vacancy_id: int | None = None


class InterviewMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class InterviewMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: datetime


class InterviewSessionCard(BaseModel):
    id: int
    vacancy_id: int | None
    vacancy_title: str | None
    status: str
    created_at: datetime
    completed_at: datetime | None


class InterviewSessionDetail(InterviewSessionCard):
    messages: list[InterviewMessageOut]


class CaseStoryStartRequest(BaseModel):
    portfolio_item_id: int


class CaseStoryMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CaseStoryMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: datetime


class CaseStorySessionCard(BaseModel):
    id: int
    portfolio_item_id: int
    portfolio_item_title: str
    status: str
    created_at: datetime
    completed_at: datetime | None


class CaseStorySessionDetail(CaseStorySessionCard):
    messages: list[CaseStoryMessageOut]


class StudyBuddyMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class StudyBuddyMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: datetime


class PlacementTestStartRequest(BaseModel):
    language: Literal["en", "ru"]


class PlacementTestMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class PlacementTestMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: datetime


class PlacementTestSessionCard(BaseModel):
    id: int
    language: str
    status: str
    cefr_level: str | None
    level_feedback: str | None
    created_at: datetime
    completed_at: datetime | None


class PlacementTestSessionDetail(PlacementTestSessionCard):
    messages: list[PlacementTestMessageOut]


class ZiyoMessageItem(BaseModel):
    role: str
    content: str


class ZiyoMessageIn(BaseModel):
    messages: list[ZiyoMessageItem] = Field(min_length=1, max_length=13)
    page_path: str | None = Field(default=None, max_length=200)
    mode: Literal["default", "practice"] | None = None
    language: Literal["en", "ru"] | None = None


class ZiyoMessageOut(BaseModel):
    content: str


class ZiyoHistoryMessage(BaseModel):
    """Saqlangan Ziyo tarixi — faqat kirgan foydalanuvchi, faqat standart rejim."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: datetime
