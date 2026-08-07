# IMKON Digital — hissa qo'shish qoidalari

## Loyiha

Inklyuziv raqamli karyera platformasi (imkondigital.uz).
Reja: `docs/MASTER_PLAN.md` — bosqichlardan chetga chiqilmaydi.

## Qat'iy qoidalar

1. TypeScript strict; Python type-hinted + mypy toza. `any` taqiqlangan.
2. Hech qanday placeholder, mock-data-in-prod, lorem ipsum, TODO qoldiq.
   Har funksiya to'liq ishlaydi yoki yozilmaydi.
3. Har yangi endpoint = Pydantic schema + test. Har UI komponent = a11y:
   klaviatura, focus-visible, ARIA, kontrast 4.5:1.
4. Dizayn faqat `packages/config` tokenlaridan. Inline rang/px taqiqlangan.
5. Matn tili: o'zbek (lotin). "Nogiron" so'zi taqiqlangan →
   "nogironligi bor inson". Rahm ohangi taqiqlangan.
6. `disability_profiles` ma'lumotlari default yashirin — har ochilish
   rozilik tekshiruvi bilan. Bu qoida buzilsa PR rad.
7. Migratsiyalar faqat Alembic orqali; modelga teginding — migratsiya yarat.
8. Commit: conventional commits (feat/fix/chore + modul scope).
9. Har bosqich oxirida sifat auditi va DoD checklist.
10. Sekin internet birinchi: har sahifa 3G'da sinab ko'rilgandek yozilsin
    (lazy load, HLS past bitrate, rasm optimallash).

## Ish tartibi

- Har bosqichni boshlashda: _"MASTER_PLAN.md dagi N-bosqichni bajaramiz"_.
- Bosqich oxirida DoD checklist to'liq yashil bo'lmaguncha keyingisiga o'tilmaydi.
- Har bosqich yakunida git tag: `v0.1`, `v0.2` ... `v1.0`.
