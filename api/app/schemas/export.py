"""'Mening ma'lumotlarim' arxivi — KENGAYISH_PLAN_3.md 8-bo'lim."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.ai import GeneratedCvOut
from app.schemas.course import MyEnrollment
from app.schemas.employer import ApplicationOut
from app.schemas.marketplace import OrderCard
from app.schemas.passport import CertificateOut, PortfolioItemOut
from app.schemas.streak import StreakOut
from app.schemas.user import DisabilityProfileOut, UserOut


class DataExportOut(BaseModel):
    exported_at: datetime
    profile: UserOut
    disability_profile: DisabilityProfileOut | None
    enrollments: list[MyEnrollment]
    certificates: list[CertificateOut]
    portfolio: list[PortfolioItemOut]
    applications: list[ApplicationOut]
    orders: list[OrderCard]
    streak: StreakOut
    generated_cv: GeneratedCvOut | None
