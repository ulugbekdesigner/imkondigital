# IMKON DIGITAL — DEVELOPMENT MASTER PLAN

## imkondigital.uz · 10 bosqichli qurilish rejasi

**Versiya:** 1.0 | **Sana:** 2026-yil iyul
**Asos:** IMKON Digital Product Vision Book v1.1 (1–3-boblar)
**Ishlash muhiti:** VS Code | **Domen:** imkondigital.uz ✅

---

# 0. QANDAY ISHLATILADI

Bu hujjat — loyihaning **bosh qurilish rejasi**. Har bosqich = alohida ish sessiyasi (yoki bir nechta). Ish tartibi:

1. Repo root'ga ushbu faylni `docs/MASTER_PLAN.md` sifatida qo'y
2. `CONTRIBUTING.md` ni repo root'ga yarat (11-bo'lim)
3. Har bosqichni boshlashda: _"MASTER_PLAN.md dagi N-bosqichni bajaramiz"_
4. Bosqich oxirida **DoD (Definition of Done) checklist** to'liq yashil bo'lmaguncha keyingisiga o'tilmaydi
5. Har bosqich yakunida git tag: `v0.1`, `v0.2` ... `v1.0`

### Skill'lardan foydalanish qoidasi:

| Skill            | Qachon                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `/ui-ux-pro-max` | Har qanday yangi sahifa/komponent dizaynidan OLDIN                         |
| `/copywriting`   | Har qanday foydalanuvchi ko'radigan matn                                   |
| `/stop-slop`     | Har bosqich YAKUNIDA — kod sifat auditi                                    |

---

# 1. TEXNOLOGIK STEK (qat'iy)

| Qatlam     | Texnologiya                                          | Izoh                                    |
| ---------- | ---------------------------------------------------- | --------------------------------------- |
| Frontend   | **Next.js 14 (App Router) + TypeScript**             | SSR — SEO va sekin internet uchun       |
| UI         | **Tailwind CSS + shadcn/ui** (tokenlar bilan)        | Radix asosida — accessibility bepul     |
| Animatsiya | **Framer Motion** (`prefers-reduced-motion` hurmat)  |                                         |
| State      | React Query (server) + Zustand (UI)                  | Redux YO'Q                              |
| Backend    | **FastAPI (Python 3.12) + SQLAlchemy 2 + Alembic**   | async, Pydantic v2                      |
| DB         | **PostgreSQL 16**                                    | Yagona haqiqat manbai                   |
| Cache/Queue| **Redis** + **Celery**                               | sessiya, rate-limit, video/email/push   |
| Fayl/Video | S3-mos storage (MinIO dev) + HLS streaming           |                                         |
| Auth       | JWT (access 15min + refresh rotate) → OneID OAuth    |                                         |
| AI         | Google Gemini API                                    | Career Coach, CV Builder, Interview     |
| Bot        | **aiogram 3** (Telegram)                             | Notification Center kanali              |
| Infra      | **Docker Compose** (dev) → VPS + Nginx + Certbot     |                                         |
| CI         | GitHub Actions: lint → typecheck → test → build      |                                         |

### Monorepo strukturasi

```
imkondigital/
├── CONTRIBUTING.md
├── docs/
│   ├── MASTER_PLAN.md
│   └── decisions/             # ADR — arxitektura qarorlari jurnali
├── apps/
│   ├── web/                   # Next.js 14 (foydalanuvchi + ustoz + employer)
│   ├── admin/                 # Next.js — admin/moderator panel
│   └── bot/                   # aiogram Telegram bot
├── api/                       # FastAPI
│   ├── app/
│   │   ├── core/  models/  schemas/
│   │   ├── modules/           # auth users courses passport jobs marketplace
│   │   │                      # benefits ai notifications payments analytics
│   │   └── main.py
│   ├── alembic/
│   └── tests/
├── packages/
│   ├── ui/                    # umumiy UI komponentlar
│   └── config/                # eslint, tsconfig, tailwind preset
└── docker-compose.yml
```

---

# 2. DIZAYN TIZIMI — "NARVON" Design System

