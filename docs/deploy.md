# IMKON Digital — Production deploy (VPS)

`docker-compose.prod.yml` orqali bitta VPS'ga joylashtirish uchun qo'llanma
(MASTER_PLAN v1.0 bosqichi). Ubuntu 22.04+ VPS, kamida 4 vCPU / 8GB RAM
tavsiya qilinadi (Whisper subtitr + video transcode CPU/xotira talab qiladi —
masalan Hetzner CX32).

Video/fayl ombori — o'z-VPS-ichidagi MinIO EMAS, **Cloudflare R2** (S3-mos,
tomoshabin trafigi — egress — bepul). Sabab: video striming xarajatining
asosiy qismi odatda egress bo'ladi, R2'da bu $0.

## 1. Oldindan tayyorgarlik

- VPS'da Docker Engine + Docker Compose plugin o'rnatilgan bo'lishi kerak.
- Domen (masalan `imkondigital.uz`) Cloudflare'ga ulangan (nameserver'lar
  Cloudflare'ga o'zgartirilgan) bo'lishi kerak.
- DNS'da (Cloudflare paneli):
  - `imkondigital.uz`, `www`, `api` — A yozuvi, VPS IP'siga, **proxy YOQILGAN**
    (to'q sariq bulut — Cloudflare orqali o'tadi, IP yashiriladi).
  - `media` — R2 bucket'ning custom domeni sifatida ulanadi (2-bosqichga
    qarang) — bu VPS IP'siga EMAS, R2'ga ishora qiladi.
- 80 va 443 portlar ochiq (firewall/security group).

## 2. Media ombori (Cloudflare R2)

1. Cloudflare panelida **R2 Object Storage** bo'limiga o'ting, yangi bucket
   yarating: nomi `imkon-media` (yoki xohlagan nom — keyin `.env`da
   `R2_BUCKET`ga shu nomni yozasiz).
2. **Settings → Custom Domains** bo'limida bucket'ga `media.imkondigital.uz`
   domenini bog'lang (Cloudflare avtomatik TLS sertifikat chiqaradi — bu
   bizning certbot'imizdan MUSTAQIL, alohida boshqariladi).
3. **R2 → Manage API Tokens** orqali yangi API token yarating: ruxsat —
   "Object Read & Write", faqat shu bucket'ga cheklab qo'yish tavsiya etiladi.
   Token yaratilganda 3 ta qiymat beriladi — bularni saqlab qo'ying:
   - **Account ID** → `.env`dagi `R2_ACCOUNT_ID`
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
4. Bucket ochiq (public-read) — chunki HLS pleer va sertifikatlar brauzerdan
   to'g'ridan-to'g'ri o'qiladi; custom domain ulash shuni avtomatik ta'minlaydi
   (alohida bucket-policy sozlash SHART EMAS — bu MinIO'dan farqi, R2'da
   ochiqlik custom domain orqali beriladi).

## 3. Repo va domenni sozlash

```bash
git clone <repo-url> /opt/imkondigital && cd /opt/imkondigital

# nginx konfiguratsiyalaridagi "imkondigital.uz"ni haqiqiy domeningizga almashtiring:
sed -i 's/imkondigital\.uz/SIZNING-DOMENINGIZ/g' deploy/nginx.conf deploy/nginx.bootstrap.conf
```

## 4. `.env` yaratish (repo root, GIT'GA COMMIT QILINMAYDI)

```bash
cat > .env <<'EOF'
DOMAIN=SIZNING-DOMENINGIZ
SECRET_KEY=<openssl rand -hex 32 bilan generatsiya qiling>
POSTGRES_PASSWORD=<kuchli parol>
R2_ACCOUNT_ID=<2-bosqichda olingan Account ID>
R2_ACCESS_KEY_ID=<2-bosqichda olingan Access Key ID>
R2_SECRET_ACCESS_KEY=<2-bosqichda olingan Secret Access Key>
R2_BUCKET=imkon-media
GEMINI_API_KEY=<haqiqiy Google Gemini API kaliti>
TELEGRAM_BOT_TOKEN=<BotFather'dan olingan token>
TELEGRAM_INTERNAL_SECRET=<openssl rand -hex 32>
PAYME_MERCHANT_ID=
PAYME_MERCHANT_KEY=
CLICK_SERVICE_ID=
CLICK_MERCHANT_ID=
CLICK_SECRET_KEY=
EOF
chmod 600 .env
```

Payme/Click maydonlari bo'sh qoldirilsa to'lov integratsiyasi ishlamaydi —
tayyor bo'lganda to'ldiring va `docker compose -f docker-compose.prod.yml up -d api worker` bilan qayta ishga tushiring.

