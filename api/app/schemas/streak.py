"""Kunlik faollik ketma-ketligi (streak) sxemalari."""

from datetime import date

from pydantic import BaseModel


class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: date | None
    active_today: bool
