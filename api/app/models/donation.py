"""Ochiq xayriya — loginsiz ommaviy jamg'arma loyihalari (V2-2, B4-bo'lim).

`DonorProgram`/`ProgramEnrollment` (app/models/donor.py)dan farqli — bu yerda
pul haqiqatan platforma orqali o'tadi (Payme/Click), ro'yxatdan o'tish shart
emas. Ikkalasi mustaqil, parallel ishlaydi.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import DonationProjectStatus, PaymentStatus


class DonationProject(Base):
    __tablename__ = "donation_projects"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    story: Mapped[str] = mapped_column(Text, nullable=False)
    target_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # so'm
    collected_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # so'm
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), default=DonationProjectStatus.DRAFT, nullable=False
    )
    report: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    donations: Mapped[list[Donation]] = relationship(
        back_populates="project", order_by="Donation.id.desc()"
    )


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("donation_projects.id", ondelete="CASCADE"), index=True, nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # so'm
    donor_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    donor_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    provider: Mapped[str | None] = mapped_column(String(16), nullable=True)
    provider_transaction_id: Mapped[str | None] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )
    status: Mapped[str] = mapped_column(String(16), default=PaymentStatus.PENDING, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped[DonationProject] = relationship(back_populates="donations")
