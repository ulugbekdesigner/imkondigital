"""Ilova sozlamalari — muhit o'zgaruvchilaridan (pydantic-settings)."""

from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# environment="production" bo'lganda BU qiymatlardan birortasi ham default
# holida qolishi mumkin emas — masalan secret_key default qolsa, JWT
# tokenlarni HAR KIM shu (ochiq manbada ko'rinadigan) qiymat bilan soxta
# yasashi mumkin bo'lib qoladi; xuddi shunday payme/click/telegram sirlari
# webhook/ichki so'rovlarni soxtalashtirish imkonini beradi. Railway env var
# qo'yishni unutib qo'yishdan himoya — ilova jim ishlab, xavfsizlik teshigi
# bilan qolgani o'rniga startupda darhol qulaydi ("fail fast").
_INSECURE_DEFAULTS = {
    "secret_key": "dev-secret-change-me-in-production",
    "payme_merchant_key": "dev-payme-secret-key",
    "click_secret_key": "dev-click-secret-key",
    "telegram_internal_secret": "dev-telegram-internal-secret",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "IMKON Digital API"
    environment: str = Field(default="development")
    debug: bool = Field(default=False)

    # Xavfsizlik — prod'da SECRET_KEY majburiy o'zgartiriladi
    secret_key: str = Field(default="dev-secret-change-me-in-production")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=30)
    phone_code_expire_minutes: int = Field(default=10)

    # PostgreSQL (async)
    database_url: str = Field(
        default="postgresql+asyncpg://imkon:imkon@localhost:5432/imkon",
    )

    # Redis (sessiya, rate-limit, Celery broker)
    redis_url: str = Field(default="redis://localhost:6379/0")

    # S3-mos storage — dev'da MinIO (o'zi bucket yaratadi + public-read siyosat
    # o'rnatadi), prod'da Cloudflare R2 (bucket/public-domain Cloudflare panelida
    # qo'lda sozlanadi — R2 boto3 orqali put_bucket_policy'ni qo'llab-quvvatlamaydi,
    # shu sabab provider="r2" bo'lganda storage.ensure_bucket() hech narsa qilmaydi).
    s3_provider: str = Field(default="minio")  # "minio" | "r2"
    s3_endpoint: str = Field(default="http://localhost:9000")  # server ichki (upload/download)
    s3_public_endpoint: str = Field(default="http://localhost:9000")  # brauzerga URL
    s3_access_key: str = Field(default="minioadmin")
    s3_secret_key: str = Field(default="minioadmin")
    s3_bucket: str = Field(default="imkon-media")

    # Celery (video transcode navbati)
    celery_broker_url: str = Field(default="redis://localhost:6379/1")
    celery_result_backend: str = Field(default="redis://localhost:6379/2")

    # CORS — vergul bilan ajratilgan ruxsat etilgan manzillar
    cors_origins: str = Field(default="http://localhost:3000")

    # Public sayt manzili — sertifikat QR-kodida verify havolasi uchun
    site_url: str = Field(default="http://localhost:3000")

    # To'lov — Payme/Click merchant kredentiallari (prod'da haqiqiy qiymat bilan almashtiriladi)
    payme_merchant_id: str = Field(default="dev-payme-merchant-id")
    payme_merchant_key: str = Field(default="dev-payme-secret-key")
    click_service_id: str = Field(default="dev-click-service-id")
    click_merchant_id: str = Field(default="dev-click-merchant-id")
    click_secret_key: str = Field(default="dev-click-secret-key")

    # Telegram — Notification Center kanali (aiogram bot, prod'da haqiqiy token bilan almashadi)
    telegram_bot_token: str = Field(default="dev-telegram-bot-token")
    telegram_bot_username: str = Field(default="imkon_digital_bot")
    # Bot -> API ichki so'rovi uchun umumiy sir (JWT emas — bot oddiy foydalanuvchi emas)
    telegram_internal_secret: str = Field(default="dev-telegram-internal-secret")

    # Tezkor Auth — markazlashgan Telegram-orqali kirish mikroservisi (@tezkortasdiqbot,
    # alohida loyiha). Bo'sh qiymat = xususiyat sukut bo'yicha o'chirilgan (start
    # chaqiruvi Tezkor Auth'dan xato oladi, funksional muvaffaqiyatsizlik — xavfsizlik
    # teshigi emas, shu sabab boshqa sirlar kabi fail-fast talab qilinmaydi).
    tezkor_auth_url: str = Field(default="http://127.0.0.1:8080")
    tezkor_auth_api_key: str = Field(default="")
    tezkor_auth_hmac_secret: str = Field(default="")

    # AI qatlami — Google Gemini API. Hozircha yagona provayder — sodda
    # savol-javob vazifalari uchun yetarli; kelajakda murakkab vazifalar
    # (masalan chuqur tahlil) uchun qo'shimcha provayder ulanishi mumkin,
    # shu sabab wrapper (app/core/ai_client.py) provayderdan mustaqil qilingan.
    gemini_api_key: str = Field(default="dev-gemini-api-key")
    gemini_model: str = Field(default="gemini-flash-latest")
    ai_daily_quota_career_coach: int = Field(default=20)
    ai_daily_quota_cv_builder: int = Field(default=3)
    ai_daily_quota_interview_coach: int = Field(default=10)
    ai_daily_quota_study_buddy: int = Field(default=30)
    ai_daily_quota_exam_grader: int = Field(default=5)
    ai_daily_quota_ziyo: int = Field(default=30)
    ai_daily_quota_case_story: int = Field(default=10)
    ai_daily_quota_placement_test: int = Field(default=3)

    # Pullik daraja bo'yicha Ziyo kvotasi farqi (4.1-bo'lim) — FREE'niki
    # yuqoridagi ai_daily_quota_ziyo'ning o'zi
    ai_daily_quota_ziyo_plus: int = Field(default=80)
    ai_daily_quota_ziyo_pro: int = Field(default=300)

    # Pullik daraja narxlari (so'm/oy) — 4.1-bo'lim: PLUS "bir kofe darajasi",
    # PRO "o'rtacha (jiddiy o'quvchilar)". O'z-o'zidan to'lov oqimi hali yo'q —
    # bu raqamlar hozircha faqat ko'rsatish uchun (/tariflar), faollashtirish
    # admin orqali (Subscription.granted_by="admin").
    subscription_plus_price_som: int = Field(default=19000)
    subscription_pro_price_som: int = Field(default=49000)

    # AI subtitr — self-hosted Whisper (faster-whisper), tashqi API kalit kerak emas
    whisper_model_size: str = Field(default="tiny")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @model_validator(mode="after")
    def _forbid_insecure_defaults_in_production(self) -> "Settings":
        if self.environment != "production":
            return self
        leaked = [
            field for field, insecure in _INSECURE_DEFAULTS.items() if getattr(self, field) == insecure
        ]
        if leaked:
            raise ValueError(
                "production muhitida standart (xavfsiz bo'lmagan) qiymatda qolgan "
                f"sozlamalar: {', '.join(leaked)}. Railway'da tegishli muhit "
                "o'zgaruvchilarini o'rnating."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
