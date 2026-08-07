"""To'lov provayder webhooklari — /v1/payments/payme, /v1/payments/click/*.

Bu endpoint'lar bizning frontendimiz uchun emas — Payme/Click serverlari
chaqiradi. Shuning uchun autentifikatsiya JWT emas, balki har provayderning
o'z protokoli (Payme: Basic Auth, Click: MD5 imzo).
"""

from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.modules.payments import click, payme

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/payme")
async def payme_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    body = await request.json()
    auth_header = request.headers.get("Authorization")
    return await payme.handle_payme_request(db, body, auth_header)


@router.post("/click/prepare")
async def click_prepare_webhook(
    request: Request, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    form = dict(await request.form())
    return await click.handle_click_prepare(db, form)


@router.post("/click/complete")
async def click_complete_webhook(
    request: Request, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    form = dict(await request.form())
    return await click.handle_click_complete(db, form)
