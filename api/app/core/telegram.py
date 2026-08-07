"""Telegram Bot API bilan ishlash — xabar yuborish va bog'lash kodini xeshlash.

Bog'lash kodi (deep-link token) parol emas, bir martalik yuqori-entropiyali
qiymat — shuning uchun argon2 emas, tez qidiriladigan SHA-256 xesh ishlatiladi
(qidiruv kodning o'zi bo'yicha, foydalanuvchi bo'yicha emas).
"""

import hashlib
import secrets

import httpx

from app.core.config import get_settings

settings = get_settings()

TELEGRAM_API_BASE = "https://api.telegram.org"


def generate_link_code() -> str:
    """Botga /start deep-link orqali yuboriladigan bir martalik token."""
    return secrets.token_urlsafe(16)


def hash_link_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


async def send_telegram_message(chat_id: int, text: str) -> bool:
    """Bot API orqali xabar yuboradi. Dev tokenida (haqiqiy bot yo'q) jim False qaytaradi."""
    if not settings.telegram_bot_token or settings.telegram_bot_token.startswith("dev-"):
        return False
    url = f"{TELEGRAM_API_BASE}/bot{settings.telegram_bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text})
            return resp.status_code == 200
        except httpx.HTTPError:
            return False
