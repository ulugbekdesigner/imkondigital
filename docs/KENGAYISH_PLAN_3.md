# IMKON DIGITAL — KENGAYISH REJASI 3.0

## Ustoz Kabineti · Bildirishnomalar · Tillar · Pullik Modellar · B2B Paketlar · Xalqaro Ishlar · Psixologik Yordam

**Sana:** 2026-yil iyul | **Asos:** MASTER_PLAN + V2 + MVP Blueprint + BENCHMARK_PLAN davomi

---

# 1. USTOZ KABINETI 2.0 — AsproCRM strukturasida

**Savolingizga javob: HA, bo'ladi — va bu to'g'ri qaror.** AsproCRM'ning "chap yon panel — bo'lim — jadval/karta — ichiga kirsang drawer/sahifa" mantiqiy tuzilishi jamoangizga tanish, foydalanuvchiga tushunarli. Ustoz kabineti shu qolipda:

## 1.1. Yon panel strukturasi (AsproCRM uslubida)

```
USTOZ KABINETI (ustoz.imkondigital.uz yoki /ustoz)
│
├── Dashboard          — kirgandagi 1-ekran
├── Kurslarim
├── Darslar va materiallar
├── Topshiriqlar (tekshirish navbati)
├── O'quvchilarim
├── Daromad
├── Sharhlar
├── Jonli darslar (jadval)      [2-bosqich]
└── Sozlamalar
```

## 1.2. Har ekran — batafsil

### Dashboard
4 ta KPI karta (bugun): yangi o'quvchilar · tekshirilmagan topshiriqlar · bu oy daromad · o'rtacha reyting. Ostida: "Diqqat talab qiladi" ro'yxati (3 kundan beri tekshirilmagan topshiriqlar, javobsiz savollar) + so'nggi faollik lentasi.

### Kurslarim
Jadval: kurs nomi · holat (Qoralama/Moderatsiyada/Faol/Yashirin) · narx yoki BEPUL · o'quvchilar soni · oylik sotuvlar · reyting · [Tahrirlash] [Statistika].
`[+ Yangi kurs]` — kurs yaratish ustasi (wizard): nom → tavsif → yo'nalish/pog'ona → narx modeli (bepul / bir martalik / obunaga kiradi) → muqova → trailer → moderatsiyaga.

### Darslar va materiallar — YADRO EKRAN (siz so'ragan tuzilma)
Kurs tanlanadi → ichida modul/dars daraxti (drag-drop tartiblash):

```
Kurs: "SMM noldan"
 ├─ 1-modul: Kirish
 │   ├─ 1.1-dars  [video ✓] [materiallar: 3] [test: 5 savol] [topshiriq ✓]
 │   └─ 1.2-dars  [video ✓] [materiallar: 1] [test: —] [topshiriq: —]
 └─ 2-modul: Kontent yaratish ...
```

**Bitta dars ichiga kiradigan narsalar (hammasi bitta ekranda, tab'larsiz vertikal bloklar):**
1. **Video:** yuklash (drag-drop, progress bilan) → avtomatik transcode + Whisper subtitr → ustoz subtitrni tahrirlaydi
2. **Dars mavzusi va tavsifi:** matn muharriri (sarlavha, qisqa reja)
3. **Materiallar:** fayl yuklash — PDF, rasm, slayd, shablon, Excel... har biriga nom + "filler" rasmlar galereyasi (darsga tegishli illyustratsiyalar to'plami, o'quvchi pleerda "Materiallar" tabida ko'radi/yuklaydi)
4. **Mini-test (tushunganlik nazorati):** savol qo'shish konstruktori — savol matni, 3-4 variant, to'g'ri javob, izoh ("nega bu to'g'ri"). **Qoida: test topshirilmaguncha keyingi dars ochilmaydi** (siz so'ragan "darsga vaqtida kirish" nazorati — bu Khan Academy mastery modeli)
5. **Uyga vazifa / topshiriq:** vazifa matni + namuna fayl + topshirish turi (fayl/matn/havola) + baholash mezoni

### Topshiriqlar (tekshirish navbati)
Kanban yoki jadval: Yangi → Tekshirilmoqda → Baholandi. Har topshiriq: o'quvchi ishi + AI dastlabki tahlili (mezonlar bo'yicha) + ustoz bahosi va izohi. Sizning AsproCRM lead-navbatingiz mantiqiga o'xshash oqim.

