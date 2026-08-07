# IMKON Digital

O'zbekistonda nogironligi bor insonlar uchun inklyuziv raqamli karyera platformasi.
**imkondigital.uz** · «Raqamli kasb — chegarasiz imkoniyat»

Qurilish rejasi: [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md).
Hissa qo'shish qoidalari: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Texnologik stek

| Qatlam   | Texnologiya                                      |
| -------- | ------------------------------------------------ |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind  |
| Backend  | FastAPI (Python 3.12) + SQLAlchemy 2 + Alembic   |
| DB       | PostgreSQL 16                                    |
| Cache    | Redis + Celery                                   |
| Storage  | S3-mos (MinIO dev)                               |
| Bot      | aiogram 3 (Telegram)                             |

## Monorepo

```
apps/web     Next.js — foydalanuvchi + ustoz + employer
apps/admin   Next.js — admin/moderator panel
apps/bot     aiogram Telegram bot
api/         FastAPI backend
packages/ui  Umumiy UI komponentlar
packages/config  eslint / tsconfig / tailwind preset
```

## Boshlash (dev)

Talablar: Docker + Docker Compose, Node ≥20, pnpm 11, Python 3.12.

```bash
# 1. Frontend paketlarini o'rnatish
pnpm install

# 2. Barcha servislarni ko'tarish (postgres, redis, minio, api, web)
docker compose up

# Web:   http://localhost:3000
# UI ko'rgazma: http://localhost:3000/dev/ui
# API:   http://localhost:8000/docs
# MinIO: http://localhost:9001
```

## Bosqichlar

Har bosqich = git tag. Joriy holat: **v0.1 — Poydevor**.
To'liq reja: [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md).
