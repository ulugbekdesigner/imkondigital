# IMKON DIGITAL — V2.0 YANGILANISH MASTER REJASI
## Dizayn 2.0 · Yangi bo'limlar · Himoya · Masshtab arxitekturasi

**Versiya:** 2.0 | **Sana:** 2026-yil iyul
**Asos:** MASTER_PLAN.md (v0.1→v1.0 bajarilgan) — bu hujjat uning davomi
**Maqsad:** Platformani "ishlaydigan" darajadan "hayratga soladigan" darajaga ko'tarish

---

# A QISM — DIZAYN TIZIMI 2.0: "FIRUZA"

## A1. Nima noto'g'ri edi (halol tahlil)

V1 dizayni ("Narvon" tizimi) uch xatoga yo'l qo'ydi:
1. **To'q yashil monotonligi** — butun sayt bitta og'ir rangda: bu "korporativ bank" his-tuyg'usini beradi, "yangi hayot eshigi" emas
2. **Emotsional qatlam yo'q** — foydalanuvchi kirganda hech narsa "jonlanmaydi": harakat, iliqlik, yorug'lik yetishmaydi
3. **Milliy o'ziga xoslik nol** — dunyodagi istalgan platforma bo'lishi mumkin edi; O'zbekistonniki ekani sezilmaydi

## A2. Yangi rang falsafasi: ranglar psixologiyasi asosida

**Bosh g'oya:** foydalanuvchi — og'ir yo'ldan o'tgan inson. Unga kerak: **xotirjamlik (ishonch) + umid (harakat) + iliqlik (qabul qilinganlik)**. Rang tizimi shu uch tuyg'uni qatlamlaydi:

### Asosiy palitra — "FIRUZA" (tavsiya etilgan)

