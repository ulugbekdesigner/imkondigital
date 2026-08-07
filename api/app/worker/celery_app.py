"""Celery ilovasi — video transcode navbati + kunlik beat vazifalari.

Beat scheduler worker jarayonining o'zida, HAR DOIM ishga tushadi — Railway
worker xizmatining start command'ini o'zgartirish imkoni bo'lmagani sabab
(`--beat` CLI bayrog'i o'rniga) shartsiz bootstep orqali ilova darajasida
yoqilgan (pastdagi `_BeatStep`, Celery'ning ichki `celery.worker.components:Beat`
komponentini takrorlaydi, lekin `beat=True` CLI argumentiga bog'liq emas).
Bitta worker instansi bo'lgani uchun bu yetarli — ko'p-instansli scale
qilinsa, bir nechta beat bir vaqtda ishlab vazifalarni takrorlab yuborishi
mumkin, shu holatda alohida beat xizmatiga o'tish kerak bo'ladi.
"""

from typing import Any

from celery import Celery, bootsteps
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


class _BeatStep(bootsteps.StartStopStep):  # type: ignore[misc]
    """`celery worker --beat` ichki komponentining shartsiz nusxasi.

    Railway worker start command'ini `--beat` bilan yangilab bo'lmagani
    uchun (infratuzilma cheklovi) — shu bootstep o'rniga har doim yoqilgan
    holda ishlaydi, CLI bayrog'iga muhtoj emas.
    """

    def create(self, worker: Any) -> object:
        import os

        from celery.beat import EmbeddedService

        # /app (Dockerfile WORKDIR) root'ga tegishli, worker esa "imkon"
        # (non-root) sifatida ishlaydi — schedule faylini yoziladigan
        # HOME ostiga qo'yamiz (Dockerfile'da allaqachon chown qilingan).
        schedule_path = os.path.join(os.environ.get("HOME", "/tmp"), "celerybeat-schedule")
        return EmbeddedService(
            worker.app, schedule_filename=schedule_path, scheduler_cls=worker.scheduler
        )


celery_app.steps["worker"].add(_BeatStep)
