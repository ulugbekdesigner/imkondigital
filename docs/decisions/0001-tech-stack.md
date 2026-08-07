# ADR 0001 — Texnologik stek va monorepo tuzilishi

**Sana:** 2026-07 · **Holat:** Qabul qilingan · **Bosqich:** v0.1

## Kontekst

IMKON Digital — SSR talab qiladigan (SEO + sekin internet), accessibility-first,
ko'p rolli (user/instructor/employer/mentor/donor/gov/admin) platforma.

## Qaror

- **Monorepo (pnpm workspaces):** `apps/*` (web, admin, bot) + `packages/*` (ui, config).
  Backend `api/` alohida Python paketi — pnpm workspace'ga kirmaydi.
- **Frontend:** Next.js 14 App Router + TypeScript strict. shadcn/ui (Radix) — a11y poydevori.
- **Backend:** FastAPI async + SQLAlchemy 2 + Pydantic v2. Migratsiyalar faqat Alembic.
- **Dizayn tokenlari:** `packages/config` ichida yagona Tailwind preset. Inline rang/px taqiqlangan.
- **Dev muhit:** `docker compose up` bitta buyruq bilan postgres + redis + minio + api + web.

## Oqibatlar

- UI komponentlari `packages/ui` orqali web va admin o'rtasida bo'lishiladi.
- Har rang/o'lcham o'zgarishi bitta preset faylida — brend izchilligi kafolatlanadi.
- Python va Node lint/typecheck alohida CI joblarida.
