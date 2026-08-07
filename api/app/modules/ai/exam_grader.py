"""Yakuniy amaliy imtihonni AI orqali avtomatik baholash — V2-3/B3.3.

AI + Ustoz duetining birinchi bosqichi: bu modul faqat Gemini chaqiruvi va
strukturaviy javobni ajratishga (parsing) mas'ul. Natijani saqlash, kvota
tekshiruvi va ustoz tasdiqlash oqimi `app/modules/assessment/service.py`da.
"""

import json
from dataclasses import dataclass

from app.core.ai_client import generate_ai_reply
from app.models.course import Course
from app.models.enums import AssessmentVerdict
from app.models.user import User

_VALID_VERDICTS = {v.value for v in AssessmentVerdict}


@dataclass
class GradeResult:
    score_pct: int
    readiness_pct: int
    feedback: str
    verdict: str


def _clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, value))


def _system_prompt(course: Course) -> str:
    brief = course.final_exam_brief or "(topshiriq sharti ko'rsatilmagan)"
    return (
        "Siz IMKON Digital platformasidagi ustoz-baholovchisiz — nogironligi bor "
        f"insonlarning yakuniy amaliy imtihon-loyihasini baholaysiz. Kurs: '{course.title}'. "
        f"Topshiriq sharti: {brief}\n\n"
        "Foydalanuvchi javobini talabga mosligi, sifati va mustaqil ishlash darajasi "
        "bo'yicha baholang. FAQAT quyidagi JSON formatida javob bering, boshqa hech "
        "qanday matn (izoh, ```json belgisi va h.k.) yozmang:\n"
        '{"score_pct": <0-100 butun son>, "readiness_pct": <0-100 butun son>, '
        '"feedback": "<3-5 gaplik, lotin yozuvidagi o\'zbekcha izoh: nima yaxshi, '
        'nima yetishmaydi>", "verdict": "ready" | "needs_practice" | "retake"}'
    )


def _fallback(reason: str) -> GradeResult:
    return GradeResult(
        score_pct=0,
        readiness_pct=0,
        feedback=(
            f"AI tahlili amalga oshmadi ({reason}) — ustoz tomonidan qo'lda ko'rib chiqiladi."
        ),
        verdict=AssessmentVerdict.NEEDS_PRACTICE,
    )


def _parse(reply: str) -> GradeResult:
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").removeprefix("json").strip()
    try:
        data = json.loads(cleaned)
        verdict = str(data["verdict"]).strip().lower()
        if verdict not in _VALID_VERDICTS:
            raise ValueError(f"noma'lum verdict: {verdict}")
        return GradeResult(
            score_pct=_clamp(int(data["score_pct"])),
            readiness_pct=_clamp(int(data["readiness_pct"])),
            feedback=str(data["feedback"])[:2000],
            verdict=verdict,
        )
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return _fallback("javob formati noto'g'ri")


async def grade_submission(
    *, user: User, course: Course, submission_text: str, has_file: bool
) -> GradeResult:
    user_content = submission_text.strip() or "(matn kiritilmagan)"
    if has_file:
        user_content += "\n\n(Foydalanuvchi qo'shimcha fayl ham biriktirgan.)"

    reply = await generate_ai_reply(
        system=_system_prompt(course),
        messages=[{"role": "user", "content": user_content}],
        max_tokens=2048,
    )
    return _parse(reply)
