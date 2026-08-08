"""Redis asosidagi sodda IP-bo'yicha rate-limit — auth endpoint'lari uchun brute-force himoyasi.

Auth funksionalligi Redis nosozligiga qaram bo'lmasligi kerak, shu sabab
Redis xatosi jim yutiladi (bu holda so'rov CHEKLANMAYDI) — notification
Telegram integratsiyasida qo'llanilgan xuddi shu tamoyil (core amal doim
ishlashi kerak, yordamchi infratuzilma emas).
"""

from collections.abc import Awaitable, Callable

import redis.asyncio as aioredis
from fastapi import HTTPException, Request, status
from redis.exceptions import RedisError

from app.core.config import get_settings

settings = get_settings()
_redis: aioredis.Redis | None = None


def _client() -> aioredis.Redis:
    global _redis
    if _redis is None:
        # redis-py'ning from_url'i type stub'da untyped — runtime xavfsiz
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)  # type: ignore[no-untyped-call]
    return _redis


def _client_ip(request: Request) -> str:
    """Haqiqiy mijoz IP'sini aniqlaydi — soxtalashtirib bo'lmaydigan manbalarga ustuvorlik bilan.

    MUHIM: avval `X-Forwarded-For`ning BIRINCHI qiymatini (`.split(",")[0]`)
    ishlatardi — bu mijoz o'zi yuboradigan sarlavha, xohlagan qiymatga
    o'rnatib, har so'rovda o'zgartirib, HAR QANDAY IP-limitni (login,
    ro'yxatdan o'tish, Ziyo) butunlay chetlab o'tish mumkin edi (nginx/Railway
    haqiqiy IP'ni ZANJIR OXIRIGA qo'shadi, boshiga emas). To'g'irlandi:
    1) `CF-Connecting-IP` — Cloudflare proxy orqali o'tgan so'rovlarda
       Cloudflare o'zi qo'yadi, mijoz uni qayta yoza olmaydi (eng ishonchli).
    2) `X-Forwarded-For`ning OXIRGI qiymati — zanjirdagi eng yaqin/ishonchli
       proksi qo'shgan qiymat (mijozdan uzoqroq, ammo birinchisidan xavfsizroq).
    3) `request.client.host` — to'g'ridan-to'g'ri ulanish (proksi yo'q holat).
    """
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(
    scope: str, *, limit: int, window_seconds: int
) -> Callable[[Request], Awaitable[None]]:
    async def _checker(request: Request) -> None:
        key = f"ratelimit:{scope}:{_client_ip(request)}"
        try:
            count = await _client().incr(key)
            if count == 1:
                await _client().expire(key, window_seconds)
        except (RedisError, RuntimeError):
            # RuntimeError: asyncio-ning "Event loop is closed" xatosi ham shu
            # yerda ushlanadi — eskirgan (boshqa event loop'da yaratilgan)
            # ulanish yopilayotganda chiqadi, RedisError EMAS, lekin bu ham
            # xuddi shu "infratuzilma muammosi" toifasiga kiradi (yuqoridagi
            # modul izohi).
            return
        if count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.",
            )

    return _checker
