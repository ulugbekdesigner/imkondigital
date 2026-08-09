"""Auth so'rov/javob sxemalari."""

import re

from pydantic import BaseModel, Field, field_validator

# O'zbekiston telefon raqami: +998 dan keyin 9 raqam
_PHONE_RE = re.compile(r"^\+998\d{9}$")


def normalize_phone(value: str) -> str:
    """Turli formatlarni +998XXXXXXXXX ga keltiradi."""
    digits = re.sub(r"\D", "", value)
    if digits.startswith("998"):
        digits = digits[3:]
    elif digits.startswith("8") and len(digits) == 10:
        digits = digits[1:]
    candidate = f"+998{digits}"
    if not _PHONE_RE.match(candidate):
        raise ValueError("Telefon raqami +998 formatida va 9 raqamdan iborat bo'lishi kerak")
    return candidate


class RegisterRequest(BaseModel):
    phone: str
    full_name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class RegisterResponse(BaseModel):
    user_id: int
    phone: str
    status: str
    # Faqat development muhitida — SMS shlyuzi ulanmaguncha kod shu yerda qaytadi.
    dev_code: str | None = None


class VerifyPhoneRequest(BaseModel):
    phone: str
    code: str = Field(min_length=6, max_length=6)

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class LoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalize_phone(v)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # access token amal qilish muddati (soniya)


class PasswordResetLinkOut(BaseModel):
    """Admin uchun - havolaning o'zi, parolning o'zi EMAS."""

    link: str
    expires_at: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