| Rang | HEX | Psixologik vazifa | Qayerda |
|---|---|---|---|
| **Firuza** (Samarqand koshini) | `#0FA3A3` | Umid + tinchlik + O'zbek merosining ongsiz tanish tuyg'usi. Ko'k (ishonch) va yashilning (o'sish) kesishmasi | Asosiy brend rangi: tugmalar, linklar, progress |
| **Chuqur teal** | `#0B4F4F` | Barqarorlik, professionallik (to'q yashildan yumshoqroq, "nafas oladi") | Sarlavhalar, header, muhim matn |
| **Iliq oq-qum** (ivory) | `#FBF8F3` | Yorug'lik, ochiqlik, "qog'oz" iliqligi — sof oq kabi sovuq emas | Sahifa foni (LIGHT-FIRST! To'q fon faqat aksent bloklar) |
| **Zarhal** (oltin) | `#E8A93D` | Yutuq, faxr, milliy zardo'zlik iliqligi | Yutuqlar, sertifikat, muvaffaqiyat holatlari, CTA aksent |
| **Marjon** | `#E86A5C` | Hayotiy energiya, inson iliqligi (sof qizildan yumshoq) | Kam dozada: bildirishnoma, "jonli" belgilar, like |
| **Tun teal** | `#06302E` | Chuqurlik | Dark mode asosi, footer, kod bloklari |

**Nima uchun light-first?** Nogironligi bor foydalanuvchilar orasida ko'rish qiyinchiliklari ko'p — och fonda to'q matn o'qilishi statistik jihatdan osonroq, ko'zni kam charchatadi va "ochiq eshik" psixologiyasini beradi. To'q rejim — tanlov sifatida qoladi.

**Rang nisbati qoidasi (60-30-10):** 60% iliq oq-qum fon · 30% teal/firuza struktura · 10% zarhal+marjon emotsiya. Hozirgi saytdagi "100% yashil" muammosi shu qoida bilan yechiladi.

### Muqobil palitra — "LAZURIT" (agar Firuza yoqmasa)
Ko'k-lazurit `#1E5AA8` (Registon gumbazlari) + iliq oq + zarhal + yashil faqat muvaffaqiyat semantikasida. Ko'proq "davlat darajasi" tuyg'usi, lekin iliqligi kamroq. A/B ko'rsatish uchun ikkala palitrada bosh sahifa mockup'i qilinadi.

## A3. O'zbekona milliylik — "ozgina va nafis" qoidasi

Milliylik hech qachon "to'y bezagi" bo'lmasligi kerak. Uch nozik element, boshqa hech narsa:

1. **Girih chizgisi:** Sahifa bo'lim ajratkichlarida va hero fonida — an'anaviy girih (geometrik islimiy) naqshining juda nozik, 4-6% shaffoflikdagi chiziqli versiyasi. Ko'z sezadi, ong "tanish" deydi, lekin hech narsa chalg'itmaydi.
2. **Koshin gradienti:** Firuza rangning o'zi + hero'da firuza→teal nozik gradient (koshinlardagi rang o'ynashi). Gradientlar 2026 trendida ham eng yuqorida — milliylik va zamonaviylik bitta nuqtada uchrashadi.
3. **Zardo'zlik mikro-detali:** Sertifikat va yutuq (badge) dizaynlarida zarhal ingichka ornament ramkasi. Foydalanuvchi sertifikatini ulashganda — bu "O'zbekiston mahsuloti" ekani ko'rinib turadi, faxr beradi.

## A4. Tipografika 2.0

| Rol | Variant A (tavsiya) | Variant B | Izoh |
|---|---|---|---|
| Display (H1-H2) | **Onest** (SemiBold/Bold) | Golos Text | Zamonaviy, geometrik-inson uyg'unligi, to'liq lotin+kirill. Unbounded'dan farqli — "qichqirmaydi", nafas oladi |
| Body/UI | **Inter** (yangi versiya, optical sizing) | Onest (bitta oila strategiyasi) | O'qilish sifati sinovlardan o'tgan eng yaxshi UI shrift |
| Raqamlar/data | **Inter tabular nums** | JetBrains Mono (faqat kod) | Statistikada raqamlar tekis turadi |

Type scale o'zgaradi: sarlavhalar KATTAROQ va yengilroq (48-64px hero, letter-spacing -2%), body 16-18px, satr uzunligi maks 68 belgi. **Havo (whitespace) ikki baravar oshiriladi** — "minimalizm, lekin murakkab arxitektura" aynan shu: kam element, ko'p makon, chuqur ierarxiya.

## A5. Animatsiya tizimi — "Jonli platforma"

Barcha animatsiya `prefers-reduced-motion`ni hurmat qiladi (o'chirilsa — hammasi statik). Framer Motion + CSS.

| Qatlam | Nima | Qoida |
|---|---|---|
| **Kirish** | Sahifa elementlari 60-80ms kechikish bilan pastdan yumshoq suzib chiqadi (stagger) | Har sahifada, 300-400ms, ease-out |
| **Mikro-interaksiya** | Tugma bosilganda 0.97 scale + soya chuqurlashishi; progress to'lganda zarhal "porlash" | 150ms, his qilinadigan lekin sezilmas |
| **Hero "Tirik Narvon"** | Bosh sahifada interaktiv narvon: scroll qilganda pog'onalar birin-ketin "quriladi", har pog'onada real bitiruvchi hikoyasi karta sifatida ochiladi | Saytning imzo-animatsiyasi (signature) |
| **Sonlar** | Statistika raqamlari ko'ringanda 0dan sanab chiqadi (count-up) | Bir marta, 1.2s |
| **Muvaffaqiyat lahzalari** | Kurs tugatilganda, sertifikat olinganda — zarhal konfeti + haptic (mobil) | Foydalanuvchining "dofamin nuqtalari" — motivatsiya dvigateli |
| **Skeleton yuklanish** | Kontent yuklanayotganda shimmer-skeletonlar | Hech qachon bo'sh oq ekran yo'q |
| **Sahifa o'tishlari** | View Transitions API — sahifalar orasida silliq morph | Progressive enhancement: qo'llamaydigan brauzerda oddiy |

## A6. Joriy etish tartibi (dizayn migratsiyasi)

1. `packages/config` tokenlari yangilanadi (rang, shrift, spacing, motion tokenlar) — **bitta joydan butun sayt o'zgaradi** (v1 arxitekturasi to'g'ri qurilgani uchun bu 1-2 kunlik ish)
2. Bosh sahifa + onboarding birinchi qayta quriladi (eng ko'p taassurot beradigan joylar)
3. Qolgan sahifalar komponent-komponent migratsiya, har biri `/ui-ux-pro-max` ko'rigi bilan
4. Ikkala palitrada (Firuza/Lazurit) bosh sahifa varianti — real foydalanuvchilar bilan 5 kishilik mini-test (nogironligi bor foydalanuvchilar ishtirokida!) — yakuniy tanlov

---

# B QISM — YANGI VA KENGAYTIRILGAN BO'LIMLAR

## B1. ADMIN PANEL (to'liq boshqaruv markazi)

Alohida app (`apps/admin`), alohida subdomain (admin.imkondigital.uz), IP-cheklov + 2FA majburiy.

**Bo'limlar:**
- **Statistika markazi:** jonli dashboard — foydalanuvchilar, kurslar, joylashuvlar, to'lovlar, donorlar; hudud/vaqt kesimlari; eksport (Excel/PDF)
- **Foydalanuvchilar boshqaruvi:** qidiruv/filtr, profil ko'rish, ma'lumotlarni tahrirlash (har o'zgarish `audit_log`ga sabab izohi bilan yoziladi — "kim, qachon, nimani, nega o'zgartirdi")
- **Kirish yordami:** parol tiklash havolasini yuborish, telefon/email almashtirish tasdiqlash oqimi, sessiyalarni majburiy yakunlash. **Muhim:** admin parolni KO'RMAYDI va o'zi o'rnatmaydi — faqat tiklash havolasi yuboradi (xavfsizlik standarti)
- **Tekshiruvlar navbati:** nogironlik hujjatlari, ustoz kurslari moderatsiyasi, nizolar, shikoyatlar — har biri status oqimi bilan
- **Kontent boshqaruvi:** imtiyozlar bazasi, e'lonlar, bildirishnoma kampaniyalari
- **Rollar ichida rollar:** super-admin / moderator / kontent-menejer / support — har biri faqat o'z bo'limini ko'radi

## B2. O'QUVCHI KABINETI 2.0 (nogironligi bor foydalanuvchi uchun)

Bosh sahifasi — "Mening yo'lim": tirik narvon vidjeti (qayerdaman, keyingi qadam nima), bugungi vazifa, mentor xabari, AI maslahati — hammasi bitta ekranda.

**Yangi imkoniyatlar:**
- **AI bilan birga o'rganish (Study Buddy):** har video dars yonida AI chat paneli — "tushunmadim, soddaroq tushuntir", "misol keltir", "meni tekshir" tugmalari. AI dars kontekstini biladi (transkript RAG orqali). Ovozli kirish/chiqish rejimi
- **Nazariy + amaliy mashg'ulotlar:** har modulda: video → interaktiv mini-test (bilimni mustahkamlash) → amaliy topshiriq (real natija) → AI/ustoz bahosi
- **Guruhlar va ommaviy fikr almashish:** kurs ichida kohort-guruhlar (birga boshlaganlar), guruh chati, haftalik jonli muhokama, "ko'rsat va ulash" kanali (ishlarini ulashadi, bir-birini qo'llaydi)
- **Til o'rganish yo'nalishi:** alohida trek — rus/ingliz tili "ish uchun" (IT so'zlashuvi, mijoz bilan yozishma, intervyu tili); AI bilan suhbat mashqlari (til amaliyoti uchun ideal — charchamaydi, kulmaydi, xato uchun uyaltirmaydi)

## B3. YAKUNIY BAHOLASH — "Haqiqatan o'rgandimi?" tizimi

Uch bosqichli, aldab bo'lmaydigan model:

1. **Nazariy test:** savollar banki (har safar random), vaqt chegarasi, 70%+ o'tish
2. **Amaliy imtihon-loyiha:** real vazifa (masalan dizayner uchun: "shu brif bo'yicha post maketi"; data entry uchun: "shu 50 yozuvni tizimga kirit") — natija fayl sifatida topshiriladi
3. **AI + Ustoz dueti:** AI birinchi tahlil qiladi (mezonlar bo'yicha ball + batafsil izoh: nima yaxshi, nima yetishmaydi, mustaqil ishlashga tayyorligi %), ustoz tasdiqlaydi yoki to'g'irlaydi. **Yakuniy xulosa foydalanuvchiga uch daraja bilan beriladi:** "Mustaqil ishlashga tayyor ✅ / Amaliyot kerak 🟡 / Kursni qayta ko'rish tavsiya 🔴"
4. Faqat "tayyor" darajasi Skills Passport'da "tasdiqlangan" belgisi oladi — **ish beruvchi ko'radigan sifat kafolati shu**. Bu IMKON sertifikatining bozor qiymatini himoya qiladi.

## B4. DONOR BO'LIMI — "Ochiq Xayriya" (login talab qilinmaydi!)

Donor bo'lish uchun ro'yxatdan o'tish SHART EMAS — bu to'siqni olib tashlash xayriyani ko'paytiradi.

**Oqim:**
1. `/xayriya` sahifasi: IMKON tavsiya qilgan jonli loyihalar kartalari — "Xorazmlik 20 ayolga SMM kursi", "10 ta noutbuk granti", "Imo-ishora tili kutubxonasi"
2. Har kartada: maqsad summasi, **jonli progress-bar (to'lib boradi)**, qatnashganlar soni, qolgan muddat
3. "Hissa qo'shish" — summa tanlash (20 / 50 / 100 ming yoki o'z summasi) → Payme/Click/Uzcard → **30 soniyada, loginsiz**
4. To'lovdan keyin: minnatdorlik ekrani + ixtiyoriy: ism qoldirish ("Homiylar devorida" ko'rinadi) yoki anonim; email qoldirsa — loyiha yakunida natija xati oladi ("Siz qo'shgan hissa bilan 20 ayol o'qishni tugatdi, 8 tasi ishga joylashdi")
5. **Har tushgan so'm hisoblanadi:** to'lov → `donations` jadvali → loyiha balansiga → progress-bar real vaqtda yangilanadi → loyiha to'lsa avtomatik "Moliyalashtirildi ✅" + ijro bosqichiga o'tadi
6. Yirik donorlar (tashkilotlar) uchun esa mavjud Donor Dashboard (login bilan) qoladi — ikkalasi parallel ishlaydi

**Shaffoflik dvigateli:** har loyiha sahifasida jamoat hisoboti: yig'ildi → sarflandi → natija (ismlarsiz, agregat). Bu O'zbekistonda xayriyaga ishonchsizlik muammosini yechadigan asosiy vosita.

DB qo'shimchasi: `donation_projects(id, title, story, target_amount, collected_amount, status, report)` + `donations(id, project_id, amount, donor_name NULL, donor_email NULL, payment_id, is_anonymous, created_at)`

## B5. O'QITUVCHI PROFILI 2.0 (Ustoz Studiyasi)

Login/parol bilan alohida kabinet (mavjud instructor roli kengayadi):

- **Mening darslarim:** kurslar ro'yxati, har biri ichida modullar/darslar boshqaruvi
- **O'quvchilarim:** qaysi o'quvchi qaysi darsda, progress %, "qotib qolganlar" ro'yxati (2 hafta faolsiz) — ustoz ularga xabar yubora oladi
- **Fikrlar markazi:** kurs sharhlari, reyting dinamikasi, javob berish imkoniyati
- **Statistika:** ko'rishlar, tugatish darajasi, daromad, eng ko'p tashlab ketiladigan dars (kontent sifat signali!)
- **Bepul berish motivatsiyasi (bu juda muhim edi sizga):**
  - "Saxovat darajasi": bepul kurs ustozlari uchun alohida daraja tizimi — profil belgisi, qidiruvda ustunlik, yillik "Xalq Ustozi" mukofoti (media bilan)
  - Bepul kurs = ko'proq o'quvchi = ko'proq sharh va obro' = pullik kurslariga trafik ("freemium ustoz strategiyasi" — ustozga shuni tushuntiruvchi mini-qo'llanma beriladi)
  - Donor-homiylik: ustoz kursini bepul qilsa, donor fondi unga o'quvchi boshiga to'laydi — ustoz baribir daromad oladi
  - Ijtimoiy hisobot: "Sizning bepul kursingiz orqali 340 kishi kasb o'rgandi" — yillik shaxsiy impact-sertifikat

## B6. BANDLIK BO'LIMI kengaytmasi

Alohida bo'lim ichida uch qism:
- **Ish o'rinlari:** vakansiyalar (mavjud v0.6 funksiyasi, yangi dizaynda)
- **Loyihalar (proektlar):** qisqa muddatli topshiriqlar bazasi — kompaniya/tashkilotlar loyiha e'lon qiladi, bitiruvchilar jamoasi yoki yakka holda oladi (marketplace bilan bog'langan, lekin "ish tajribasi" sifatida rasmiylashadi)
- **Amaliyot (internship):** anchor-hamkorlar kafolatlangan amaliyot o'rinlari — bitiruvchidan ishchigacha ko'prik

---

# C QISM — VIDEO HIMOYA VA SIFAT

## C1. Yuklab olishdan himoya — 3 daraja (tavsiya: 1+2 birga)

| Daraja | Texnologiya | Nimadan himoya qiladi | Narx/murakkablik |
|---|---|---|---|
| **1. HLS + AES-128 shifrlash + imzolangan URL** | Video bo'laklari shifrlanadi, kalit faqat auth foydalanuvchiga 30 soniyalik token bilan beriladi | Oddiy yuklab olish, havolani ulashish, IDM kabi dasturlar | Arzon, o'zimiz quramiz — **MVP darajasi, darhol** |
| **2. Dinamik watermark** | Har videoning ustida foydalanuvchi ID + telefon raqami yarim shaffof, joyi har 30 soniyada o'zgaradi | Ekran yozib olish (screen-record): tarqatgan odam aniqlanadi — psixologik to'siq eng kuchli himoya | Arzon, samarali — **darhol** |
| **3. To'liq DRM (Widevine/FairPlay)** | Apparat darajasidagi shifrlash (Netflix darajasi) | Deyarli hamma narsadan | Qimmat (litsenziya servislari), murakkab — **faqat premium kontent uchun, 2-bosqichda** |

Qo'shimcha: o'ng tugma/devtools bloklash kabi "kosmetik" himoyalar QO'YILMAYDI — ular a11y'ga zarar beradi va professional foydalanuvchini to'xtatmaydi; kuch 1+2 ga beriladi.

## C2. Sifat darajalari va sekin internet

HLS adaptive bitrate ladder (transcode paytida avtomatik yaratiladi):
- **240p** — "ovoz muhim" rejimi (eng past trafik)
- **480p** — sekin internet standarti
- **720p** — asosiy sifat
- **1080p** — tez internet/katta ekran
- Pleer avtomatik moslashadi + foydalanuvchi qo'lda tanlay oladi + "Trafik tejash" rejimi (majburiy 240p) sozlamalarda

## C3. Offline rejim (kelajakdagi ilova uchun)

Mobil ilovada (React Native / Expo — kelajak rejasi):
- "Yuklab olish" tugmasi — video **shifrlangan holda** ilova ichki xotirasiga tushadi (fayl tizimida ochib bo'lmaydi)
- Faqat ilova ichida, login sessiyasi aktiv bo'lsa ijro etiladi; 30 kunda bir onlayn tekshiruv talab qilinadi (litsenziya yangilash)
- Yuklangan kontent watermark bilan qoladi
- Bu Netflix/Coursera ishlatadigan standart model — foydalanuvchiga qulay, kontent himoyalangan

---

# D QISM — 1 MLN FOYDALANUVCHIGA ARXITEKTURA

## D1. Evolyutsion strategiya (bir yechim emas — bosqichli yo'l)

**Falsafa:** hozir mikroservislarga o'tish — xato (jamoa kichik, tezlik yo'qoladi). To'g'ri yo'l: **modulli monolit → tanlab ajratish**. Hozirgi FastAPI modullar strukturasi (v0.1 da qurilgan) aynan shunga tayyor.

| Bosqich | Foydalanuvchi | Nima qilinadi |
|---|---|---|
| **Hozir** | 0-50K | Modulli monolit + PostgreSQL + Redis + CDN. VPS'dan managed infra'ga (docker — k8s shart emas hali) |
| **O'sish** | 50-300K | PostgreSQL read-replica (o'qish yuki ajratiladi) · Video to'liq CDN orqali (O'zbekiston ichida edge/keshlash — mahalliy provayderlar bilan) · Celery workerlar gorizontal ko'payadi · Statistika alohida analitik bazaga (ClickHouse) ko'chadi |
| **Masshtab** | 300K-1M+ | Eng og'ir 2-3 modul servisga ajratiladi: **video-servis** (transcode+streaming), **AI-servis** (o'z navbati va keshlash bilan), **notification-servis** (Telegram/push oqimi). Qolganlar monolitda qolaveradi. Kubernetes shu nuqtada kiradi |

## D2. Hybrid ilova strategiyasi (sayt + ilova bir vaqtda)

**Tavsiya: uch qatlamli yagona kod bazasi**
1. **Next.js PWA** — sayt darhol "ilovaga o'xshab" ishlaydi: bosh ekranga o'rnatish, push, qisman offline (service worker) — bu 1-bosqich, qo'shimcha xarajatsiz
2. **React Native (Expo)** — to'liq mobil ilova: offline video, biometrik kirish, native push. UI logika va API klienti veb bilan bo'lishiladi (monorepo `packages/` afzalligi)
3. Muqobil ko'rib chiqilgan variantlar: Flutter (kuchli, lekin ikkinchi til/ekotizim = jamoa yuki), Capacitor (tez, lekin video/offline'da zaif) — **Expo tanlovi asoslangan**

## D3. Ishonchlilik "muammo bo'lmasa ham tayyor turish" ro'yxati

- **Zaxira:** PostgreSQL kunlik snapshot + doimiy WAL (istalgan daqiqaga qaytish); chorakda bir real restore mashqi
- **Monitoring:** Sentry (xatolar) + Uptime + Grafana (metrikalar) + byudjet-alert (AI/video xarajati portlasa darhol xabar)
- **Degradatsiya rejimi:** AI ishlamay qolsa — platforma AI'siz to'liq ishlashda davom etadi (AI "yaxshilovchi", "tayanch" emas — arxitektura qoidasi)
- **Rate limit + bot himoya:** ochiq donor sahifasi uchun ayniqsa (to'lov spam himoyasi)
- **Yuk testi:** har relizda k6 bilan 2x kutilgan trafik simulyatsiyasi

---

# E QISM — BAJARISH REJASI (V2 bosqichlari)

| Bosqich | Tag | Nima | Muddat bahosi |
|---|---|---|---|
| V2-1 | v1.1 | Dizayn tizimi 2.0: tokenlar, shriftlar, bosh sahifa + onboarding qayta qurish, animatsiya poydevori | 2-3 hafta |
| V2-2 | v1.2 | Donor "Ochiq Xayriya" bo'limi (loginsiz to'lov + progress + hisobot) | 1-2 hafta |
| V2-3 | v1.3 | O'quvchi kabineti 2.0: AI Study Buddy, guruhlar, yakuniy baholash tizimi | 3-4 hafta |
| V2-4 | v1.4 | Ustoz Studiyasi 2.0 + bepul kurs motivatsiya tizimi | 2 hafta |
| V2-5 | v1.5 | Video himoya (AES+watermark) + sifat darajalari + trafik tejash | 2 hafta |
| V2-6 | v1.6 | Admin panel to'liq + audit + support vositalari | 2-3 hafta |
| V2-7 | v2.0 | PWA + masshtab tayyorgarligi (replica, CDN, ClickHouse) + til treki | 3-4 hafta |

Har bosqich avvalgidek: `/ui-ux-pro-max` dizayndan oldin, `/copywriting` matnlarda, `/stop-slop` yakunda, DoD yopilmaguncha keyingisi boshlanmaydi.

---

## V2-1 — Dizayn tizimi 2.0 (`v1.1`) — DoD

- [x] Token poydevori: Firuza (asosiy) va Lazurit (qiyoslash uchun, vaqtinchalik) palitralari
      qurildi, real foydalanuvchi bilan emas — sizning tanlovingiz bilan Firuza yakunlandi
      (WCAG AA 4.5:1 saqlab qolish uchun ba'zi rang-slotlar qasddan moslashtirildi — masalan
      xom Firuza tugma matni uchun emas, faqat aksent/progress uchun)
- [x] Shriftlar: Onest (display) + Inter (sans) + JetBrains Mono (o'zgarmadi)
- [x] Token-chetlab o'tish texnik qarzi tuzatildi: hardcoded `text-white`/`bg-white`/`bg-black`
      → `text-deep-fg`/`bg-deep-fg`/`text-mist` tokenlariga, `Button` `danger` varianti
      dark-rejimda kontrast xatosi bilan (yangi `--error-fg` tokeni qo'shildi)
- [x] Animatsiya poydevori: Framer Motion o'rnatildi, motion tokenlar (`--motion-fast/base/slow`),
      `RevealGroup`/`RevealItem` stagger-in komponentlari, barchasi `prefers-reduced-motion`ni
      hurmat qiladi
- [x] Yangi UI primitivlar (`packages/ui`): `Skeleton` (shimmer), `CountUp` (statistika sanog'i),
      `GirihDivider` (milliy mikro-detal, A3-bo'lim)
- [x] Backend: `success_stories` jadvali + admin CRUD + ochiq endpoint — bosh sahifa hero'sida
      real bitiruvchi hikoyasi ko'rsatish uchun (hozircha bo'sh — admin orqali kontent
      qo'shilishi kerak, CONTRIBUTING.md 2-qoidasiga ko'ra fake ma'lumot yozilmadi)
- [x] Bosh sahifa qayta qurildi: hero (mavjud accessible tablist saqlab qolindi + stagger-in
      kirish animatsiyasi + real hikoya kartasi), CountUp statistika, GirihDivider ajratkichlar
- [x] Onboarding oqimi: bosqichlar orasida silliq o'tish animatsiyasi, muvaffaqiyat lahzasida
      zarhal belgi
- [x] `/dev/ui` yangilandi: barcha yangi token/komponent ko'rgazmasi
- [x] 301 pytest, frontend lint+typecheck+test+build toza, Docker orqali jonli tekshirildi

**Qo'shimcha (foydalanuvchi so'rovi bo'yicha, V2-1 davomida qo'shildi) — "Glassmorphism 2.0" qatlami:**
- Joriy 2026 SaaS dizayn trendlari qisqacha o'rganildi (WebSearch) — shisha effekt (backdrop-blur + shaffof fon + nozik chegara), yumshoq porlash (glow), scroll-asosli mikro-animatsiya "minimal lekin qimmat" tuyg'usi uchun tasdiqlandi
- `GlassCard` komponenti (`packages/ui`) — `on-dark`/`on-light` variant, ixtiyoriy hover-ko'tarilish+porlash
- Yangi tokenlar: `shadow-glass`/`shadow-glow`/`shadow-glow-gold`, `animate-float` (gradient-mesh foni uchun sekin suzish)
- Qo'llanildi: bosh sahifa hero (gradient-mesh fon + shisha panel), statistika/to'siq/faza kartalari (hover-ko'tarilish), CTA bloki (porlash), `Button` mikro-interaksiyasi (bosilganda siqilish)

**Ataylab keyingi bosqichga qoldirilgan (V2-1 doirasidan tashqarida):**
- To'liq scroll-jacking "Tirik Narvon" animatsiyasi — mavjud accessible tablist buzilishi
  xavfi tufayli, o'rniga stagger-in + tanlangan pog'onada real hikoya ko'rsatish tanlandi
- View Transitions API sahifalar orasida — progressive enhancement, keyingi bosqichlarda
- Muvaffaqiyat lahzalari konfetisi — sertifikat/kurs tugatish oqimiga bog'liq, V2-3'da

---

## V2-2 — Donor "Ochiq Xayriya" (`v1.2`) — DoD

- [x] `DonationProject`/`Donation` modellari + migratsiya (`donation_projects`, `donations`)
- [x] **Payme/Click webhook generalizatsiyasi** — mavjud marketplace `Order` escrow oqimi
      O'ZGARTIRILMADI (46/46 eski test o'zgarishsiz o'tdi); xayriya to'lovi bir xil
      `/v1/payments/payme` va `/v1/payments/click/*` endpoint orqali o'tadi (real
      Payme/Click bitta merchant hisobiga bitta webhook URL beradi — alohida route
      qilish noto'g'ri bo'lardi). Payme: `account.donation_id` (alohida maydon nomi,
      to'qnashuv yo'q). Click: `merchant_trans_id` bitta qiymat fazosi bo'lgani sabab
      `d` prefiksi bilan farqlanadi (`"d42"` xayriya, `"42"` buyurtma)
- [x] Loginsiz oqim: loyiha yaratish/faollashtirish (admin/donor), ochiq `/xayriya`
      ro'yxati (faqat active/funded/completed — draft yashirin), `/xayriya/{id}` dan
      ro'yxatdan o'tmasdan hissa qo'shish (Payme/Click), to'lovdan keyin avtomatik
      `collected_amount` yangilanadi va maqsadga yetganda `active`→`funded`
- [x] Shaffoflik: `report` maydoni (yig'ildi→sarflandi→natija), faqat loyiha egasi/admin
      yoza oladi, `funded`/`completed` holatida ochiq sahifada ko'rinadi
- [x] Anonim/ism ko'rsatish tanlovi, email (ixtiyoriy, natija xati uchun — hozircha
      email yuborish ulanmagan, keyingi bosqichda)
- [x] Yangi UI: `ProgressBar` (`packages/ui`), `DonateForm`, loyiha boshqaruvi `/donor`
      kabinetida (yaratish, holat o'tishi, homiylar ro'yxati, hisobot formasi)
- [x] 312 pytest (312-301=11 yangi), frontend lint/typecheck/test/build toza
- [x] **To'liq jonli tekshiruv** (Docker, real Payme JSON-RPC chaqiruvlar bilan):
      loyiha yaratish→faollashtirish→loginsiz ariza→CreateTransaction→
      PerformTransaction→`collected_amount`/`progress_pct` to'g'ri yangilangani
      tasdiqlandi (curl orqali, mock emas)

**Ataylab keyingi bosqichga qoldirilgan:**
- Email yuborish (natija xati) — Celery task ulanmagan, faqat `donor_email` saqlanadi
- Uzcard to'g'ridan-to'g'ri integratsiyasi — hozircha Payme/Click orqali (ular Uzcard'ni
  ham qamrab oladi)

---

## V2-3 — O'quvchi kabineti 2.0 (`v1.3`) — DoD

- [x] **AI Study Buddy**: har video dars yonida AI chat paneli (`study_buddy_messages`,
      `app/modules/ai/study_buddy.py`, career_coach bilan bir xil naqsh). Dars transkripti
      (mavjud bo'lsa) tizim promptiga to'g'ridan-to'g'ri kiritiladi — real RAG/vektor qidiruv
      emas (darslar qisqa/lokal, ortiqcha murakkablik bo'lardi, bu ataylab qilingan
      soddalashtirish). Tez tugmalar: "Tushunmadim", "Misol keltir", "Meni tekshir" — sobit
      matnli xabar sifatida yuboriladi, alohida `action` maydoni kerak emas. **Ruxsat
      nazorati**: pullik kurs darsi uchun faqat ro'yxatdan o'tgan foydalanuvchi (bepul
      kursda hammaga ochiq, video/transkriptning o'zi kabi) — ishlab chiqish paytida
      aniqlangan bo'shliq, oldindan yopildi. Kvota: `AiFeature.STUDY_BUDDY` (30/kun)
- [x] **Video → mini-test → amaliy topshiriq oqimi**: yangi `Quiz`/`QuizQuestion`/`QuizAttempt`
      modellari (`kind` maydoni bilan modul mini-testi va kurs darajasidagi yakuniy nazariy
      testni bitta modelda birlashtiradi). Har urinishda savollar tasodifiy tartibda
      beriladi (`random.shuffle`), vaqt chegarasi bo'lsa serverda tekshiriladi (10s
      "grace" bilan). Amaliy topshiriq (`Assignment`/`Submission`) backend v0.4'dan beri
      bor edi, lekin **frontend UI HECH QACHON qurilmagan edi** (instructor ham topshiriq
      yarata olmasdi) — endi to'liq: instructor kurs konstruktorida topshiriq/mini-test
      yaratadi, o'quvchi kurs sahifasida topshiradi/ko'radi
- [x] **Yakuniy baholash (B3)**: kurs darajasidagi yakuniy nazariy test (tasodifiy,
      vaqt chegarali, standart 70%+) → yakuniy amaliy imtihon-loyiha (`FinalExamSubmission`,
      `Course.final_exam_brief`) → **AI birinchi baholaydi** (`app/modules/ai/exam_grader.py`,
      Gemini'dan qat'iy JSON formatida ball/tayyorlik%/izoh/xulosa so'raydi) → natija
      `SkillsAssessment`ga yoziladi → **ustoz tasdiqlaydi/to'g'irlaydi**
      (`/ustoz/kurslar/baholash` navbati) → faqat yakuniy xulosa "ready" bo'lsa
      `Certificate.confirmed_at`/`readiness_pct` o'rnatiladi — Skills Passport'da
      "Ko'nikma tasdiqlangan ✅" belgisi (mavjud, har doim ko'rinadigan "Tasdiqlangan"
      belgisidan MUSTAQIL — u sertifikat haqiqiyligini, bu esa amaliy tayyorlikni
      bildiradi). AI JSON formatini buzsa (parsing xato) — avtomatik "needs_practice"
      + "AI tahlili amalga oshmadi" izohi bilan ustoz navbatiga tushadi, hech qachon
      jim qolmaydi yoki xato bermaydi (CONTRIBUTING.md 2-qoidasi ruhida)
- [x] **"Mening yo'lim" bosh sahifasi** (`/mening-yolim`, `GET /v1/me/learning-home`):
      mavjud 15-bosqichli trayektoriya + faol kurslar progressi + eng yaqin tugallanmagan
      dars (bugungi vazifa) + eng so'nggi mentor check-in xabari + tasdiqlangan baholash
      natijalari — barchasi REAL mavjud ma'lumotdan yig'iladi (CONTRIBUTING.md 2-qoidasi:
      soxta "AI maslahati" o'ylab topilmadi, buning o'rniga Career Coach/Study Buddy'ga
      havola beriladi)
- [x] **Jonli tekshiruv** (Docker, haqiqiy Gemini API kaliti bilan, mock EMAS): to'liq
      zanjir — kurs+modul+dars+yakuniy test+savol yaratish → o'quvchi ro'yxatdan
      o'tish→dars tugatish (100%)→Study Buddy'dan **haqiqiy Gemini javobi** olish→yakuniy
      nazariy testdan o'tish→yakuniy amaliy imtihon topshirish→**haqiqiy AI baholash**→
      ustoz tasdiqlashi→`Certificate.confirmed_at`/`readiness_pct` to'g'ri o'rnatilgani
      tasdiqlandi (curl orqali, har bosqichda). **Shu tekshiruvda haqiqiy xato topildi
      va tuzatildi**: `exam_grader`da `max_tokens=768` Gemini'ning to'liq JSON javobini
      kesib qo'yardi (feedback matni uzun bo'lgani uchun), natijada har doim JSON parse
      xatosi va "needs_practice" fallback'iga tushardi — `max_tokens=2048`ga oshirilib
      tuzatildi (v0.9'dagi em-dash/fpdf xatosiga o'xshash: mock testlar buni ushlay
      olmaydi, faqat haqiqiy API kaliti bilan sinov ushlaydi)
- [x] 334 pytest (V2-2'dagi 312 ustiga 22 yangi: quiz/attempt, final exam, study buddy,
      mentor review, learning-home, my-submissions), frontend lint/typecheck/test toza,
      backend Docker build orqali tasdiqlandi (Windows host `pnpm build` standalone-
      rejimdagi symlink cheklovi tufayli to'liq build qilinmadi — V2-1'dan beri ma'lum,
      Linux/Docker/CI'ga taalluqli emas; compile+typecheck+static-page-generation local
      build'da muvaffaqiyatli o'tdi)

**Ataylab keyingi bosqichga qoldirilgan (B2 doirasidan tashqarida, hajmi sababli):**
- **Kohort guruhlari + guruh chati + "ko'rsat va ulash" kanali** — kodbazada hech qanday
  ko'p tomonlama (group) chat namunasi yo'q edi (faqat `OrderMessage` — 1:1 buyurtma
  chati); butunlay yangi model (guruh a'zoligi, guruh xabarlari) va real-time yangilanish
  strategiyasi talab qiladi — mustaqil, katta hajmli funksiya, keyingi bosqichga
  (V2-4 bilan birga yoki alohida) qoldirildi
- **Til o'rganish yo'nalishi** (rus/ingliz "ish uchun" treki) — AI suhbat mashqi mexanizmi
  o'zi texnik jihatdan oddiy (Study Buddy/Interview Coach'ga o'xshash yangi AI feature),
  lekin haqiqiy kurikulum/kontent tanlovi (qaysi mavzular, qaysi daraja) biznes qarori —
  real foydalanuvchi sinovi kabi, sof kod bilan mazmunli qurib bo'lmaydi
- **Ovozli kirish/chiqish** (Study Buddy uchun) — brauzer Web Speech API turli
  brauzerlarda ishonchsiz/qisman qo'llab-quvvatlanadi, a11y ta'siri real foydalanuvchi
  sinovisiz baholab bo'lmaydi (xuddi A6.4 kabi)

---

## V2-4 — Ustoz Studiyasi 2.0 (`v1.4`) — DoD

- [x] **O'quvchilarim**: har kurs uchun ro'yxatdan o'tgan o'quvchilar ro'yxati (progress %,
      so'nggi faollik, "qotib qolgan" belgisi — 2 haftadan beri harakatsiz faol
      enrollment'lar) va ustozdan o'quvchiga to'g'ridan-to'g'ri xabar yuborish
      (`NotificationType.INSTRUCTOR_MESSAGE` — mavjud Notification Center orqali,
      alohida chat tizimi qurilmadi, chunki bir tomonlama xabar yetarli edi)
- [x] **Fikrlar markazi**: yangi `CourseReview` jadvali (bitta yozuv/foydalanuvchi+kurs,
      qayta yuborilsa yangilanadi), faqat ro'yxatdan o'tgan o'quvchi sharh qoldira oladi,
      ustoz javob bera oladi. **Real texnik qarz tuzatildi**: `Course.rating` maydoni
      v0.4'dan beri mavjud edi, lekin uni to'ldiradigan hech qanday tizim yo'q edi —
      har doim 0.0 ko'rsatilardi; endi har sharhdan keyin haqiqiy o'rtacha qayta
      hisoblanadi
- [x] **Statistika**: ko'rishlar (`Course.views_count`, endi jamoat `course_detail`
      chaqirilganda oshadi), o'quvchilar soni, tugatish darajasi (real
      enrollment/completion nisbatidan), eng ko'p tashlab ketiladigan dars (darsma-dars
      completion-soni pasayishidan hisoblanadi), o'rtacha reyting. **Daromad statistikasi
      ATAYLAB qo'shilmadi** — pullik kurslar uchun `enroll()` hech qachon to'lovni
      tekshirmagan (v0.4'dan beri haqiqiy xarid/to'lov oqimi yo'q, `Course.price`/`is_free`
      maydonlari bor-u, ularni bog'laydigan Payme/Click integratsiyasi yo'q) — soxta
      daromad raqami CONTRIBUTING.md 2-qoidasini buzardi, shu sabab `income_available: false`
      bilan ochiq e'lon qilinadi (frontend "to'lov tizimi hali ulanmagan" deb ko'rsatadi)
- [x] **Saxovat darajasi**: qoidaga asoslangan sof funksiya (`app/core/generosity.py`,
      match_score.py bilan bir xil falsafa) — instructor'ning BEPUL kurslarini tugatgan
      (turli) o'quvchilar soniga qarab Bronza(10+)/Kumush(50+)/Oltin(200+) — hech qayerda
      saqlanmaydi, har chaqiriqda qayta hisoblanadi. Public Skills Passport'da (`/u/[username]`)
      belgi sifatida ko'rinadi
- [x] **Ijtimoiy hisobot**: on-demand impact-sertifikat (`app/core/impact_certificate.py`,
      `certificates.py`bilan bir xil fpdf2+MinIO naqshi) — "Sizning bepul kurslaringiz
      orqali N kishi kasb o'rgandi", N — real completed-o'quvchilar sonidan
- [x] **Jonli tekshiruvda real xato topildi va tuzatildi**: yangi impact-sertifikat PDF
      matnida em-dash "—" ishlatilgani uchun `FPDFUnicodeEncodingException` bilan
      yiqilardi — bu AI-generatsiya qilingan matn emas, mening o'zim yozgan sobit matn
      edi, lekin xuddi v0.9'dagi CV PDF xatosi bilan bir xil sinf muammo. Yechim: mavjud
      `cv_pdf.py`dagi `_latin1_safe` sanitayzerini alohida umumiy modulga
      (`app/core/pdf_text.py`) chiqarib, ikkala PDF generatori ham shu yerdan
      foydalanadigan qilindi (kelajakdagi har qanday yangi PDF generator ham xuddi shu
      xatoga tushmaydi)
- [x] 344 pytest (V2-3'dagi 334 ustiga 10 yangi: kurs sharhlari, o'quvchilar ro'yxati,
      xabar yuborish, statistika, impact-sertifikat, saxovat darajasi), frontend
      lint/typecheck/test/build toza, Docker orqali to'liq jonli tekshirildi (kurs
      yaratish→o'quvchi tugatish→sharh qoldirish→ustoz javobi→statistika/o'quvchilar
      ro'yxati→impact-sertifikat PDF haqiqatan yuklanishi — barchasi curl orqali)

**Ataylab keyingi bosqichga qoldirilgan:**
- **Kurslarga to'lov integratsiyasi** ("daromad" statistikasi uchun) — Payme/Click'ni
  donations'dagi kabi generalizatsiya qilish mumkin edi, lekin bu butun yangi xarid
  oqimi (checkout, paywall, webhook uchinchi tarmoq) talab qiladi — Ustoz Studiyasi
  doirasidan tashqari, alohida bosqich sifatida ko'rib chiqilishi kerak
- **Kataloglar tartibida saxovat darajasi bo'yicha ustuvorlik** ("qidiruvda ustunlik")
  — mavjud katalog cursor-pagination `Course.id DESC` bo'yicha qat'iy tartiblangan
  (barqaror kursor uchun); buni saxovat darajasi bilan aralashtirish pagination
  arxitekturasini qayta ko'rib chiqishni talab qiladi — ikkinchi darajali signal uchun
  xavf-foyda nisbati mos kelmadi, shu sabab faqat passport belgisi + impact-sertifikat
  bilan cheklandi
- **Donor fondi orqali talaba-boshiga to'lov** (bepul kurs ustoziga) va **yillik "Xalq
  Ustozi" media mukofoti** — real moliyaviy hisob-kitob siyosati va tahririyat/PR
  jarayoni talab qiladi, kod bilan "bajarib" bo'lmaydi (real foydalanuvchi sinovi kabi)

---

## V2-5 — Video himoya va sifat (`v1.5`) — DoD

- [x] **C1.1 — HLS + AES-128 shifrlash + kalit yetkazish**: har lesson transcode
      qilinganda tasodifiy 16-baytli AES kalit yaratiladi (`secrets.token_bytes`),
      barcha renditionlar shu kalit bilan shifrlanadi (`ffmpeg -hls_key_info_file`),
      xom kalit `Lesson.hls_key_hex`da saqlanadi (hech qachon public schema orqali
      chiqarilmaydi). Video segmentlarning o'zi MinIO'da public-read bo'lib qolaveradi
      (shifrlangani uchun kalitsiz foydasiz — bu Netflix-uslubidagi standart model,
      CDN orqali keshlash imkonini beradi). **Kalit yetkazish** — `GET
      /v1/lessons/{id}/hls-key` — real kirish huquqini tekshiradi (bepul kurs YOKI
      ro'yxatdan o'tgan). Doc "30 soniyalik token" so'ragan edi, lekin **ongli
      muhandislik qarori bilan soddaroq va xavfsizroq yechim tanlandi**: alohida
      qisqa muddatli token o'rniga mavjud sessiya autentifikatsiyasi (httpOnly cookie,
      frontend Next.js route orqali) ishlatildi — funksional jihatdan bir xil
      maqsadga xizmat qiladi (har safar haqiqiy avtorizatsiya tekshiruvidan o'tadi),
      lekin implementatsiyasi soddaroq va httpOnly cookie URL-token'dan ko'ra
      ekspluatatsiyaga chidamliroq
- [x] **C1.2 — Dinamik watermark**: pleerda foydalanuvchi ismi + qisman yashiringan
      telefon raqami (oxirgi 4 raqam ochiq) yarim shaffof qatlam sifatida, joyi har
      30 soniyada 6 ta oldindan belgilangan pozitsiya orasida almashadi (animatsiyasiz
      — sakrash, "harakat" emas, shu sabab `prefers-reduced-motion`ga daxli yo'q)
- [x] **C2 — Sifat darajalari**: mavjud 240p/480p ustiga 720p/1080p qo'shildi (jami 4
      daraja, v0.4'dan beri mavjud hls.js sifat selektori avtomatik ko'rsatadi,
      frontend o'zgarishi shart emas edi). Yangi "Trafik tejash rejimi" — eng past
      sifatni majburlaydi, localStorage'da saqlanadi (barcha darslarda davom etadi)
- [x] **C1.3 (to'liq DRM) va C3 (offline rejim) — QOLDIRILGAN** (V2-1'dan beri
      "Muhim izoh"da hujjatlashtirilgan): uchinchi tomon litsenziya xizmati va
      kelajakdagi React Native ilova talab qiladi. **Devtools/o'ng tugma bloklash
      ATAYLAB QO'YILMADI** — bu doc'ning o'zida "kosmetik himoya, a11y'ga zarar
      beradi" deb aniq rad etilgan (V2_UPDATE_PLAN.md A2/C1 bo'limi)
- [x] **Real texnik qarz tuzatildi**: `course_detail` (ochiq endpoint) reveal
      mantig'i v0.4'dan beri FAQAT `course.is_free`ga qarardi — pullik kursga
      ro'yxatdan o'tgan foydalanuvchi ham video/transkriptni ko'rolmasdi (chunki
      haqiqiy xarid oqimi qurilmagan bo'lsa ham, mantiq enrollment'ni tekshirmagan
      edi). Endi `get_current_user_optional` orqali haqiqiy holat hisoblanadi:
      bepul YOKI (kiritilgan + ro'yxatdan o'tgan)
- [x] **Jonli tekshiruvda real ikkinchi xato topildi va tuzatildi**: `SITE_URL`
      muhit o'zgaruvchisi lokal `docker-compose.yml`da HECH QACHON sozlanmagan
      edi (standart qiymat `localhost:3000`, lekin bu loyihada WEB_PORT — boshqa
      loyiha bilan portlar to'qnashuvi sababli — 3001ga ko'chirilgan). Bu ilgari
      faqat sertifikat PDF'idagi matn havolasiga ta'sir qilardi (inson bosadigan,
      ziyonsiz) — lekin endi HLS manifestiga yozilgan kalit-URI ham shu sozlamaga
      tayanadi, va bu safar BUZILGAN URL pleerning o'zi tomonidan DASTURIY chaqiriladi
      — noto'g'ri portga so'rov ketib, video hech qachon ochilmasdi. Ishlab chiqarish
      (`docker-compose.prod.yml`) allaqachon to'g'ri sozlangan edi (`SITE_URL:
      https://${DOMAIN}`) — faqat lokal dev compose'da yo'q edi. Tuzatildi: `SITE_URL:
      http://localhost:${WEB_PORT:-3000}` qo'shildi (CORS_ORIGINS bilan bir xil
      naqsh), keyin haqiqiy video qayta transkod qilinib, kalit-URI to'g'ri portga
      (`:3001`) ishora qilishi tasdiqlandi
- [x] **To'liq jonli tekshiruv** (Docker, haqiqiy ffmpeg + haqiqiy video fayl bilan,
      mock EMAS): test video generatsiya qilindi → yuklandi → transkod (4 daraja,
      shifrlangan) → MinIO'da segmentlar shifrlangan ekanligi (birinchi bayt AES
      ciphertext, `0x47` MPEG-TS sync bayti EMAS) tasdiqlandi → kalit so'ralganda
      pullik kurs uchun anonim/ro'yxatdan o'tmagan foydalanuvchiga 403, ro'yxatdan
      o'tgach 200 qaytishi tasdiqlandi → **fetched kalit bilan segment haqiqatan
      dekodlanib, natija MPEG-TS sync bayti (`0x47`) bilan boshlanishi** — shifrlash
      ISHLAYOTGANI kriptografik jihatdan isbotlandi (openssl aes-128-cbc orqali)
- [x] 349 pytest (V2-4'dagi 344 ustiga 5 yangi: hls-key ruxsat nazorati, reveal
      mantig'i), frontend lint/typecheck/test/build toza

**Ataylab keyingi bosqichga qoldirilgan** (V2-1'dan beri "Muhim izoh"da mavjud, bu
yerda qayta tasdiqlanadi): C1.3 to'liq DRM (Widevine/FairPlay), C3 offline rejim
(kelajakdagi React Native ilova).

---

## Amalga oshirish holati (jonli)

- [x] V2-1 — Dizayn tizimi 2.0 — tugadi
- [x] V2-2 — Donor "Ochiq Xayriya" — tugadi
- [x] V2-3 — O'quvchi kabineti 2.0 — tugadi (kohort chat/til treki keyingi bosqichga qoldirildi)
- [x] V2-4 — Ustoz Studiyasi 2.0 — tugadi (to'lov/daromad integratsiyasi keyingi bosqichga qoldirildi)
- [x] V2-5 — Video himoya va sifat — tugadi (to'liq DRM/offline rejim keyingi bosqichga qoldirildi)
- [x] **Ad-hoc: Kompaniya self-service ro'yxatdan o'tish + rol-asosli login yo'naltirish** (MVP/grant
  muddati bosqichi, tag yo'q) — `POST /v1/companies` endi istalgan avtorizatsiyalangan
  foydalanuvchiga ochiq (`get_current_user`, `_employer` roli gate emas); `create_company()`
  yaratuvchiga avtomatik `EMPLOYER` rolini beradi (`_grant_employer_role`, idempotent). Frontend:
  `/ish-beruvchi` sahifasidagi "Bog'lanish" bloklovchi eshik olib tashlandi — endi har qanday
  tizimga kirgan foydalanuvchi darhol `CreateCompanyForm`ni ko'radi; `/vakansiyalar`da doimiy
  ko'rinadigan "Kompaniyasiz?" CTA qo'shildi. Login: rol-asosli yo'naltirish
  (admin→`/admin`, instructor→`/ustoz/kurslar`, boshqalar→`/mening-yolim`) — yangi `GET /api/me`
  proxy orqali; aniq `?next=` parametri bo'lsa u ustuvor. CV yig'ish va Telegram integratsiyasi
  ataylab QOLDIRILDI (keyingi bosqich); to'liq dizayn yangilanishi ham ataylab QOLDIRILDI
  (foydalanuvchi so'roviga ko'ra alohida bosqich).
- [ ] V2-6 — Admin panel to'liq
- [ ] V2-7 — PWA + masshtab tayyorgarligi

### Muhim izoh — real infratuzilma/biznes qarorlari talab qiladigan bandlar

Quyidagilar CONTRIBUTING.md 2-qoidasiga ko'ra ("placeholder yo'q, har funksiya to'liq ishlaydi yoki yozilmaydi") kod yozish orqali "bajarildi" deb belgilanmaydi — bular haqiqiy tashqi xizmat/qaror talab qiladi:

- **B1 admin subdomain + majburiy 2FA + IP-cheklov** — kod darajasida qurilishi mumkin (2FA/IP-allowlist), lekin alohida subdomain/DNS — ops qarori
- **C1.3 to'liq DRM (Widevine/FairPlay)** — uchinchi tomon litsenziya xizmati (masalan Axinom/BuyDRM) bilan shartnoma talab qiladi, sof kod bilan qurib bo'lmaydi
- **D1 Kubernetes/ClickHouse/CDN** — real bulut provayder hisobi, byudjet, infratuzilma qarori — kod tayyorgarligi (masalan analitika so'rovlarini abstraktsiya qilish) qilinishi mumkin, lekin haqiqiy provisioning emas
- **D2 React Native (Expo) mobil ilova** — butunlay alohida ilova/repo, ko'p haftalik alohida loyiha
- **A6.4 va B3 real foydalanuvchi sinovi** (nogironligi bor odamlar bilan 5 kishilik test) — odamlarni jalb qilish talab qiladi, dev sessiyasida bajarilmaydi
- **D3 Sentry/Grafana/Uptime** — real hisob va API kalitlari talab qiladi

### Dizayn 3.0 — "Tun Osmoni" (2026-07-28) — A2-bo'limni bekor qiladi

V2-1'da tanlangan "Firuza" yorug' palitra foydalanuvchiga endi zamonaviy
tuyulmadi. clickconnector.com (mos yozuvlar: dark navy + indigo/ko'k
porlash, glassmorphism, Inter shrift — bizda allaqachon bor) ilhomida
yangi **dark-first** standart brend qiyofasi joriy qilindi — token
darajasida (`globals.css`), shu sabab bitta commit bilan butun sayt
o'zgardi. Eski "Firuza" `[data-theme='light']` ostida ixtiyoriy muqobil
sifatida saqlanadi (o'chirilmadi). Bu bosqichda amalga oshirilgani:
token tizimi + bosh sahifa/kirish sahifasi porlash-sayqali; qolgan
sahifalar (admin, ustoz studiyasi, kabinet ichki bo'limlari) hozircha
faqat token-orqali rang o'zgarishini oldi, alohida glass/porlash
sayqali YO'Q — grant hujjati muddati sabab ataylab keyingi bosqichga
qoldirildi. Batafsil muhandislik qarorlari (kontrast matematikasi,
`text-deep` regressiyasi va tuzatilishi) commit tarixida (`feat(design):
v2.0 — "Tun Osmoni"...`).

### Dizayn 4.0 — "Oyna" (2026-07-28, bir necha soat o'tib) — Tun Osmoni'ni bekor qiladi

Qorong'i "Tun Osmoni" ham foydalanuvchiga yoqmadi. Ikkita aniq Dribbble
namunasi ko'rsatildi: Caregivez megamenu (oq shisha panel, qora
pill-tugma, keng radius) va Applyr onboarding (chap stepper + jonli %
progress + har bosqichda icon+sarlavha). Standart brend endi **yorug'
"Oyna"** — deyarli oq sirt, to'q ink matn, indigo faqat aksent-havola
sifatida, tugmalar deyarli qora va pill-shakl. "Tun Osmoni"
`[data-theme='dark']` ostida ixtiyoriy muqobil sifatida qoladi.
**Muhim tuzatish**: theme-init skript standart holatda foydalanuvchi
tizim moslamasiga (`prefers-color-scheme`) qarab avtomatik dark'ga
o'tib ketar edi — bu ikki marotaba "dark ko'rsatilyapti" chalkashligiga
sabab bo'ldi (headless Chrome skrinshotlarida ham shu sabab birinchi
urinishda hamon eski natija ko'rindi) — endi aniq tanlov bo'lmasa har
doim "light" standart. Ro'yxatdan o'tish oqimi Applyr namunasi asosida
qayta qurildi (jonli progress-foiz, icon+sarlavha+tavsif). Batafsil:
`feat(design): v2.1 — "Oyna"...`.

### Grant demo blueprint (2026-07-28, `IMKON_MVP_DEMO_BLUEPRINT.md`) — S1..S8 tartibi

Foydalanuvchi ertangi grant ko'rigi uchun alohida demo-fokuslangan blueprint
berdi (P0/P1/P2 ustuvorlik, click-by-click oqim, Ziyo AI personaj, demo
ssenariysi). Kod bilan solishtirilgach aniqlandi: ko'p narsa V2-1..V2-5'da
ALLAQACHON qurilgan edi (dashboard, Study Buddy = "Ziyo kurs ichida"
rejimining asosi, Match Score, xayriya to'lovi). Haqiqiy net-new ish qildi:

- **S2 — Ziyo AI yordamchi**: yangi (har sahifada suzuvchi panel, mehmon
  uchun ham, sayt-xaritasi+kasb-maslahati bitta promptda, NAVIGATE havola
  taklifi, ovozli kirish)
- **S1 (qisman) — Onboarding**: yangi "Qiziqishlaringiz" bosqichi + "Tayyor"
  ekranida 2 kurs tavsiyasi
- **S3 — Kurs pleeri**: 3-tab panel (Darslar/Ziyo/Topshiriq) — Ziyo tabi
  mavjud Study Buddy'ni qayta ishlatadi
- **S6 (qisman) — Match Score**: matn-belgidan MatchScoreRing halqasiga,
  "mos kurslarni ko'rish" havolasi
- **S7 — Seed data**: `api/app/scripts/seed_demo.py` — 30 foydalanuvchi/10
  kurs/6 vakansiya/3 xayriya loyihasi, ishga tushirilib tekshirildi,
  bittasiga (Kompyuter savodxonligi asoslari) haqiqiy video ham yuklandi

**Hali qilinmagan** (vaqt tugagani sabab, keyingi sessiyaga qoldirilishi
mumkin): S4 (profil avatar-crop + jonli username tekshiruv), streak
hisoblagichi + bayram-animatsiyasi, admin qator-drawer patterni va kurs-
moderatsiya navbati, P2 "tez kunda" sahifalari (aslida kerak emas —
`/gigs` va `/imtiyozlar` allaqachon to'liq ishlaydi). **Eslatma**: dev
bazada eski test-artefaktlar (masalan "E2E Video Himoya", "sadasd"
kompaniya) seed data bilan aralashib qolgan — demo oldidan tozalash
kerak bo'lishi mumkin (ataylab o'chirilmadi, foydalanuvchi tasdig'i
kerak).

---

*Bu hujjat MASTER_PLAN.md bilan birga repo'da yashaydi: docs/V2_UPDATE_PLAN.md. Yangi ish sessiyasida: "V2_UPDATE_PLAN.md dagi V2-N bosqichni bajaramiz" deb boshlanadi.*
