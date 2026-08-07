"""Bitiruvchi hikoyasi sxemalari — bosh sahifa 'Tirik Narvon' hero'si uchun."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SuccessStoryStatus


class SuccessStoryIn(BaseModel):
    step: int = Field(ge=0, le=4)
    full_name: str = Field(min_length=2, max_length=160)
    profession: str = Field(min_length=2, max_length=160)
    quote: str = Field(min_length=10)
    photo_url: str | None = None


class SuccessStoryStatusUpdate(BaseModel):
    status: SuccessStoryStatus


class SuccessStoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    step: int
    full_name: str
    profession: str
    quote: str
    photo_url: str | None
    status: str
    created_at: datetime
