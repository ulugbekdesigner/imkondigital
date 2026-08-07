"""Imtiyozlarni shaxsiylashtirish — sof funksiya, DB'siz testlanadi.

Match Score (v0.6) bilan bir xil falsafa: oddiy qoidaga asoslangan, AI yo'q.
"""


def is_relevant_to_user(
    *,
    benefit_region_id: int | None,
    benefit_disability_categories: list[str],
    user_region_id: int | None,
    user_disability_categories: list[str],
) -> bool:
    """Imtiyoz foydalanuvchiga tegishlimi — hudud va nogironlik toifasi bo'yicha.

    Cheklov qo'yilmagan maydon (None yoki bo'sh ro'yxat) — hammaga tegishli
    degani.
    """
    region_match = benefit_region_id is None or benefit_region_id == user_region_id
    category_match = not benefit_disability_categories or bool(
        set(benefit_disability_categories) & set(user_disability_categories)
    )
    return region_match and category_match
