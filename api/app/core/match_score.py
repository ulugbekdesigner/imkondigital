"""Vakansiya-nomzod moslik hisoblagichi (Match Score v1) — qoidaga asoslangan, deterministik.

Uch asosiy mezon, 100 balgacha:
  1. Ko'nikma darajasi (Narvon pog'onasi mosligi) — 40 ball
  2. Ish formati mosligi (remote/hybrid/office) — 35 ball
  3. Hudud mosligi — 25 ball

Ustiga, agar vakansiyada kamida bitta moslashtirilgan sharoit (accommodations)
ko'rsatilgan bo'lsa — +5 ball bonus (umumiy natija baribir 100 dan oshmaydi,
shuning uchun mukammal moslikda bonus ko'rinmasligi mumkin — bu ataylab,
allaqachon 100% mos vakansiyaga qo'shimcha ustuvorlik shart emas).

AI'siz, sof funksiya — DB yoki tarmoq kerak emas, shuning uchun to'liq
unit testlanadi (app/modules/employer va app/modules/search servislari
buni chaqiradi).
"""

from app.models.enums import WorkFormat


def _step_score(vacancy_step: int, user_max_step: int) -> int:
    if user_max_step >= vacancy_step:
        return 40
    if user_max_step == vacancy_step - 1:
        return 20
    return 0


def _work_format_score(work_format: str, user_remote_only: bool) -> int:
    if work_format == WorkFormat.REMOTE:
        return 35
    if work_format == WorkFormat.HYBRID:
        return 20 if not user_remote_only else 10
    # office
    return 0 if user_remote_only else 35


def _region_score(
    work_format: str, vacancy_region_id: int | None, user_region_id: int | None
) -> int:
    if work_format == WorkFormat.REMOTE:
        return 25  # masofaviy ishda hudud to'siq emas
    if vacancy_region_id is not None and vacancy_region_id == user_region_id:
        return 25
    return 5  # boshqa hudud — hali ham ko'rinadi, lekin past ustuvorlik


_ACCOMMODATIONS_BONUS = 5


def compute_match_score(
    *,
    vacancy_ladder_step: int,
    user_max_ladder_step: int,
    work_format: str,
    user_remote_only: bool,
    vacancy_region_id: int | None,
    user_region_id: int | None,
    has_accommodations: bool = False,
) -> int:
    score = (
        _step_score(vacancy_ladder_step, user_max_ladder_step)
        + _work_format_score(work_format, user_remote_only)
        + _region_score(work_format, vacancy_region_id, user_region_id)
        + (_ACCOMMODATIONS_BONUS if has_accommodations else 0)
    )
    return max(0, min(100, score))
