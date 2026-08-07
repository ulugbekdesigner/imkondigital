"""Sertifikat PDF + QR generatsiyasi (fpdf2 + qrcode, ikkalasi ham sof Python).

Kurs 100% tugallanganda chaqiriladi (app/modules/courses/service.py).
Natija MinIO'ga yuklanadi va (pdf_url, qr_url) qaytariladi.
"""

import io
import secrets

import qrcode
from fpdf import FPDF

from app.core import storage
from app.core.config import get_settings

settings = get_settings()

# "Narvon" brend ranglari (packages/config/tailwind-preset.js bilan sinxron)
_DEEP = (10, 53, 41)
_PRIMARY = (14, 124, 95)
_INK_SOFT = (74, 93, 86)


def generate_uid() -> str:
    return f"IMKON-{secrets.token_hex(4).upper()}"


def _build_qr(verify_url: str) -> bytes:
    img = qrcode.make(verify_url, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _build_pdf(
    *, full_name: str, course_title: str, uid: str, issued_at: str, qr_png: bytes
) -> bytes:
    pdf = FPDF(orientation="L", unit="mm", format="A5")
    pdf.set_auto_page_break(False)  # bitta sahifali hujjat — pastki matn "yangi sahifa"ga tushmasin
    pdf.add_page()
    pdf.set_fill_color(*_DEEP)
    pdf.rect(0, 0, pdf.w, 18, style="F")

    pdf.set_xy(0, 4)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(pdf.w, 10, "IMKON DIGITAL", align="C")

    pdf.set_xy(0, 30)
    pdf.set_text_color(*_INK_SOFT)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(pdf.w, 8, "Ushbu sertifikat quyidagi shaxsga beriladi:", align="C")

    pdf.set_xy(0, 42)
    pdf.set_text_color(*_DEEP)
    pdf.set_font("Helvetica", "B", 22)
    pdf.cell(pdf.w, 12, full_name, align="C")

    pdf.set_xy(0, 58)
    pdf.set_text_color(*_INK_SOFT)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(pdf.w, 8, "kursni muvaffaqiyatli yakunlagani uchun:", align="C")

    pdf.set_xy(0, 70)
    pdf.set_text_color(*_PRIMARY)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(pdf.w, 10, course_title, align="C")

    # QR — pastki o'ng burchak
    qr_stream = io.BytesIO(qr_png)
    pdf.image(qr_stream, x=pdf.w - 35, y=pdf.h - 35, w=25, h=25)

    pdf.set_xy(10, pdf.h - 20)
    pdf.set_text_color(*_INK_SOFT)
    pdf.set_font("Courier", "", 9)
    pdf.cell(0, 5, f"ID: {uid}", align="L")
    pdf.set_xy(10, pdf.h - 15)
    pdf.cell(0, 5, f"Sana: {issued_at}", align="L")
    pdf.set_xy(10, pdf.h - 10)
    pdf.cell(0, 5, f"Tekshirish: {settings.site_url}/verify/{uid}", align="L")

    out = pdf.output()
    return bytes(out)


def issue_certificate(
    *, uid: str, full_name: str, course_title: str, issued_at: str
) -> tuple[str, str]:
    """PDF + QR yaratadi, yuklaydi va (pdf_url, qr_url) qaytaradi."""
    verify_url = f"{settings.site_url}/verify/{uid}"
    qr_png = _build_qr(verify_url)
    pdf_bytes = _build_pdf(
        full_name=full_name, course_title=course_title, uid=uid, issued_at=issued_at, qr_png=qr_png
    )

    storage.ensure_bucket()
    qr_url = storage.upload_fileobj(io.BytesIO(qr_png), f"certificates/{uid}-qr.png", "image/png")
    pdf_url = storage.upload_fileobj(
        io.BytesIO(pdf_bytes), f"certificates/{uid}.pdf", "application/pdf"
    )
    return pdf_url, qr_url
