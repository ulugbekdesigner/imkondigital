"""Portfolio — Skills Passport'ning amaliy ko'nikmalar bloki."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import ARRAY, BigInteger, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import PortfolioSource


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    media_urls: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    source_type: Mapped[str] = mapped_column(
        String(16), default=PortfolioSource.MANUAL, nullable=False
    )
    submission_id: Mapped[int | None] = mapped_column(
        ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True
    )
    # Case-hikoya (Portfolio 2.0, KENGAYISH_PLAN_3.md 6.3-bo'lim): vazifa/natija Ziyo
    # bilan suhbat orqali (CaseStorySession) yoki qo'lda to'ldiriladi; mijoz bahosi
    # esa HAR DOIM qo'lda kiritiladi — AI hech qachon "mijoz aytdi" deb o'ylab topmaydi.
    task: Mapped[str] = mapped_column(Text, default="", nullable=False)
    result: Mapped[str] = mapped_column(Text, default="", nullable=False)
    client_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    steps: Mapped[list[PortfolioItemStep]] = relationship(
        order_by="PortfolioItemStep.sort",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class PortfolioItemStep(Base):
    """Jarayon bosqichi — 2-3 oraliq kadr/versiya (Portfolio 2.0, "Vazifa→Jarayon→Natija")."""

    __tablename__ = "portfolio_item_steps"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    portfolio_item_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio_items.id", ondelete="CASCADE"), index=True, nullable=False
    )
    caption: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    media_url: Mapped[str] = mapped_column(String(512), nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
