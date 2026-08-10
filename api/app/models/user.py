"""Foydalanuvchi, rollar, hudud va nogironlik profili modellari."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.enums import PassportVisibility, UserStatus, VerifiedStatus


class Region(Base):
    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("regions.id"), nullable=True)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_role"),)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    username: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    passport_visibility: Mapped[str] = mapped_column(
        String(16), default=PassportVisibility.UNLISTED, nullable=False
    )
    region_id: Mapped[int | None] = mapped_column(ForeignKey("regions.id"), nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default=UserStatus.PENDING_VERIFICATION, nullable=False
    )
    # Tezkor Auth (markazlashgan Telegram-orqali kirish) identifikatori — bu
    # `TelegramLink.chat_id` bilan ALOQASI YO'Q (u IMKON'ning o'z bildirishnoma
    # boti uchun, alohida maqsad/xizmat).
    telegram_user_id: Mapped[int | None] = mapped_column(
        BigInteger, unique=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    roles: Mapped[list[Role]] = relationship(secondary="user_roles", lazy="selectin")
    disability_profile: Mapped[DisabilityProfile | None] = relationship(
        back_populates="user", uselist=False, lazy="selectin"
    )


class DisabilityProfile(Base):
    """Maxfiy — alohida jadval, alohida ruxsat qatlami (CONTRIBUTING.md 6-qoida)."""

    __tablename__ = "disability_profiles"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    group_type: Mapped[str | None] = mapped_column(String(16), nullable=True)
    categories: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    work_conditions: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    verified_status: Mapped[str] = mapped_column(
        String(16), default=VerifiedStatus.NONE, nullable=False
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    doc_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Joriy (hali ko'rib chiqilmagan yoki oxirgi) yuborish vaqti — har qayta
    # yuborishda yangilanadi, moderatsiya navbatida "necha kun oldin" uchun.
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # Faqat egasiga ko'rinadi (nima uchun rad etilganini tushunib qayta yuborishi uchun).
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[User] = relationship(back_populates="disability_profile")


class RefreshToken(Base):
    """Refresh token rotatsiyasi — har token jti bilan, bekor qilinishi mumkin."""

    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PhoneVerification(Base):
    """Telefon tasdiqlash kodi — qisqa muddatli, bir marta ishlatiladi."""

    __tablename__ = "phone_verifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PasswordResetToken(Base):
    """QA_AUDIT D7: admin foydalanuvchi uchun bir martalik tiklash havolasi
    yaratadi - parolning o'zini HECH QACHON ko'rmaydi/o'rnatmaydi, faqat shu
    tokenga ega havolani (istalgan kanal orqali - Telegram, telefon va h.k.)
    foydalanuvchiga yetkazadi."""

    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
