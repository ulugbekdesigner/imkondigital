# Handoff: IMKON Digital â landing page va umumiy dizayn tizimi

## Overview
IMKON Digital â O'zbekistonda nogironligi bor insonlar uchun inklyuziv raqamli karyera platformasi:
kurslar, portfolio, tekshirilgan vakansiyalar va ZIYO nomli AI yordamchi. Ushbu paketda landing page
dizayni va **butun mahsulot uchun umumiy dizayn tizimi** (tokenlar, komponentlar, motion, naqsh tili)
bor â boshqa bo'limlar (kabinet, kurslar, vakansiyalar, profilâ¦) shu tizim asosida qilinadi.

## About the design files
Bu paketdagi `IMKON Landing.dc.html` â **dizayn referensi**, HTML'da yasalgan prototip. Uni to'g'ridan-to'g'ri
production'ga ko'chirish kerak emas. Vazifa â shu ko'rinish va xatti-harakatni loyihaning o'z muhitida
(Next.js / React) qayta qurish: `tokens.css` + `ui.css` ni olib, `components.md` dagi komponent va hook'lar
bo'yicha yig'ish. Mavjud `AppShell` / `CabinetShell` strukturasi buzilmaydi â bu qatlam ustiga qo'yiladi.

## Fidelity
**High-fidelity.** Ranglar, tipografika, oraliqlar, radius, soya, animatsiya davomiyliklari yakuniy.
Piksel darajasida takrorlash mumkin â barcha qiymatlar `tokens.css` da.

---

## Screens / Views (landing)

Sahifa kengligi: 1440px kanvas. Kontent gorizontal padding 62px, bo'lim vertikal padding 104px.

