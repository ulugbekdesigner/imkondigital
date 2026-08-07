"""Public sertifikat tekshirish — /v1/verify/{uid}. Autentifikatsiya talab qilmaydi."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.user import User
from app.schemas.verify import CertificateVerifyOut

router = APIRouter(prefix="/verify", tags=["verify"])


@router.get("/{cert_uid}", response_model=CertificateVerifyOut)
async def verify_certificate(
    cert_uid: str, db: AsyncSession = Depends(get_db)
) -> CertificateVerifyOut:
    row = (
        await db.execute(
            select(Certificate, User, Course.title)
            .join(User, User.id == Certificate.user_id)
            .outerjoin(Course, Course.id == Certificate.course_id)
            .where(Certificate.uid == cert_uid)
        )
    ).first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu ID bo'yicha sertifikat topilmadi",
        )
    cert, user, course_title = row
    return CertificateVerifyOut(
        uid=cert.uid,
        full_name=user.full_name,
        course_id=cert.course_id,
        course_title=course_title,
        issued_at=cert.issued_at,
        qr_url=cert.qr_url,
        pdf_url=cert.pdf_url,
    )
