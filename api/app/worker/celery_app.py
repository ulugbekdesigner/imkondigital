"""Celery ilovasi — video transcode navbati."""

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "imkon",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.worker.tasks", "app.worker.notification_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_time_limit=1800,  # 30 daqiqa — uzun videolar uchun
)
