"""fpdf2 core fontlari (Helvetica va h.k.) faqat Latin-1'ni qo'llab-quvvatlaydi —

AI yoki foydalanuvchi matnida chiqishi mumkin bo'lgan "smart" tinish
belgilarini mos ASCII/Latin-1 muqobiliga almashtiramiz. `cv_pdf.py` va
`impact_certificate.py` ikkalasi ham shu sabab (haqiqiy Gemini/foydalanuvchi
matni bilan Docker orqali sinovda topilgan `FPDFUnicodeEncodingException`
xatosi) shu funksiyani ishlatadi.
"""

_UNICODE_REPLACEMENTS = {
    "—": "-",  # em dash —
    "–": "-",  # en dash –
    "‘": "'",  # ‘
    "’": "'",  # ’
    "“": '"',  # “
    "”": '"',  # ”
    "…": "...",  # …
    "•": "-",  # •
}


def latin1_safe(text: str) -> str:
    for char, replacement in _UNICODE_REPLACEMENTS.items():
        text = text.replace(char, replacement)
    # Xavfsizlik to'ri — qolgan har qanday tanib bo'lmas belgi ham dasturni yiqitmasin.
    return text.encode("latin-1", errors="replace").decode("latin-1")
