FROM python:3.12-slim AS base

# curl (healthcheck), ffmpeg (video transcode — worker shu image'dan foydalanadi),
# postgresql-client (pg_dump — kunlik DB backup vazifasi, worker)
RUN apt-get update && apt-get install -y --no-install-recommends curl ffmpeg postgresql-client \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Bog'liqliklarni alohida qatlamda o'rnatamiz (kesh uchun) — faqat runtime
# paketlar (dev extras: ruff/mypy/pytest CI'da to'g'ridan-to'g'ri o'rnatiladi,
# bu image ichida kerak emas — image yupqa va attack surface kichik bo'lsin).
COPY pyproject.toml ./
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

RUN pip install --no-cache-dir .

# --home + .cache: faster-whisper (AI subtitr) modelni birinchi ishlatishda
# shu yerga yuklab oladi (huggingface_hub kesh papkasi) — yozish huquqi kerak.
RUN addgroup --system --gid 1001 imkon \
    && adduser --system --uid 1001 --gid 1001 --home /home/imkon imkon \
    && mkdir -p /home/imkon/.cache \
    && chown -R imkon:imkon /home/imkon
ENV HOME=/home/imkon
USER imkon

EXPOSE 8000

# Startda migratsiyalarni qo'llaymiz, so'ng serverni ishga tushiramiz
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
