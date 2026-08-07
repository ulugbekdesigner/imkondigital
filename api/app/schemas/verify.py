"""Sertifikat tekshirish (public) sxemasi."""

from datetime import datetime

from pydantic import BaseModel


class CertificateVerifyOut(BaseModel):
    uid: str
    full_name: str
    course_id: int | None
    course_title: str | None
    issued_at: datetime
    qr_url: str | None
    pdf_url: str | None
