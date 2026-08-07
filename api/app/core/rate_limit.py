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
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
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
