"""IMKON Digital Telegram bot — hisobni sayt bilan bog'lash (aiogram 3).

Bildirishnomalarni O'ZI yubormaydi — buni backend Celery task'i (Bot API
orqali to'g'ridan-to'g'ri) bajaradi. Bu jarayon faqat kiruvchi /start
buyrug'ini qabul qilib, hisobni bog'lash uchun ishlaydi.
"""

import asyncio
import os

import httpx
from aiogram import Bot, Dispatcher
from aiogram.filters import CommandObject, CommandStart
from aiogram.types import Message

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "dev-telegram-bot-token")
API_INTERNAL_URL = os.environ.get("API_INTERNAL_URL", "http://api:8000")
# API'dagi Settings.telegram_internal_secret bilan bir xil bo'lishi shart (ikkalasi ham
# env o'rnatilmasa shu standart qiymatga tushadi — Payme/Click kredentiallari bilan bir xil naqsh)
INTERNAL_SECRET = os.environ.get("TELEGRAM_INTERNAL_SECRET", "dev-telegram-internal-secret")

dp = Dispatcher()

WELCOME_TEXT = (
    "Salom! IMKON Digital botiga xush kelibsiz.\n\n"
    "Profilingizni bog'lash uchun saytdagi \"Telegram bog'lash\" tugmasini bosing "
    "va olingan havolani oching — men avtomatik tasdiqlayman."
)
LINK_OK_TEXT = (
    "Hisobingiz muvaffaqiyatli bog'landi ✓\n\n"
    "Endi ariza holati, buyurtma yangilanishlari va sertifikatlar haqida shu yerda "
    "xabar olasiz."
)
LINK_FAILED_TEXT = "Kod noto'g'ri yoki muddati o'tgan. Saytdan yangi kod so'rang."


@dp.message(CommandStart())
async def handle_start(message: Message, command: CommandObject) -> None:
    code = command.args
    if not code:
        await message.answer(WELCOME_TEXT)
        return

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{API_INTERNAL_URL}/v1/telegram/confirm-link",
            json={"code": code, "chat_id": message.chat.id},
            headers={"X-Internal-Secret": INTERNAL_SECRET},
        )

    await message.answer(LINK_OK_TEXT if resp.status_code == 200 else LINK_FAILED_TEXT)


async def main() -> None:
    if not BOT_TOKEN or BOT_TOKEN.startswith("dev-"):
        # Haqiqiy Telegram bot tokeni yo'q (dev muhit) — polling boshlanmaydi,
        # jarayon konteynerni tirik saqlash uchun tinch kutadi.
        print(
            "TELEGRAM_BOT_TOKEN o'rnatilmagan — bot polling boshlanmaydi (dev rejim).", flush=True
        )
        while True:
            await asyncio.sleep(3600)

    bot = Bot(token=BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
