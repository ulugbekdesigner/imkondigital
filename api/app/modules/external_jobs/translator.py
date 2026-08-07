"""Xalqaro ish e'lonini o'zbekchaga tarjima qilish va Narvon pog'onasiga taqsimlash.

exam_grader.py bilan bir xil naqsh: qat'iy JSON javob so'raladi, formatga mos
kelmasa xatolik ko'tarilmaydi — chaqiruvchi original (ingliz) matn bilan
davom etadi (tarjima ixtiyoriy sayqal, sinxronizatsiyani to'xtatmasligi kerak).
"""

import json
from dataclasses import dataclass

from fastapi import HTTPException

from app.core.ai_client import generate_ai_reply
from app.modules.external_jobs.fetchers import RawExternalJob

_LADDER_STEPS = (
    "0 = Savodxonlik (maxsus ko'nikma talab qilmaydi), "
    "1 = Yordamchi/operator darajasi, "
    "2 = Mutaxassislik (aniq kasbiy ko'nikma), "
    "3 = IT/dasturlash/texnik yuqori daraja, "
    "4 = Tadbirkorlik/rahbarlik darajasi"
)

_SYSTEM_PROMPT = (
    "Siz IMKON Digital platformasi uchun xalqaro ish e'lonlarini qayta ishlaysiz. "
    "Bu platforma nogironligi bor insonlar uchun inklyuziv karyera xizmati. "
    "Berilgan ingliz tilidagi ish e'lonini (sarlavha+tavsif) lotin yozuvidagi "
    "o'zbek tiliga aniq va tabiiy tarjima qiling, va uni Narvon pog'onasi "
    f"bo'yicha tasniflang ({_LADDER_STEPS}).\n\n"
    "FAQAT quyidagi JSON formatida javob bering, boshqa hech qanday matn "
    "(izoh, ```json belgisi va h.k.) yozmang:\n"
    '{"title_uz": "<tarjima qilingan sarlavha>", '
    '"description_uz": "<tarjima qilingan tavsif, 3-6 gap, qisqartirilgan>", '
    '"ladder_step": <0-4 butun son>}'
)


@dataclass
class TranslationResult:
    title_uz: str
    description_uz: str
    ladder_step: int


def _parse(reply: str) -> TranslationResult | None:
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").removeprefix("json").strip()
    try:
        data = json.loads(cleaned)
        step = max(0, min(4, int(data["ladder_step"])))
        return TranslationResult(
            title_uz=str(data["title_uz"])[:300],
            description_uz=str(data["description_uz"])[:4000],
            ladder_step=step,
        )
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return None


async def translate_and_classify(job: RawExternalJob) -> TranslationResult | None:
    """`None` — tarjima muvaffaqiyatsiz (AI xizmati xatosi yoki noto'g'ri format).

    Ommaviy sinxronizatsiyada bitta ishning tarjimasi muvaffaqiyatsiz bo'lishi
    BUTUN partiyani to'xtatmasligi kerak — shu sabab `generate_ai_reply`ning
    502 `HTTPException`si ham shu yerda ushlanadi (chaqiruvchiga chiqarilmaydi).
    """
    user_content = (
        f"Sarlavha: {job.title}\nKompaniya: {job.company_name}\n"
        f"Tavsif: {job.description[:3000]}"
    )
    try:
        reply = await generate_ai_reply(
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
            max_tokens=1024,
        )
    except HTTPException:
        return None
    return _parse(reply)
