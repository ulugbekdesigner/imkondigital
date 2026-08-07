"""AI tuzgan CV matnini PDF'ga aylantiradi (fpdf2, sof Python).

Sertifikat PDF'idan farqli — bu ko'p sahifali hujjat, shu sabab
`set_auto_page_break` yoqilgan holda qoladi (standart).
"""

from fpdf import FPDF

from app.core.pdf_text import latin1_safe as _latin1_safe

_DEEP = (10, 53, 41)
_INK = (30, 41, 38)
_INK_SOFT = (74, 93, 86)


def render_cv_pdf(*, full_name: str, content: str) -> bytes:
    """`content` — AI tuzgan oddiy Markdown-uslub matn (# sarlavha, - band, oddiy qator)."""
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(18, 16, 18)
    pdf.add_page()

    pdf.set_text_color(*_DEEP)
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 10, _latin1_safe(full_name), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    for raw_line in content.splitlines():
        line = _latin1_safe(raw_line.strip())
        if not line:
            pdf.ln(3)
            continue
        if line.startswith("## "):
            pdf.set_text_color(*_DEEP)
            pdf.set_font("Helvetica", "B", 13)
            pdf.multi_cell(0, 8, line.removeprefix("## "), new_x="LMARGIN", new_y="NEXT")
        elif line.startswith("# "):
            pdf.set_text_color(*_DEEP)
            pdf.set_font("Helvetica", "B", 15)
            pdf.multi_cell(0, 9, line.removeprefix("# "), new_x="LMARGIN", new_y="NEXT")
        elif line.startswith(("- ", "* ")):
            pdf.set_text_color(*_INK)
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(0, 6, f"  - {line[2:]}", new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_text_color(*_INK_SOFT)
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(0, 6, line, new_x="LMARGIN", new_y="NEXT")

    out = pdf.output()
    return bytes(out)
