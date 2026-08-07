"""Donor dasturi sxemalari."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DonorProgramStatus


class DonorProgramIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)


class DonorProgramStatusUpdate(BaseModel):
    status: DonorProgramStatus


class DonorProgramOut(BaseModel):
    id: int
    donor_id: int
    donor_name: str
    title: str
    description: str
    status: str
    enrolled_count: int
    created_at: datetime


class ProgramEnrollmentOut(BaseModel):
    id: int
    program_id: int
    user_id: int
    applicant_name: str
    region_name: str | None
    ladder_step: int
    status: str
    applied_at: datetime
    decided_at: datetime | None
