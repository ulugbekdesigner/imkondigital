"""Xususiyat bayroqlari sxemalari."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeatureFlagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    enabled: bool
    rollout_percent: int
    description: str
    updated_at: datetime


class FeatureFlagUpdate(BaseModel):
    enabled: bool
    rollout_percent: int = Field(default=100, ge=0, le=100)
    description: str = Field(default="", max_length=300)
