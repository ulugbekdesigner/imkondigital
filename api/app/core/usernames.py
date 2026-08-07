"""Foydalanuvchi nomi (username) - public passport manzili uchun (/u/{username})."""

import re
import secrets

# Ko'p belgili o'zbekcha ketma-ketliklar (str.translate faqat 1 belgini map qiladi)
_MULTI_CHAR_REPLACEMENTS = (
    ("oʻ", "o"),
    ("gʻ", "g"),
    ("o‘", "o"),
    ("g‘", "g"),
)

# Bitta belgili apostrof variantlari — olib tashlanadi
_STRIP_CHARS = str.maketrans({"'": "", "ʻ": "", "‘": "", "’": ""})


def slugify_username(full_name: str) -> str:
    base = full_name.lower()
    for old, new in _MULTI_CHAR_REPLACEMENTS:
        base = base.replace(old, new)
    base = base.translate(_STRIP_CHARS)
    base = re.sub(r"[^a-z0-9]+", "_", base).strip("_")
    return base[:24] or "user"


def random_suffix() -> str:
    return secrets.token_hex(3)