### 1. Hero (quyuq)
- **Purpose**: birinchi 5 soniyada "kasb â portfolio â ish" va'dasini berish.
- **Layout**: `grid-template-columns: 1.05fr 0.95fr; gap: 64px; padding: 104px 22px 0`.
- **Chap ustun**: eyebrow pill ("Bu oyda 128 kishi ishga joylashdi", yashil nuqta `#4ade80` + halo),
  H1 72/1.05/-0.035em (oxirgi so'z `Instrument Serif italic`, `#9cc4e8`), lede 20/1.65 `#c7d3e6`
  (ichida oq qalin jumla: "Interfeys sizga moslashadi â siz interfeysga emas."),
  ikkita tugma (primary `#3f72cf` pill, ghost shisha), avatar guruhi + statistika qatori,
  pastida **ZIYO mascot** (54px robot + "Salom! Men ZIYOâ¦" pufakcha).
- **O'ng ustun (bento 2ÃN, gap 14px)**: "Sizga mos vakansiya" (span 2, 92% mos chip),
  "Haftalik maqsad" (68% + progress), "Yangi takliflar" (3 qator), "Qulaylik yoqilgan" qatori (span 2).
- **Fon**: `#101a33` + 2 ta aurora blob (`rgba(63,114,207,.95)`, `rgba(111,179,207,.68)`, blur 46px),
  girih yulduzi (o'ng yuqori, 620px, opacity .16, 220s aylanadi), banna'i romb panjara (chap chekka, 190px),
  kursor nuri, don teksturasi.
- **Pastida**: kinetik lenta (ticker 28s) â qulaylik imkoniyatlari ro'yxati, 15px/700/0.14em uppercase.

### 2. "Ishga joylashish uchun kerak bo'lgan hammasi" (yorug', `#f6f3ec`)
- H2 46px + o'ngda lede; pastda **6-ustunli bento**: Ta'lim (span 3), Karyera (span 3),
  Portfolio (span 2), Jamiyat (span 2, `#3f72cf` to'ldirilgan), Qulaylik (span 2, toggle qatorlari).
- Kartalar quyuq (`--card-fill`), hover: `translateY(-7px)` + feruza kontur glow.
- Naqsh: islimi medalyoni (o'ng yuqori, 520px, opacity .13, 260s aylanadi).

### 3. "Umid â bu jadvaldagi raqam emas, ish joyi" (quyuq)
- Chapda: eyebrow, H2 48px, lede, 2 ta hikoya kartasi (44px avatar + iqtibos + ism/kompaniya).
- O'ngda: ZIYO chat paneli (shisha) â savol/javob pufakchalari, "Kurs / Ish / Rezyume" chiplari javobni almashtiradi.

### 4. Xayriya (brand gradient)
- `linear-gradient(118deg, #1d3a72, #2c5896 34%, #3f72cf 62%, #4f9fb5)`, ustida 52px ritmli ingichka iplar.
- Chapda H2 + lede; o'ngda quyuq shisha karta: 412 mln so'm / 600 mln, progress 69%, oq CTA.
- Pastda **peshtoq ravog'i (crown)** â footerda **oyoqlari (legs)** aynan bir xil x'da davom etadi.

### 5. Footer (quyuq)
- 4 ustun (brend + 3 ro'yxat), ostida 150px "IMKON" wordmark `rgba(255,255,255,.07)`.

---

## Interactions & Behavior
| Xatti-harakat | Tafsilot |
|---|---|
| Bo'lim kirishi | opacity 0â1, translateY 36pxâ0, 900ms `cubic-bezier(.2,.7,.2,1)`; ekranning 88% chizig'idan o'tganda |
| Karta hover | `translateY(-7px)`, 460ms; soya `0 28px 60px rgba(9,16,34,.4)`, kontur `0 0 0 1px rgba(143,200,230,.5)`, glow `0 0 46px rgba(111,179,207,.26)` |
| Kursor nuri | har bo'limda bitta 620px radial, lerp 0.12; quyuqda `screen`, yorug'da `multiply`; bo'limdan chiqsa 600ms da so'nadi |
| Blob parallaks | kursor: `k = 70 + depth*38`, lerp 0.055; scroll: `-0.07 * depth * scrollY` |
| Naqsh | girih 220s / medalyon 260s `spinSlow`; chiziqli qatlamlar `lineIn` 3â4s (bir marta) |
| ZIYO widget | pastki o'ngda pill; bosilganda panel ochiladi/yopiladi; chiplar javob matnini almashtiradi |
| Ticker | 28s linear infinite, ikki nusxa `translateX(-50%)` |
| Reduced motion | barcha animatsiya va parallaks o'chadi (hook'lar ham ishga tushmaydi) |

## State Management
- `ziyoOpen: boolean` â widget paneli.
- `ziyoTopic: 'kurs' | 'ish' | 'rezyume'` â demo javoblar; backend ulanganda `messages: Message[]` + streaming.
- `reveal` â DOM-level, state kerak emas.
- Kelajakdagi API kontraktlari (taklif): `GET /api/me/progress`, `GET /api/vacancies?match=1`,
  `GET /api/courses`, `POST /api/ziyo/chat`, `GET /api/donations/summary`.

## Design Tokens
To'liq ro'yxat â `tokens.css`. Asosiylari:
- Ranglar: `#101a33` (quyuq), `#1b2c50` (karta oxiri), `#f6f3ec` (yorug'), `#3f72cf` (brend),
  `#2c5896`, `#1d3a72`, `#6fb3cf` / `#a8cbe8` (feruza), matn `#ffffff` / `#c9d6e6` / `#9fb3d1`,
  yorug'da `#0a0a0a` / `#3f4a5c` / `#6f7787`, chiziq `rgba(255,255,255,.13)` / `#e7e1d5`.
- Tipografika: Onest 400â800; Instrument Serif italic â faqat aksent so'z.
  72/46/26/22 sarlavhalar, 20 lede, 17 body, 15 small, 13 uppercase label.
- Radius: 999 / 28 / 24 / 22 / 18 / 14 / 12. Spacing: 4Â·8Â·12Â·16Â·20Â·26Â·32Â·40Â·48, bo'lim 62Ã104.
- Soyalar: karta `0 18px 44px rgba(16,32,60,.18)`, shisha `0 16px 40px rgba(9,16,34,.28)`,
  ramka `0 30px 70px rgba(16,32,60,.22)`, hover â yuqoridagi uchlik.

## Assets
Tashqi rasm yo'q. Barcha naqsh va teksturalar â inline SVG data-URI yoki CSS gradient (`ui.css` ichida):
girih yulduzi, banna'i romb panjara, islimi medalyoni, peshtoq ravog'i (crown/legs), chok chizig'i, film grain.
Shriftlar â Google Fonts (Onest, Instrument Serif). Ikonka kerak bo'lsa: Lucide, stroke-width 2.
Foydalanuvchi suratlari hozircha gradient plashholder â real fotolar qo'shilganda `border-radius` saqlanadi.

## Files
- `IMKON Landing.dc.html` â dizayn prototipi (brauzerda ochiladi, to'liq interaktiv).
- `tokens.css` â dizayn tokenlari (yagona manba).
- `ui.css` â komponent klasslari, naqsh qatlamlari, keyframe'lar.
- `components.md` â React komponentlari, hook'lar (`useCursorGlow`, `useParallaxBlobs`, `useReveal`),
  ZIYO widget va **boshqa bo'limlar uchun retseptlar** (kabinet, kurslar, vakansiyalar, portfolio, profilâ¦).

---

## VS Code'da ishlash tartibi

1. Zip'ni oching, `design_handoff_imkon/` papkasini loyihangizga ko'chiring (masalan `docs/design/`).
2. `tokens.css` va `ui.css` ni `src/design/` ga qo'ying, `app/globals.css` boshida:
   ```css
   @import '../design/tokens.css';
   @import '../design/ui.css';
   ```
3. `IMKON Landing.dc.html` ni brauzerda oching (Live Server yoki oddiy ochish) â o'lchov olish uchun
   DevTools'dan element tanlab, `getComputedStyle` bilan solishtiring.
4. `components.md` dagi hook'larni `hooks/` ga, komponentlarni `components/ui/` ga ko'chiring.
5. Sahifani yig'ing: `Section` â ichida `Card` / `Glass` / `imk-orn` qatlamlari. Yangi rang yoki radius
   kiritmang â faqat tokenlardan foydalaning (bu "standart" shu tizimda saqlanishining yagona sharti).
6. Boshqa bo'limlar uchun `components.md` Â§8 jadvalidagi retseptlarni oling â fon toni va bento
   ustunlari ko'rsatilgan.

### Backendni moslash bo'yicha eslatma
Dizayn ma'lumot shaklidan mustaqil: har bir karta `{label, title, body, meta, progress?}` ni kutadi.
API javobini shu shaklga aylantiruvchi kichik adapter yozing (`lib/adapters/`), shunda backend o'zgarsa
UI o'zgarmaydi. ZIYO uchun `POST /api/ziyo/chat` â `{answer: string}` yoki SSE streaming;
UI'da `typing` keyframe javob kelguncha ko'rsatiladi.


---

## Ekranlar (dizayn fayli: `IMKON Interface.dc.html`)

| Id | Ekran | Route | Nima ko'rsatilgan |
|---|---|---|---|
| 4a | Poydevor | â | Rang tokenlari (eskiâyangi), narvon 0â4, semantik uchliklar, Onest shkalasi, radius/soya/44px/motion, 4 qulaylik rejimi |
| 4b | Komponentlar | â | 5 tugma variant Ã 6 holat, o'lchamlar, ikonka-tugma, maydonlar (fokus/xato/o'chirilgan), checkbox/radio/switch/segment, kartalar (quyuq/hover/yorug'/shisha), belgilar, progress/moslik/streak/skeleton, bo'shâxatoâtoastâmodal, nav, ZIYO |
| 4c | Kirish Â· Ro'yxatdan o'tish | /kirish, /royxatdan-otish | Brend paneli + forma; 4 bosqichli onboarding 2-qadami, qulaylik ehtiyojlari |
| 4d | O'quvchi kabineti | /mening-yolim | Sidebar, topbar (qidiruv + qulaylik), bugungi vazifa, 4 KPI, kurslar, mos vakansiyalar, ZIYO maslahati, bildirishnomalar |
| 4e | Kurs pleeri | /kurslar/[slug] | Watermark video, subtitr/tezlik/sifat, dars matni + ovozli o'qish, 3 tab (Darslar/ZIYO/Topshiriq), yopiq dars |
| 4f | Kurslar katalogi | /kurslar | Pog'ona va narx filtri, 4 karta, skeleton, "topilmadi" holati, narvon testi CTA, load-more |
| 4g | Vakansiya detali | /vakansiyalar/[id] | Kompaniya tasdiqlash belgisi, moslashtirilgan sharoitlar, moslik halqasi, ariza paneli, ariza holati bosqichlari |
| 4h | Ustoz kabineti | /ustoz/kurslar/topshiriqlar | CabinetShell, topshiriqlar jadvali, o'ng drawer: ish, izoh, qabul/qayta ishlash |
| 4i | Admin Â· Ish beruvchi | /admin/foydalanuvchilar, /ish-beruvchi | Foydalanuvchi jadvali (rollar, blok), moderatsiya bandi; arizachilar, sharoit eslatmasi, check-in |
| 4j | Donor Â· Davlat | /donor, /davlat | Dastur progressi, arizalar, shaffoflik; hududlar bo'yicha statistika (faqat o'qish) |
| 4k | Profil Â· Xayriya | /profil, /xayriya/[id] | 4 tab, profil to'liqligi, qulaylik sozlamalari, portfolio; xayriya formasi va hisobot |
| 4l | Birinchi kirish tanishtiruvi | barcha bo'limlar | 4 qadamli interaktiv tur: menyu, bugungi vazifa, qulaylik paneli, ZIYO |
| 4m | Profil (to'liq) | /profil | To'rtala tab: ma'lumotlar, yutuqlar (sertifikat+narvon), faoliyat tarixi, sozlamalar |
| 4n | Landing â ilova | â | Umumiy vizual til: aurora, naqsh, karta hover, ZIYO, kursor nuri, bo'lim kirishi |
| 4o | AI yordamchilar | /karyera-kochi, /cv-yaratish, /suhbat-mashqi | Chat + tavsiyalar, CV qoralama + PDF, suhbat mashqi va baho |
| 4p | Marketplace | /gigs, /buyurtmalarim/[id] | Katalog + bo'sh holat; buyurtma bosqichlari, chat, escrow, nizo |
| 4q | Imtiyoz Â· Xalqaro Â· Hudud Â· Ruhiy kuch | /imtiyozlar, /xalqaro-ishlar, /hududlar, /ruhiy-kuch | Imtiyoz kartalari, AI tarjima, hudud statistikasi, shoshilinch yordam |
| 4r | Bildirishnoma Â· Qidiruv Â· Trayektoriya Â· Verify | /bildirishnomalar, /qidiruv, /trayektoriya, /verify, /u/[username] | 3 tab, global qidiruv, karyera narvoni, sertifikat tekshiruvi va ochiq passport |
| 4s | Kurs konstruktori Â· Vakansiya yaratish | /ustoz/kurslar/[id], /ish-beruvchi/vakansiyalar/yangi | Drag-drop modul/dars, video yuklash; forma + xato holati + qulaylik sharoiti |
| 4t | Tun rejimi | â | Bir xil ekran: yorug', tun osmoni, tun + yuqori kontrast |
| 4u | Tariflar Â· Moderatsiya Â· Telegram | (yangi), /admin moderatsiya, /profil | 3 tarif (bepul/Pro/homiy to'lagan), nogironlik profili navbati, Telegram bog'lash va JSON eksport |
| 4v | Mentorlik Â· Case-hikoya Â· Dars yordamchisi | /mentorships, /portfolio-hikoyasi/[id], kurs pleeri | So'rov+check-in, 3 bosqichli case-hikoya suhbati, dars kontekstidagi ZIYO |
| 4w | Ustoz dashboard Â· Test Â· Sertifikat | /ustoz/kurslar/dashboard, quiz, sertifikat | KPI va tashlab ketilgan dars, taymerli test topshirish, QR sertifikat |
| 4x | Kompaniya Â· Audit Â· Xato sahifalar | /ish-beruvchi, /admin/audit-jurnali, 404/oflayn | Kompaniya ro'yxati formasi, o'chirilmas audit jurnali, 404 va internet uzilgan holat |
| 4z | Marketing sahifalari | /ish-beruvchilarga, /donorlarga, /xayriya, /hududlar/[slug] | Ish beruvchi va donor landinglari, xayriya katalogi, hudud detali + vakansiyalar |
| 5a | Admin dashboard | /admin | KPI, ro'yxatdan o'tish grafigi, navbatlar, moderatsiya, sinxron, hikoyalar |
| 5b | Harakat tizimi | â | Bildirishnoma effektlari, rol bo'yicha tabriklar, mikro-animatsiya qoidalari |
| 5d | Tugma bosilganda ochiladigan ekranlar | suhbat, to'lov, sertifikat, parol, xabarlar, kurs checkout | Suhbat vaqtini tanlash, to'lov muvaffaqiyat/xato, sertifikat + ulashish, SMS bilan parol tiklash, mentor chati, kurs to'lovi |

Har bir ekran 1440px kenglikda chizilgan (mobil 390px alohida). Ikonkalar â 20Ã20 stroke SVG,
`currentColor`, `aria-hidden="true"`; nomlash repo'dagi `shell-icons.tsx` bilan bir xil.

## Paket fayllari

| Fayl | Vazifa |
|---|---|
| `tokens.css` | Palitra (faqat themes.css ichida) |
| `themes.css` | Semantik tokenlar + 3 mavzu: oq / tun / kontrast |
| `parts.css` | .imk-section, .imk-orn (naqsh), .imk-card (ichki qismlari), holatlar |
| `ui.css` | Qolgan yordamchi klasslar |
| `icons.tsx` | 37 ta React ikonka (20Ã20, aria-hidden) |
| `components.md` | Komponentlar va hook'lar |
| `*.dc.html` | Dizayn namunalari |
