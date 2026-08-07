"""Notification Center va Telegram bog'lash sxemalari."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    category: str
    title: str
    body: str
    link_url: str | None
    read_at: datetime | None
    created_at: datetime


class NotificationPage(BaseModel):
    items: list[NotificationOut]
    unread_count: int


class TelegramLinkCodeOut(BaseModel):
    code: str
    bot_username: str
    expires_in_minutes: int


class TelegramLinkStatusOut(BaseModel):
    linked: bool


class TelegramConfirmLinkRequest(BaseModel):
    code: str
    chat_id: int
