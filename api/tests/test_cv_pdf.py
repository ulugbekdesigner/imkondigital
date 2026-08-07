"""CV PDF render — Unicode/"smart" tinish belgilarini xavfsiz ishlashi (sof funksiya)."""

from app.core.cv_pdf import render_cv_pdf


def test_renders_plain_ascii_content() -> None:
    pdf_bytes = render_cv_pdf(full_name="Test Foydalanuvchi", content="# Sarlavha\n\n- Band")
    assert pdf_bytes.startswith(b"%PDF")


def test_renders_content_with_em_and_en_dash() -> None:
    """Real Gemini javoblarida uchraydi — avval FPDFUnicodeEncodingException bilan yiqilardi."""
    content = "Tajriba — 3 yil. Muddat 2020–2023."
    pdf_bytes = render_cv_pdf(full_name="Test", content=content)
    assert pdf_bytes.startswith(b"%PDF")


def test_renders_content_with_smart_quotes_and_bullet() -> None:
    content = "‘chap’ va “o'ng” qo'shtirnoq … hamda • band"
    pdf_bytes = render_cv_pdf(full_name="Test", content=content)
    assert pdf_bytes.startswith(b"%PDF")


def test_renders_full_name_with_unicode_punctuation() -> None:
    pdf_bytes = render_cv_pdf(full_name="Ism — Familiya", content="Oddiy matn")
    assert pdf_bytes.startswith(b"%PDF")


def test_renders_unknown_unicode_character_without_crashing() -> None:
    """Har qanday tanib bo'lmas belgi ham dasturni yiqitmasligi kerak (xavfsizlik to'ri)."""
    content = "Emoji bilan matn \U0001f600 davom etadi"
    pdf_bytes = render_cv_pdf(full_name="Test", content=content)
    assert pdf_bytes.startswith(b"%PDF")