## 5. Birinchi TLS sertifikat (chicken-and-egg yechimi)

Asosiy `nginx.conf` 443-portda sertifikatga tayanadi, lekin sertifikat hali
yo'q — shu sabab avval **bootstrap** konfiguratsiya bilan faqat HTTP'da
ishga tushiramiz, sertifikat olamiz, keyin asosiy konfiguratsiyaga o'tamiz.

```bash
# 5.1 — bootstrap nginx (faqat :80, ACME challenge uchun)
docker run -d --name nginx-bootstrap \
  -p 80:80 \
  -v "$(pwd)/deploy/nginx.bootstrap.conf:/etc/nginx/nginx.conf:ro" \
  -v certbot-www:/var/www/certbot \
  nginx:1.27-alpine

# 5.2 — sertifikat so'raymiz (webroot usuli) — media.SIZNING-DOMENINGIZ BU
# YERDA YO'Q: uning TLS sertifikatini Cloudflare R2 custom domain o'zi
# avtomatik chiqaradi, bizning certbot faqat VPS'dagi 3 subdomen uchun.
docker run --rm \
  -v certbot-www:/var/www/certbot \
  -v certbot-etc:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d SIZNING-DOMENINGIZ -d www.SIZNING-DOMENINGIZ \
  -d api.SIZNING-DOMENINGIZ \
  --email siz@example.com --agree-tos --no-eff-email

# 5.3 — bootstrap'ni to'xtatamiz, asosiy stack'ga o'tamiz
docker rm -f nginx-bootstrap
```

`certbot-www` va `certbot-etc` — `docker-compose.prod.yml`dagi bilan bir xil
nom bilan named volume sifatida yaratiladi, shu sabab keyingi bosqichda
compose ularni to'g'ridan-to'g'ri topadi.

## 6. To'liq stackni ishga tushirish

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps   # hammasi "healthy" bo'lguncha kuting
```

`certbot` konteyneri fonda ishlab, sertifikatni har 12 soatda avtomatik
yangilaydi (`certbot renew`) — qo'shimcha cron kerak emas.

## 7. Migratsiya va tekshiruv

Migratsiyalar `api` konteyneri ishga tushganda avtomatik qo'llanadi
(`Dockerfile`dagi `CMD`). Tekshirish:

```bash
curl -f https://api.SIZNING-DOMENINGIZ/health
curl -f https://SIZNING-DOMENINGIZ
curl -f https://media.SIZNING-DOMENINGIZ   # R2 custom domain — 403/404 kutiladi
                                             # (bo'sh bucket ildizi), lekin ulanish
                                             # xato bermasligi kerak
```

## 8. Backup

- **Postgres**: `docker compose -f docker-compose.prod.yml exec postgres pg_dump -U imkon imkon | gzip > backup-$(date +%F).sql.gz` — kunlik cron sifatida rejalashtiring, natijani VPS'dan tashqarida saqlang (masalan boshqa R2 bucket yoki Backblaze B2).
- **R2 (video/fayllar)**: alohida backup SHART EMAS — R2 o'zi 11 to'qqizlik (99.999999999%) durability bilan saqlaydi (AWS S3 bilan bir xil daraja). Juda muhim bo'lsa, `rclone` orqali boshqa R2/B2 bucket'ga davriy sync qilish mumkin.

## 9. Yangilash (deploy)

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Eski image'lar avtomatik almashtiriladi; migratsiyalar `api` qayta ishga
tushganda avtomatik qo'llanadi. Downtime — bir necha soniya (`api`/`web`
qayta ishga tushishi vaqti).

## 10. Xavfsizlik nazorat ro'yxati (DoD)

- [x] `.env` `.gitignore`da, hech qachon commit qilinmaydi
- [x] `postgres`/`redis` host portlariga ochilmagan (faqat ichki tarmoq)
- [x] `api`/`web` non-root foydalanuvchi bilan ishlaydi (Dockerfile)
- [x] Auth endpoint'lari (login/register/verify-phone) Redis rate-limit bilan himoyalangan
- [x] Xavfsizlik sarlavhalari (HSTS, X-Frame-Options, X-Content-Type-Options) Nginx va ilova qatlamida
- [x] R2 bucket faqat GET orqali ochiq (custom domain read-only'ga yozish kaliti hech qachon brauzerga berilmaydi — yozish faqat `api`/`worker` ichidan, API token orqali)
- [x] TLS: VPS uchun Let's Encrypt (avtomatik yangilanadi), R2 custom domain uchun Cloudflare (avtomatik)
