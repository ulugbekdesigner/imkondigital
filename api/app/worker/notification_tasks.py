"""Bildirishnoma yetkazish navbati — Telegram xabar yuborish, imtiyoz-mos push."""

import asyncio

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.core.telegram import send_telegram_message
from app.models.benefits import Benefit
from app.worker.celery_app import celery_app

settings = get_settings()


@celery_app.task(name="send_telegram_notification")  # type: ignore[untyped-decorator]
def send_telegram_notification(chat_id: int, text: str) -> dict[str, object]:
    ok = asyncio.run(send_telegram_message(chat_id, text))
    return {"chat_id": chat_id, "sent": ok}


async def _fan_out_benefit(benefit_id: int) -> int:
    from app.modules.benefits.service import fan_out_benefit_matches

    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    async with async_sessionmaker(engine)() as session:
        benefit = await session.get(Benefit, benefit_id)
        if benefit is None:
            await engine.dispose()
            return 0
        notified = await fan_out_benefit_matches(session, benefit)
    await engine.dispose()
    return notified


@celery_app.task(name="fan_out_benefit_notification")  # type: ignore[untyped-decorator]
def fan_out_benefit_notification(benefit_id: int) -> dict[str, object]:
    notified = asyncio.run(_fan_out_benefit(benefit_id))
    return {"benefit_id": benefit_id, "notified": notified}