> `/ui-ux-pro-max` bilan har sahifada shu tizim qo'llanadi. Bu shablon emas — IMKON Digital'ning o'z yuzi.

### 2.1. Dizayn falsafasi

- **"Kuch, rahm emas":** hech qanday pastel-mayin "xayriya estetikasi". Bu professional karyera platformasi — ishonchli, zamonaviy, aniq.
- **Signature element — "Narvon" motivi:** Raqamli Narvon (0→4 pog'ona) butun saytda takrorlanadigan vizual til: progress indikatorlar zinapoya shaklida, pog'onali kompozitsiya, hero'da interaktiv narvon. Foydalanuvchi qayerda turganini doim KO'RADI.
- **Accessibility = dizaynning o'zi**, qo'shimcha rejim emas (2.4-bo'lim).

### 2.2. Rang tokenlari

```css
:root {
  /* Brand */
  --imkon-deep:    #0A3529;  /* asosiy to'q yashil — header, hero fon */
  --imkon-primary: #0E7C5F;  /* asosiy harakat rangi — tugmalar, linklar */
  --imkon-bright:  #17B884;  /* aktsent — progress, muvaffaqiyat holatlari */
  --imkon-mint:    #DFF3EC;  /* yumshoq fon bloklar */
  /* Neytral */
  --ink:      #14201C;  /* asosiy matn (sof qora emas) */
  --ink-soft: #4A5D56;  /* ikkilamchi matn */
  --paper:    #FAFBFA;  /* sahifa foni */
  --line:     #D8E3DE;  /* chiziqlar, borderlar */
  /* Semantik */
  --warn: #B7791F;  --error: #B3261E;  --info: #1D5FA0;
  /* Narvon pog'onalari (0→4 gradient) */
  --step-0: #9FBFB4; --step-1: #6FAE97; --step-2: #3E9A7C;
  --step-3: #17B884; --step-4: #FFC94D; /* oltin — tadbirkorlik cho'qqisi */
}
```

**Qoida:** kontrast har doim tekshiriladi — matn/fon minimal 4.5:1 (AA), yirik matn 3:1. `--imkon-bright` oq fonda MATN sifatida ishlatilmaydi — faqat indikator/fon sifatida.

### 2.3. Tipografika

| Rol                    | Shrift            | Izoh                                              |
| ---------------------- | ----------------- | ------------------------------------------------- |
| Display (H1-H2, hero)  | **Unbounded**     | Xarakterli, "raqamli" tuyg'u — faqat sarlavhalar  |
| Body + UI              | **Manrope**       | Ochiq, o'qiladigan, to'liq kirill/lotin           |
| Data/raqamlar          | **JetBrains Mono**| Statistika, sertifikat ID, kod bloklar            |

Type scale: 14 / 16 / 18 / 22 / 28 / 36 / 52. Body line-height 1.6. Foydalanuvchi sozlamasi: A− / A / A+ (rem asosida, layout buzilmaydi).

### 2.4. Accessibility standarti (har komponent uchun majburiy)

- WCAG 2.2 AA: kontrast, focus-visible (2px `--imkon-bright` ring + 2px offset), touch target ≥44px
- To'liq klaviatura navigatsiyasi; skip-to-content; semantik HTML + ARIA
- `prefers-reduced-motion` → barcha animatsiya o'chadi
- Yuqori kontrast rejimi (toggle, header'da doimiy) + dark mode
- Har rasm — alt; har video — subtitr; har forma xatosi — matnda ham (faqat rang bilan emas)
- **Har PR'da axe-core avtomatik test o'tadi (CI'da) — yiqilsa merge yo'q**

### 2.5. Copywriting ohangi (`/copywriting` uchun brif)

- Til: o'zbek (lotin) asosiy; ohang — hurmatli "siz", aniq, harakatga undovchi, RAHMSIZ-professional
- Tugma = aniq natija: "Kursni boshlash", "Arizani yuborish"
- Error: nima bo'ldi + qanday tuzatiladi. Empty state: keyingi qadam taklifi
- Taqiqlangan so'zlar: "nogiron" (→ "nogironligi bor inson"), "yordam beramiz" ohangi (→ "imkoniyat", "kasb", "daromad")

---

# 3. DATABASE SXEMASI (yadro, v1.0 uchun)

To'liq sxema uchun `docs/decisions/` va Alembic migratsiyalariga qarang. Yadro jadvallar:

- **Foydalanuvchilar/rollar:** `users`, `roles`, `user_roles`, `disability_profiles`, `regions`
- **Akademiya:** `courses`, `course_categories`, `course_modules`, `lessons`, `assignments`, `submissions`, `enrollments`, `certificates`
- **Skills Passport:** `skills`, `user_skills`, `portfolio_items`
- **Bandlik:** `companies`, `company_members`, `vacancies`, `applications`, `placements`
- **Marketplace:** `gigs`, `orders`, `order_messages`, `reviews`, `disputes`
- **Imtiyozlar:** `benefits`, `user_benefits`
- **Mentor:** `mentorships`, `mentor_checkins`
- **Bildirishnomalar:** `notifications`, `telegram_links`
- **To'lovlar:** `payments`, `payouts`
- **Donor/Gov:** `donor_programs`, `program_enrollments`, `audit_log`

**Muhim qoidalar:**

- `disability_profiles` — alohida jadval, alohida ruxsat: employer uni faqat nomzod ROZILIGIDA ko'radi
- Barcha statistika view'lar **anonimlashtirilgan** agregatlar orqali (gov/donor uchun)
- Soft-delete yo'q, `status` maydonlari bor; `audit_log` hamma kritik amalda yoziladi

---

# 4. API ARXITEKTURASI

REST, versiyalangan: `api.imkondigital.uz/v1/...`

**Standartlar:** Pydantic schema hamma joyda; xatolar RFC7807; pagination `?cursor=`; rate-limit Redis; OpenAPI avtodok `/docs`.

### RBAC matritsasi (qisqartma)

| Resurs               | user     | instructor    | employer       | mentor       | moderator | donor      | gov     | admin |
| -------------------- | -------- | ------------- | -------------- | ------------ | --------- | ---------- | ------- | ----- |
| Kurs yaratish        | –        | ✅            | –              | –            | ✅        | –          | –       | ✅    |
| Nomzod qidirish      | –        | –             | ✅             | –            | –         | –          | –       | ✅    |
| Disability tafsiloti | o'ziniki | –             | rozilik bilan  | shogirdiniki | ✅        | –          | –       | ✅    |
| Agregat statistika   | –        | o'z kurslari  | o'z vakansiya  | –            | –         | o'z dasturi| milliy  | ✅    |

---

# 5–10. O'N BOSQICHLI QURILISH REJASI

> Har bosqich formati: **Maqsad → Vazifalar → Skill buyruqlari → DoD checklist**. DoD to'liq bo'lmaguncha keyingi bosqich BOSHLANMAYDI.

## BOSQICH 1 — Poydevor (tag: `v0.1`)

**Maqsad:** ishga tayyor skelet — monorepo, Docker, CI, dizayn tokenlar, CONTRIBUTING.md.

**DoD:**

- [ ] `docker compose up` → hamma servis healthy
- [ ] CI yashil (lint+type+test)
- [ ] `/dev/ui` sahifasida tokenlar, 3 shrift, dark/high-contrast ishlaydi
- [ ] Klaviatura bilan `/dev/ui` to'liq boshqariladi, focus ring ko'rinadi

## BOSQICH 2 — Auth, Rollar, Profil (`v0.2`)

Xavfsiz kirish qatlami, RBAC, 15 bosqichli trayektoriya asosi, disability profil (bosqichli talab).

## BOSQICH 3 — Landing + Public qatlam (`v0.3`)

imkondigital.uz ochiq yuzi: interaktiv Narvon hero, public kurslar katalogi, verify sahifa, Lighthouse 90+.

## BOSQICH 4 — Akademiya yadrosi (`v0.4`)

Kurs katalogi + video (HLS, subtitr, 240p) + progress + submissions.

## BOSQICH 5 — Skills Passport + Sertifikat + Portfolio (`v0.5`)

Sertifikat (PDF, UID, QR), public passport, maxfiylik darajalari, portfolio.

## BOSQICH 6 — Bandlik + Employer Portal + Match Score (`v0.6`)

Vakansiyalar, qoidaga asoslangan Match Score, employer kabinet, placement check-in'lar.

## BOSQICH 7 — Freelancer Marketplace (`v0.7`)

Gigs/orders, escrow holat mashinasi, Payme/Click, nizo markazi.

## BOSQICH 8 — Imtiyozlar Markazi + Notification + Telegram bot (`v0.8`)

Shaxsiylashtirilgan imtiyozlar, notification center, aiogram bot.

## BOSQICH 9 — AI qatlami + Ustoz kabineti (`v0.9`)

Career Coach / CV Builder / Interview Coach, kurs konstruktori, AI subtitr, kvota nazorati.

## BOSQICH 10 — Dashboardlar, Admin, Production Launch (`v1.0`)

Admin panel, Donor/Government Dashboard (anonim agregat), production hardening, deploy, launch.

**DoD:**

- [x] Admin panel: foydalanuvchi boshqaruvi (qidiruv/filtr, bloklash, rol tayinlash/olib
      tashlash), nogironlik moderatsiyasi navbati, kurs arxivlash, audit jurnali
- [x] `audit_log` — barcha kritik admin/moderator amali yoziladi (MASTER_PLAN 3-bo'lim qoidasi)
- [x] Donor kabineti: dastur yaratish/faollashtirish/yakunlash, arizalarni ko'rib chiqish
      (qabul/rad), ochiq `/dasturlar` ro'yxati va ariza berish (tasdiqlangan nogironlik
      profili talab qilinadi)
- [x] Analitika: admin/donor/gov uchun anonim AGREGAT ko'rsatkichlar — kichik hujayra
      bostirilishi (k-anonimlik, 3 kishidan kam guruh ko'rsatilmaydi)
- [x] Xavfsizlik: Redis rate-limit (login/register/verify-phone brute-force himoyasi),
      xavfsizlik sarlavhalari (HSTS, X-Frame-Options va h.k.)
- [x] Production: `apps/web` va `api` uchun hardened Dockerfile (non-root, standalone,
      dev bog'liqliklarsiz), `docker-compose.prod.yml`, Nginx + Certbot (TLS), `docs/deploy.md`
- [x] CI yashil (lint+type+test, Redis xizmati qo'shildi)
- [x] Backend testlar: 298 pytest (admin/donor/analytics/rate-limit/RBAC/anonimlashtirish)
- [x] Frontend: lint+typecheck+build toza, barcha yangi sahifalar jonli tekshirildi

---

# 12. XATARLARDAN HIMOYA (engineering)

| Xatar                     | Yechim rejada                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| Video xarajati portlashi  | HLS + 240p default, storage lifecycle, Celery navbat limiti      |
| AI xarajati portlashi     | Kunlik kvota, keshlash, arzon model routing (bosqich 9)          |
| Scope creep               | DoD gate: bosqich yopilmaguncha yangi funksiya YO'Q              |
| A11y regressiya           | axe-core CI'da majburiy — yiqilsa merge yo'q                     |
| Shaxsiy ma'lumot sizishi  | disability alohida qatlam + testlar + audit_log                  |
| To'lov xatolari           | Escrow holat mashinasi to'liq test, webhook idempotency          |

---

## Bosqichlar holati (jonli)

- [x] **v0.1 — Poydevor** — tugadi
- [x] **v0.2 — Auth, Rollar, Profil** — tugadi
- [x] **v0.3 — Landing + Public** — tugadi
- [x] **v0.4 — Akademiya yadrosi** — tugadi
- [x] **v0.5 — Skills Passport + Sertifikat + Portfolio** — tugadi
- [x] **v0.6 — Bandlik + Employer Portal + Match Score** — tugadi
- [x] **v0.7 — Freelancer Marketplace** — tugadi
- [x] **v0.8 — Imtiyozlar Markazi + Notification Center + Telegram bot** — tugadi
- [x] **v0.9 — AI qatlami + Ustoz kabineti** — tugadi
- [x] **v1.0 — Dashboardlar, Admin, Production Launch** — tugadi

_Reja Vision Book v1.1 bilan sinxron._
