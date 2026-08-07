"""Ustozning yillik shaxsiy impact-sertifikati — "Ijtimoiy hisobot" (V2-4/B5).

Bepul kurslar orqali yordam bergan (tugatgan) o'quvchilar soni asosida,
so'rov bo'yicha (on-demand) generatsiya qilinadi — alohida jadvalda
saqlanmaydi, har chaqiriqda real joriy son bilan qayta hisoblanadi.
"""

import io
import secrets

from fpdf import FPDF

from app.core import storage
from app.core.pdf_text import latin1_safe

_DEEP = (10, 53, 41)
_PRIMARY = (14, 124, 95)
_INK_SOFT = (74, 93, 86)


def _build_pdf(*, full_name: str, total_students: int, generated_at: str) -> bytes:
    pdf = FPDF(orientation="L", unit="mm", format="A5")
    pdf.set_auto_page_break(False)
    pdf.add_page()
    pdf.set_fill_color(*_DEEP)
    pdf.rect(0, 0, pdf.w, 18, style="F")

    pdf.set_xy(0, 4)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(pdf.w, 10, "IMKON DIGITAL - IJTIMOIY TA'SIR", align="C")

    pdf.set_xy(0, 32)
    pdf.set_text_color(*_INK_SOFT)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(pdf.w, 8, "Hurmatli", align="C")

    pdf.set_xy(0, 44)
    pdf.set_text_color(*_DEEP)
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(pdf.w, 12, latin1_safe(full_name), align="C")

    pdf.set_xy(0, 60)
    pdf.set_text_color(*_PRIMARY)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(
        pdf.w,
        10,
        f"Sizning bepul kurslaringiz orqali {total_students} kishi kasb o'rgandi",
        align="C",
    )

    pdf.set_xy(0, 76)
    pdf.set_text_color(*_INK_SOFT)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(pdf.w, 8, "Saxovatingiz uchun rahmat - bu haqiqiy hayotlarga ta'sir qildi.", align="C")

    pdf.set_xy(10, pdf.h - 12)
    pdf.set_font("Courier", "", 9)
    pdf.cell(0, 5, f"Sana: {generated_at}", align="L")

    out = pdf.output()
    return bytes(out)


def issue_impact_certificate(*, full_name: str, total_students: int, generated_at: str) -> str:
    pdf_bytes = _build_pdf(
        full_name=full_name, total_students=total_students, generated_at=generated_at
    )
    storage.ensure_bucket()
    key = f"impact-certificates/{secrets.token_hex(6)}.pdf"
    return storage.upload_fileobj(io.BytesIO(pdf_bytes), key, "application/pdf")