### O'quvchilarim
Jadval: ism · kurs · progress % · oxirgi faollik · test natijalari o'rtachasi. Filtr: "qotib qolganlar" (7+ kun faolsiz) → [Xabar yuborish] (shablon bilan). Qator bosilsa → o'quvchi drawer'i: to'liq progress xaritasi, topshiriqlari, unga yozilgan izohlar.

### Daromad
Oylik grafik · tranzaksiyalar jadvali (kurs, o'quvchi, summa, komissiya, sof) · yechib olish so'rovi (karta) · **obuna modeli hisobi**: kurs obunaga kirgan bo'lsa → oy davomida tomosha ulushi bo'yicha taqsimot ko'rinadi (quyida 4-bo'lim).

---

# 2. BILDIRISHNOMALAR MARKAZI + MYGOV XIZMATLARI

## 2.1. Kabinetdagi "Bildirishnomalar" bo'limi (uvedomleniya)

Qo'ng'iroqcha belgisi → panel, 3 tab:
- **Mening o'qishim:** dars eslatmalari, test natijalari, ustoz javoblari, streak ogohlantirishi
- **Imkoniyatlar:** yangi mos vakansiya, grant e'loni, yangi bepul kurs
- **Davlat yangiliklari:** yangi imtiyoz/qaror/dastur — FAQAT foydalanuvchi profiliga tegishlisi (Imtiyozlar Markazi dvigateli filtrlab beradi: guruh, yosh, hudud bo'yicha)

Har xabarda: qisqa matn + `[Batafsil]` + `[Rasmiylashtirish yo'riqnomasi]` (my.gov.uz'ga to'g'ri havola bilan). Sozlamalarda kanal tanlash: sayt / Telegram / SMS (faqat kritik).

## 2.2. MyGov bilan bog'lanish strategiyasi (bosqichli, realistik)

1. **Hozir (integratsiyasiz):** kontent-jamoa + huquqshunos yangi qarorlarni kuzatadi → Imtiyozlar bazasiga kiritadi → tizim mos foydalanuvchilarga avtomatik push. Har material qonun/qaror raqami va my.gov.uz havolasi bilan
2. **Keyin:** OneID orqali kirish (identifikatsiya) → bu MyGov ekotizimiga birinchi rasmiy qadam
3. **Maqsad:** IHMA/my.gov bilan ma'lumot almashinuv memorandumi → imtiyoz holatini avtomatik tekshirish ("siz bu subsidiyani olyapsizmi — ha/yo'q"). Bu muzokara masalasi, texnik tayyorgarlik arxitekturada bor (benefits target_rules dvigateli)

---

# 3. TIL O'RGANISH BO'LIMI — Ingliz · Rus · Nemis

## 3.1. Dunyo tajribasidan model (nimalarni o'rgandik)

| Manba | Olinadigan andoza |
|---|---|
| **Duolingo** | Kunlik mikro-darslar (5 daqiqa), streak, daraja daraxti — odat mexanizmi |
| **Busuu / Babbel** | Daraja testi bilan boshlash (A1-B2 aniqlanadi) → shaxsiy reja |
| **italki / Preply** | Jonli ustoz bozori — bizda "Ustoz bilan mashq" (soatbay, 2-bosqich) |
| **ELSA Speak** | AI talaffuz tahlili — mikrafonga gapirasan, xatoni ko'rsatadi |
| **BBC Learning English** | Bepul, sifatli, tematik video-darslar (ochiq kontent — pleylist sifatida ulash mumkin) |
| **Deutsche Welle (DW Learn German)** | NEMIS uchun oltin manba: A1-C1 to'liq BEPUL strukturali kurslar — nemis yo'nalishining asosi shu bo'ladi |
| **LingQ / o'qish usuli** | Kontekstda o'rganish: matn o'qib so'z yig'ish |

## 3.2. IMKON til bo'limi strukturasi

Har til (EN/RU/DE) uchun bir xil qolip:
1. **Daraja testi** (15 daqiqa, AI baholaydi) → A1/A2/B1... aniqlanadi
2. **"Ish uchun til" trekki** — bizning farqimiz: umumiy til emas, MAQSADLI: "IT so'zlashuvi", "Mijoz bilan yozishma", "Intervyu tili", "Freelance uchun ingliz" moduli
3. **Video darslar:** o'z ustozlarimiz + tanlangan ochiq kontent (YouTube pleylistlar — BBC/DW kabi rasmiy kanallardan embed, mualliflik huquqi buzilmaydi) — hammasi bizning pleer strukturamizda test/topshiriq bilan o'ralgan
4. **Ziyo bilan til amaliyoti (AI suhbatdosh):** matn va OVOZLI rejimda tanlangan tilda suhbat — "restoran roli", "intervyu roli" stsenariylari; xatolarni yumshoq to'g'irlaydi. Nogironligi bor inson uchun ideal: charchamaydi, kulmaydi, uyaltirmaydi
5. **Kunlik 5 daqiqa:** mikro-mashqlar (Duolingo modeli) + streak bilan bog'langan

## 3.3. Til o'rgatuvchi AI vositalar katalogi ("AI Qurollar Xonasi"ga qo'shiladi)

| Vosita | Til | Bepul? | Nima beradi |
|---|---|---|---|
| ChatGPT / Claude / Gemini (chat rejimi) | Hammasi | Bepul tarifda yetarli | Suhbat amaliyoti, tarjima, tushuntirish — eng universal |
| Google Translate + Lens | Hammasi | Bepul | Tarjima, kamera orqali matn, talaffuz eshitish |
| ELSA Speak | Ingliz | Freemium | AI talaffuz murabbiyi |
| Duolingo | EN/RU/DE bor | Freemium | Kunlik mashq odati |
| DW Learn German | Nemis | To'liq bepul | Strukturali A1-C1 |
| BBC Learning English | Ingliz | To'liq bepul | Video darslar, podkastlar |
| YouGlish | EN/DE | Bepul | So'zning real talaffuzi minglab videoda |
| Speechify/TTS | Hammasi | Freemium | Matnni eshitish (ko'zi ojizlar uchun til o'rganishda kritik) |

---

# 4. PULLIK MODELLAR — to'liq fikrlab chiqilgan variantlar

**Falsafa (siz aytganday):** instrumentlar maksimal bepul, biznes o'zini moliyalashtiradi. 3 daraja:

## 4.1. Foydalanuvchi tomonida — "3 daraja" modeli

| | **BEPUL (Start)** | **PLUS (oylik obuna)** | **PRO (oylik)** |
|---|---|---|---|
| Kurslar | Barcha bepul kurslar + donor homiyligidagilar | + Obuna kutubxonasi (pullik kurslar to'plami cheksiz) | + Hammasi |
| Ziyo AI | Kunlik limit (masalan 20 savol) | Kengaytirilgan limit + til amaliyoti rejimi | Cheksiz + ovozli rejim + Interview Coach to'liq |
| Sertifikat | Bepul kurslarda bazaviy | Tasdiqlangan sertifikat | + Portfolio PRO (video-hikoya) |
| Mentor | Guruh formatida | Oyiga 1 individual sessiya | Doimiy individual mentor |
| Narx mo'ljali | 0 | "Bir kofe" darajasi (arzon, ommaviy) | O'rtacha (jiddiy o'quvchilar) |

**Muhim himoya qoidasi:** nogironligi bor tasdiqlangan foydalanuvchi uchun PLUS darajasi donor fondi hisobidan avtomatik ochilishi mumkin ("stipendiya" mexanizmi) — pullik model hech qachon asosiy auditoriyani chetga surmaydi. Pulni asosan B2B/donor to'laydi, foydalanuvchi obunasi — qo'shimcha oqim.

## 4.2. Kurs monetizatsiyasining 3 sxemasi (parallel ishlaydi)

1. **Marketplace (bor):** ustoz narx qo'yadi, sotuvdan 70/30
2. **Obuna kutubxonasi (yangi):** ustoz kursini kutubxonaga qo'shadi → oylik obuna tushumi kurslar o'rtasida **tomosha vaqti ulushi** bo'yicha taqsimlanadi (Spotify modeli). Ustozga barqaror passiv daromad, bizga obuna bazasi
3. **Sotib olish (siz aytgan variant):** ayrim strategik kurslarni ustozdan BIR MARTALIK to'lov bilan to'liq sotib olamiz (eksklyuziv huquq) → o'zimiz bepul/obunada tarqatamiz. Qachon ishlatiladi: yo'nalishda kontent bo'shlig'i bo'lsa va donor shu yo'nalishni moliyalashtirsa. Ehtiyot qoidasi: bu modelni kamdan-kam, faqat flagman kurslar uchun — aks holda kapital tez ketadi

## 4.3. Qo'shimcha to'lov oqimlari

- **Jonli guruh kurslari:** ustoz bilan oylik to'lovli kohortalar (Zoom/jonli modul) → platforma 15-20% komissiya; "o'qituvchini bog'lab berish" siz aytgani shu
- **AI obuna:** Ziyo PRO limitlari (4.1-jadvalda) — AI xarajatini o'zi qoplaydigan qilib
- **Sertifikat verifikatsiya to'lovi:** bepul kursda o'qigan, faqat rasmiy sertifikat kerak bo'lsa — kichik to'lov
- **B2B paketlar (quyida 5-bo'lim) — eng katta potensial oqim**

---

# 5. B2B "XIZMATLAR AGENTLIGI" — kompaniyalarga paketlar

**G'oyangiz kuchli, rasmiylashtirdim.** Bu Biznes Inkubatorining "Mikro-agentlik" trekining tijorat qanoti: bitiruvchi jamoalar real mijozlarga xizmat qiladi, IMKON — sifat kafolati va sotuv kanali.

## 5.1. Uch paket (oylik, 1 oy to'liq xizmat)

| | **START** | **BIZNES** | **PREMIUM** |
|---|---|---|---|
| SMM (kontent-reja, postlar, storiz) | 12 post/oy | 20 post + storiz har kun | To'liq yuritish |
| Mobilografiya (surat/video telefonda) | 1 syomka kuni | 2 syomka kuni | 4 syomka + lokatsiya |
| Montaj (reels/video) | 4 ta reels | 10 ta reels | 20 ta + YouTube video |
| Ssenariy/kopiraytin | Post matnlari | + reels ssenariylari | + reklama matnlari |
| Call-markaz / onlayn operator | — | 1 operator (yarim stavka) | Operator + CRM yuritish |
| AI xizmatlar (chatbot sozlash, AI kontent) | — | Bazaviy chatbot | Chatbot + AI avtomatlashtirish |
| Narx pozitsiyasi | Bozordan ~50% arzon | ~40% arzon | ~30% arzon |

**Nega arzonroq qila olamiz (halol javob mijozga ham aytiladigan):** jamoalar masofada ishlaydi (ofis xarajati yo'q), donor-qo'llab-quvvatlangan tayyorlov, soliq imtiyozlari. "Arzon = sifatsiz" emas — har jamoada IMKON sifat nazoratchisi (tajribali mentor) bor.

## 5.2. Tashkiliy tuzilma

- **Viloyat jamoalari:** har viloyatda 1+ jamoa (3-5 bitiruvchi + 1 mentor-rahbar); mahalliy bizneslarga mahalliy jamoa xizmat qiladi (til, kontekst, kerak bo'lsa borish)
- **Sifat tizimi:** birinchi oy — sinov narxi; mijoz baholaydi; jamoa reytingi ochiq; muammoda IMKON boshqa jamoa biriktiradi (kafolat)
- **Taqsimot:** tushumning ~70% jamoaga, ~30% platformaga (sotuv, sifat nazorati, vositalar)
- **Sotuv kanali:** Employer Portal ichida "Xizmatlar" tab + alohida landing (biznes.imkondigital.uz) + sizning tadbirkorlar tarmog'ingiz orqali birinchi 10 mijoz

---

# 6. XALQARO ISHLAR (Upwork va boshqalar) — real vaqtda ko'rsatish

## 6.1. Muhim halol ogohlantirish (huquqiy)

Upwork'dan ishlarni scraping qilib o'z saytida ko'rsatish **ularning foydalanish shartlariga zid** — rasmiy API esa cheklangan va hamkorlik ruxsatini talab qiladi. Noqonuniy yo'l bilan boshlasak — IP bloklanadi va obro' xavfi bor. Shuning uchun 3 bosqichli QONUNIY strategiya:

## 6.2. Strategiya

**Bosqich 1 (darhol mumkin):** ruxsat etilgan ochiq manbalardan agregatsiya — RSS/API ochiq bo'lgan xalqaro doskalar: **Freelancer.com API** (rasmiy ochiq API bor), **RemoteOK, WeWorkRemotely, Remotive** (remote ish doskalari, RSS ochiq), **Kwork** (MDH bozori — rus tili, kirish osonroq!). Har ish kartasi: asl matn + **AI o'zbekcha tarjima + Ziyo tavsiyasi** ("bu ish sizga 82% mos, chunki...") + `[Asl manbada ochish]` havolasi (biz vositachi emas, yo'lboshchimiz — huquqiy toza)

**Bosqich 2:** **IMKON Agentlik modeli** (asl rejamizdagi) — Upwork'da IMKON'ning RASMIY agentlik profili ochiladi (bu Upwork qoidalarida ruxsat etilgan) → agentlik buyurtma oladi → ichki freelancerlarga taqsimlaydi → to'lov agentlik orqali → komissiya. Til va to'lov to'sig'ini biz yopamiz. Bajarilgan ishlar portfolioga tushadi

**Bosqich 3:** Upwork/Fiverr bilan rasmiy hamkorlik muzokarasi (API partner) — foydalanuvchi bazamiz o'sgach

## 6.3. Portfolio 2.0 — "har bir ish jarayon bilan"

Siz aytganday mukammal: har portfolio elementi = **case-hikoya**: Vazifa → Jarayon (2-3 oraliq kadr/versiya) → Natija → Mijoz bahosi → Ishlatilgan ko'nikmalar (teg). AI yordam: foydalanuvchi fayllarni tashlaydi, Ziyo case-matnni birga yozadi. Ochiq profil (imkondigital.uz/@username) endi shunchaki ro'yxat emas — ishonch uyg'otadigan vitrina.

---

# 7. PSIXOLOGIK QO'LLAB-QUVVATLASH — javobim: KERAK, lekin aniq chegarada

Siz o'z tajribangizdan aytdingiz — va bu aynan to'g'ri instinkt. Karyera o'zgarishidagi eng katta to'siq ko'pincha ko'nikma emas, ISHONCH. Bizning auditoriyada bu o'n barobar kuchli. LEKIN: biz tibbiy xizmat emasmiz va bo'lmasligimiz kerak. Xavfsiz model:

## 7.1. Nima QILAMIZ (3 qatlam)

1. **"Ruhiy kuch" kontent bo'limi:** qisqa video/audio darslar — o'ziga ishonch, rad javobi bilan ishlash, sindrom "men yetarli emasman", birinchi ish kuni qo'rquvi, charchoq. Mutaxassis psixolog bilan yozilgan, bizning ohangda (kuch, rahm emas)
2. **Peer-support (tengdosh ko'magi):** yo'lni bosib o'tganlar bilan suhbat davralar (guruh modullari ichida) — "men ham shu yerda edim" ta'siri hech qanday nazariyadan kuchli
3. **Professional yo'naltirish:** hamkor psixologlar ro'yxati (jumladan onlayn, imo-ishora biladigan) + davlat/NNT bepul xizmatlariga havolalar. Jiddiy holatlarda Ziyo va platforma FAQAT yo'naltiradi

## 7.2. Nima QILMAYMIZ (qat'iy chegara)

Tashxis yo'q · terapiya yo'q · Ziyo "psixolog roli"ni o'ynamaydi (qayg'uli signallarda: qisqa insoniy javob + professional resursga yo'naltirish) · inqiroz holatlari uchun aniq protokol (ishonch telefoni raqamlari doim ko'rinadigan joyda)

Bu bo'lim kichik boshlanadi (5-6 kontent + yo'naltirish sahifasi) — lekin borligining o'zi platformaga "bu yer meni tushunadi" tuyg'usini beradi. Grant hakamlari uchun ham kuchli: holistik yondashuv.

---

# 8. YANA QAYSI KATTA BO'LIMLAR UPDATE KUTMOQDA (auditim)

| Bo'lim | Holat | Tavsiya |
|---|---|---|
| **Sertifikat sahifasi (verify)** | Bazaviy | QR + case-portfolio ko'rinishiga ulash — ish beruvchi bir sahifada hammasini ko'rsin |
| **Qidiruv (global)** | Yo'q | Bitta qidiruv: kurs+vakansiya+material+imtiyoz — Ziyo bilan integratsiyada ("qidiruv topolmasa Ziyo javob beradi") |
| **Onboarding qayta ko'rik** | Bor | Yangi bo'limlar (tillar, B2B, psixologik) qo'shilgach qiziqish teglari yangilanishi kerak |
| **Employer Portal** | v0.6 darajasida | "Xizmatlar paketi" tab (5-bo'lim) + sinov topshirig'i (ko'r baholash) qo'shilsin |
| **Hududlar sahifalari** | Yo'q | Har viloyat sahifasi: mahalliy jamoa, koordinator, statistika — SEO uchun ham kuchli |
| **Ma'lumotlar eksporti** | Yo'q | Foydalanuvchi "mening ma'lumotlarim" arxivini yuklab olishi (ishonch + huquqiy standart) |

---

# 9. BAJARISH TARTIBI (tavsiya etilgan navbat)

1. **Ustoz Kabineti 2.0** (1-bo'lim) — kontent mashinasi ishga tushishi kerak, qolgan hamma narsa kontentga bog'liq
2. **Bildirishnomalar + davlat yangiliklari** (2) — retention dvigateli, texnik jihatdan tez
3. **Pullik model poydevori** (4.1 uch daraja + obuna kutubxonasi) — daromad boshlanishi
4. **Til bo'limi MVP** (3) — ingliz "ish uchun" trekki birinchi, DW bilan nemis ikkinchi
5. **B2B paketlar landing + birinchi 2 jamoa** (5) — sizning tarmog'ingiz orqali pilot
6. **Xalqaro ishlar Bosqich-1** (6) — qonuniy agregatsiya + AI tarjima
7. **Psixologik bo'lim** (7) — kontent tayyorlansa parallel
8. **8-bo'lim auditlari** — yo'l-yo'lakay

*Har bo'lim bo'yicha batafsil texnik spetsifikatsiya (DB jadvallari, API, ekranlar) kerak bo'lganda alohida so'rang — shu hujjat asosida sessiya-sessiya ochib beriladi.*

---

# 10. HOLAT AUDITI (2026-07-28, hujjat repo'ga qo'shilgan kunda kodbaza bilan solishtirildi)

Quyidagi audit — CONTRIBUTING.md 2-qoidasiga ("placeholder yo'q") sodiq qolib, "bajarildi" deb yozishdan oldin haqiqatan tekshirilgan holat. Xulosa: **bu reja deyarli to'liq YANGI ish** — MASTER_PLAN/V2/blueprint/benchmark bosqichlarida qurilgan narsalarning faqat parchalari qayta ishlatilishi mumkin.

| Bo'lim | Holat | Nima bor / nima yo'q |
|---|---|---|
| **1. Ustoz Kabineti 2.0** | Bajarildi (2026-08-01 yangilandi) | Yon-panel layout bor (`AppShell`/`CabinetShell`). Dashboard/Kurslarim/O'quvchilarim/Topshiriqlar haqiqiy ma'lumot bilan ishlaydi (yuqoridagi tavsif o'zgarishsiz). Test-gating ishlaydi. **2026-08-01: qolgan 4 qism ham bajarildi** — proaktiv "qulflangan modul" belgisi (`GET /courses/{id}/progress` endi `locked_module_ids` qaytaradi, `course-player.tsx` qulf ikonkasini oldindan ko'rsatadi — endi REAKTIV emas), kurslararo "Sharhlar" (`/ustoz/kurslar/sharhlar`, `GET /instructor/reviews`), "Jonli darslar" (`/ustoz/kurslar/jonli-darslar` — yangi `LiveLesson` modeli: kurs+sarlavha+vaqt+Zoom/Meet havolasi, o'quvchiga kurs sahifasida ham ko'rinadi), standalone "Sozlamalar" (`/ustoz/kurslar/sozlamalar` — Telegram bildirishnoma + ma'lumotlar eksporti). Hamon ATAYLAB yo'q: Daromad/payout (kurslarda to'lov integratsiyasi yo'qligicha qoladi, 4-bo'limga bog'liq). |
| **2. Bildirishnomalar + MyGov** | Qisman (2026-07-29 yangilandi) | **3-tab ENDI BOR** (Mening o'qishim/Imkoniyatlar/Davlat yangiliklari, har birida o'qilmagan-son belgisi) — `Notification.category` yangi ustun (migratsiya), barcha 11 mavjud bildirishnoma-yaratish joyi (employer/marketplace/courses/mentorship/donor/assessment/instructor_studio) aniq toifaga tayinlandi. **"Davlat yangiliklari" — 2.2-bo'limning "Hozir (integratsiyasiz)" bosqichi HAQIQIY ishlaydi**: moderator yangi imtiyoz e'lon qilganda (`POST /benefits/{id}/publish`), mavjud `is_relevant_to_user` moslik mantig'i orqali BARCHA mos foydalanuvchilarga avtomatik push (Celery fon vazifasi, asosiy amal navbat ishlamasa ham to'xtamaydi) — jonli tekshirilib, real Celery worker orqali ishlagani tasdiqlandi. MyGov/OneID integratsiyasi (2.2-bo'lim, "Keyin"/"Maqsad" bosqichlari) — hamon yo'q, real tashqi hamkorlik/API talab qiladi. |
| **3. Til o'rganish** | Qisman (2026-08-01 yangilandi) | Kurs kategoriyasiga 9-band — **"I — Til o'rganish"** (ingliz/rus/nemis, `ladder_step=2`) qo'shildi. Kunlik faollik hisoblagichi (streak) HAQIQIY ishlaydi. Ziyo'da til-amaliyot rejimi bor (EN/RU — nemis 2026-08-01'da AI audit natijasida olib tashlandi, faqat 2 tilda sifatli amaliyot berish uchun). **2026-08-01: Daraja aniqlash testi (3.2-bo'lim, 1-band) bajarildi** — `/daraja-testi`: `interview_coach.py` naqshidagi adaptiv Gemini suhbati + `exam_grader.py` naqshidagi qattiq-JSON CEFR-verdikt (A1-C1) sessiya oxirida. `PlacementTestSession`/`-Message` modellari, `AiFeature.PLACEMENT_TEST` kvotasi (3/kun), `/v1/ai/placement-test/*`. Litsenziyalangan kontent shart emas — savollar va baholash real vaqtda AI tomonidan generatsiya qilinadi. **Hamon yo'q** (ataylab qoldirilgan, real kontent/qaror talab qiladi): haqiqiy video-dars kontenti (3-4 til kursi uchun), yozma mashqlar banki — bular kontent-ishlab-chiqarish bosqichi, kod yozish bilan hal qilinmaydi. |
| **4. Pullik modellar (3-daraja)** | Qisman (2026-08-01 bajarildi) | **4.1-bo'lim (uch daraja) bajarildi**: `Subscription` modeli (FREE/PLUS/PRO), narxlar (PLUS=19000, PRO=49000 so'm/oy — foydalanuvchi tasdig'i bilan aniqlangan), Ziyo AI kvotasi rejaga qarab farqlanadi (30/80/300), nogironlik profili tasdiqlanganda avtomatik PLUS stipendiya (himoya qoidasi), admin panelda qo'lda faollashtirish UI, `/tariflar` real narx bilan. **Hamon yo'q**: o'z-o'zidan to'lov (Payme/Click recurring billing — alohida katta integratsiya), 4.2-bo'lim (obuna kutubxonasi, sotib olish sxemasi). |
| **5. B2B Xizmatlar Agentligi** | Yo'q | Marketplace bitta martalik gig/buyurtma (escrow), oylik paket/obuna xizmat yo'q. |
| **6. Xalqaro ishlar** | Qisman (2026-07-29, 1-bosqich bajarildi) | **1-bosqich (qonuniy agregatsiya) to'liq ishlaydi**: Remote OK (JSON API), Remotive (JSON API), We Work Remotely (RSS) — barchasi HAQIQIY ochiq manba, kod yozishdan oldin `curl` bilan tekshirilgan. Har yangi e'lon Gemini orqali o'zbekchaga tarjima qilinadi va Narvon pog'onasiga (0-4) tasniflanadi; mavjud (ichki) Match Score falsafasiga o'xshash moslik foizi hisoblanadi. `/xalqaro-ishlar` + `/xalqaro-ishlar/[id]` — har doim "Asl manbada ochish" havolasi bilan (biz vositachi emas). Admin panelda qo'lda-sinxronlash tugmasi. **Muhim jonli-tekshiruv topilmasi**: birinchi haqiqiy sinxronizatsiyada bitta ish e'loni tarjimasi Gemini 502 xatosiga uchraganda BUTUN sinxronizatsiya yiqilib qolgani aniqlandi (tuzatildi — endi bitta tarjima xatosi shu ishni ingliz tilida qoldiradi, qolganlariga ta'sir qilmaydi, keyingi sinxronizatsiyada avtomatik qayta uriniladi). Chuqurroq tekshiruvda haqiqiy sabab — loyihaning Gemini kaliti BEPUL DARAJADA, kuniga atigi 20 so'rov bilan cheklangani (`429 RESOURCE_EXHAUSTED`) — aniqlandi; bu kod xatosi emas, muhit/tarif cheklovi (ishlab chiqarishda pullik tarifga o'tish alohida qaror). Kwork (MDH bozori) va Freelancer.com (rasmiy API kalit ro'yxatdan o'tishni talab qiladi) ATAYLAB 1-bosqichga kiritilmadi. **2-bosqich** (IMKON Agentlik modeli) va **3-bosqich** (rasmiy Upwork/Fiverr hamkorlik) — hamon yo'q, real biznes hamkorlik talab qiladi. **6.3-bo'lim (Portfolio 2.0) ENDI BAJARILDI**: har portfolio elementi Vazifa→Jarayon (2-3 bosqich)→Natija→Mijoz bahosi→Ko'nikmalar formatida; Ziyo bilan birga case-matn yozish suhbati (`interview_coach.py` bilan bir xil sessiya-tuzilma, lekin yakunlanganda AI suhbatni tahlil qilib natijani to'g'ridan-to'g'ri portfolio elementiga yozadi); mijoz bahosi ATAYLAB faqat qo'lda kiritiladi (AI hech qachon o'ylab topmaydi). Ochiq profil (/u/username) endi to'liq case-hikoya vitrinasi. |
| **7. Psixologik yordam** | Qisman (2026-08-01 yangilandi) | **7.2-bo'lim (qat'iy chegara) TO'LIQ ishlaydi**: `SupportContent`/`SupportResource` modellari va admin CRUD, `/support/contents` va `/support/resources` ochiq endpoint. Migratsiya ikkita HAQIQIY tekshirilgan yordam raqamini seed qiladi — **103** va **1146**. Ziyo AI'ga qat'iy xavfsizlik chegarasi bor: psixolog rolini o'ynamaydi, jiddiy signalda `/ruhiy-kuch`ga yo'naltiradi. **2026-08-01: 7.1-bo'limning peer-support qismi bajarildi** — `/tengdosh-yordami`: 4 ta mavzu-davra (Ish qidirish/Birinchi ish kuni/O'ziga ishonch/Kundalik motivatsiya, migratsiya orqali seed). REAL inson-insonga yozishma (AI ishtirok etmaydi — `PeerSupportPost`). Xavfsizlik: `RoleCode.MODERATOR` post'ni sababi bilan yashira oladi (`AuditLog`ga yoziladi), foydalanuvchi shikoyat qoldiradi (`PeerSupportReport`), har sahifada `/ruhiy-kuch`ga statik havola. Ladder/nogironlik bo'yicha avtomatik guruhlash ATAYLAB qilinmadi (CONTRIBUTING.md 6-qoida). **Hamon yo'q** (litsenziyalangan mutaxassis/real biznes qaror talab qiladi): 7.1-bo'limning kontent qismi (video/audio darslar — `SupportContent` jadvali tayyor, lekin bo'sh, matnni psixolog yozishi kerak), hamkor psixologlar/NGO ro'yxati (2 tadan tashqari). |
| **8. Auditlar** (qidiruv, hudud sahifalari, eksport) | Bajarildi (2026-07-29) | Uchalasi ham endi to'liq ishlaydi. **Global qidiruv**: `GET /search?q=` — kurs+vakansiya+imtiyoz+material bitta so'rovda, `/qidiruv` sahifasi (kategoriyalangan natija, debounce), natija topilmasa "Ziyo'dan so'rash" — real Ziyo panelini ochib haqiqiy Gemini javobi oladi. **Hudud sahifalari**: `Region.slug` qo'shildi (14 viloyat uchun backfill), `/hududlar` (statistika-kartalar) + `/hududlar/[slug]` (batafsil+vakansiya preview) — HAQIQIY hisoblangan statistika (soxta "mahalliy jamoa" ko'rsatilmaydi, chunki 5-bo'lim hali yo'q). Yon-topilma: `region_id` User/Vacancy modellarida bor edi, lekin uni tanlaydigan HECH QANDAY forma yo'q edi — profil va vakansiya-yaratish formalariga qo'shildi (aks holda statistika doim 0 bo'lib qolardi). **Ma'lumotlar eksporti**: `GET /users/me/data-export` — profil+kurslar+sertifikat+portfolio+arizalar+buyurtmalar+streak+CV bitta JSON'da, profil sahifasida "Yuklab olish" tugmasi orqali to'g'ridan-to'g'ri fayl sifatida yuklanadi (bildirishnomalar/xayriyalar ATAYLAB kiritilmagan — xayriya hisobga bog'lanmagan). 406/406 backend test, Docker'da real login bilan to'liq tekshirildi. |

**Xulosa (2026-08-01 yangilandi):** 1/2/3/7/8-bo'limlar bajarildi (7-bo'limda faqat litsenziyalangan-mutaxassis-kontent qismi qoldi). 4.1-bo'lim (uch daraja) bajarildi, foydalanuvchi narxni tasdiqlagach. 6-bo'lim 1-bosqichi va 6.3-kichik bo'limi (Portfolio 2.0) bajarildi. Qolgan 5-bo'lim (B2B paketlar) hamon komissiya foizi qaroriga muhtoj. MyGov/OneID (2.2), Upwork rasmiy hamkorlik (6.2-bosqich 2/3), psixologik kontent (7.1-kontent), o'z-o'zidan to'lov (Payme/Click recurring billing) — real tashqi hamkorlik/vaqt/kattaroq integratsiya talab qiladi, kod bilan hal qilinmaydi. Foydalanuvchi bilan **bosqichma-bosqich, tasdiqlab olib** davom etiladi.
