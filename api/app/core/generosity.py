"""Saxovat darajasi — bepul kurs ustozlari uchun tan olish tizimi (V2-4/B5).

Qoidaga asoslangan, deterministik (AI'siz) — match_score.py bilan bir xil
falsafa: sof funksiya, DB/tarmoq kerak emas, to'liq unit testlanadi. Daraja
hech qayerda saqlanmaydi — har doim real completed-o'quvchilar sonidan
qayta hisoblanadi (denormalizatsiya kerak emas).
"""

_THRESHOLDS: tuple[tuple[int, str], ...] = (
    (200, "gold"),
    (50, "silver"),
    (10, "bronze"),
)


def compute_generosity_tier(free_course_completions: int) -> str | None:
    """Instructor'ning BEPUL kurslarini tugatgan (turli) o'quvchilar soni asosida."""
    for threshold, tier in _THRESHOLDS:
        if free_course_completions >= threshold:
            return tier
    return None
