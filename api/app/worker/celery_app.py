"""Celery ilovasi — video transcode navbati + kunlik beat vazifalari.

Beat scheduler worker jarayonining o'zida ishlaydi (`celery worker --beat`,
Railway worker xizmati start command'ida) — alohida beat xizmati emas, bitta
worker instansi bo'lgani uchun bu yetarli (ko'p-instansli scale qilinsa
alohida beat xizmatiga o'tish kerak bo'ladi).
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "imkon",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.worker.tasks", "app.worker.notification_tasks", "app.worker.subscription_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_time_limit=1800,  # 30 daqiqa — uzun videolar uchun
    beat_schedule={
        "expire-subscriptions-daily": {
            "task": "expire_subscriptions",
            "schedule": crontab(hour=3, minute=0),
        },
        "remind-expiring-subscriptions-daily": {
            "task": "remind_expiring_subscriptions",
            "schedule": crontab(hour=9, minute=0),
        },
    },
)
