from celery import Celery

from core.config import settings

celery_app = Celery("charnik_worker", broker=settings.CELERY_BROKER_URL, include=["services.email_service"])

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
