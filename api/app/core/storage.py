"""S3-mos obyekt ombori (dev: MinIO, prod: Cloudflare R2) — video, HLS, subtitr,
submission fayllari.

Server ichki endpoint orqali yuklaydi/oladi; brauzerga public endpoint URL beradi.
"""

import json
import mimetypes
import secrets
from functools import lru_cache
from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.client import BaseClient, Config
from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

settings = get_settings()

# Kategoriya: (ruxsat etilgan kengaytmalar, maksimal hajm — bayt). Foydalanuvchi
# yuklaydigan HAR bir joy (kurs materiali, submission, portfolio, buyurtma
# chati, nogironlik hujjati) shu ro'yxatdan foydalanishi SHART — avval hech
# qanday hajm/kengaytma tekshiruvi yo'q edi, xom `file.filename` to'g'ridan-
# to'g'ri saqlash kalitiga qo'yilardi va mijoz yuboradigan `file.content_type`
# (soxtalashtirilishi oson) S3 metama'lumotiga ishonib yozilardi — bucket
# public-read bo'lgani uchun bu istalgan turdagi (masalan .html) faylni
# istalgan Content-Type bilan ochiq xizmat qilish imkonini berardi.
_UPLOAD_CATEGORIES: dict[str, tuple[frozenset[str], int]] = {
    "video": (frozenset({".mp4", ".mov", ".mkv", ".webm", ".avi"}), 3 * 1024**3),  # 3 GB
    "subtitle": (frozenset({".vtt", ".srt"}), 2 * 1024**2),  # 2 MB
    "document": (frozenset({".pdf", ".jpg", ".jpeg", ".png"}), 8 * 1024**2),  # 8 MB
    "attachment": (
        frozenset({".pdf", ".doc", ".docx", ".zip", ".jpg", ".jpeg", ".png", ".webp"}),
        25 * 1024**2,
    ),  # 25 MB
}


def validate_upload(file: UploadFile, category: str) -> str:
    """Kengaytma/hajmni tekshiradi, xavfsiz (tasodifiy) fayl nomini qaytaradi.

    Qaytarilgan nom saqlash kaliti uchun ishlatilsin — xom `file.filename`
    EMAS (yo'l-navigatsiya belgilari, o'ta uzun/g'alati nomlar, kolliziya
    xavfisiz; kengaytma tasdiqlangan ro'yxatdan, shu sabab Content-Type
    ham xavfsiz avtomatik aniqlanadi — `upload_fileobj`ga mijoz
    `content_type`ini uzatish shart emas).
    """
    allowed_ext, max_bytes = _UPLOAD_CATEGORIES[category]
    ext = Path(file.filename or "").suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ruxsat etilmagan fayl turi. Qabul qilinadi: {', '.join(sorted(allowed_ext))}",
        )
    if not file.size:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bo'sh fayl")
    if file.size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fayl juda katta (maksimal {max_bytes // (1024 * 1024)} MB)",
        )
    return f"{secrets.token_hex(16)}{ext}"


@lru_cache
def get_client() -> BaseClient:
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name="us-east-1",
        config=Config(signature_version="s3v4"),
    )


def ensure_bucket() -> None:
    """Bucket'ni yaratadi (yo'q bo'lsa) va public-read siyosatini o'rnatadi.

    HLS pleer va muqovalar brauzerdan to'g'ridan-to'g'ri o'qiladi.

    R2'da bu no-op: Cloudflare R2 boto3'ning `put_bucket_policy`'sini
    qo'llab-quvvatlamaydi — bucket va uning ochiq (public) domeni Cloudflare
    panelida/`wrangler` orqali OLDINDAN qo'lda sozlanadi (docs/deploy.md'ga
    qarang), ilova kodi bu yerda hech narsa o'zgartirmaydi.
    """
    if settings.s3_provider == "r2":
        return
    client = get_client()
    bucket = settings.s3_bucket
    existing = {b["Name"] for b in client.list_buckets().get("Buckets", [])}
    if bucket not in existing:
        client.create_bucket(Bucket=bucket)
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket}/*"],
            }
        ],
    }
    client.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy))


def _content_type(key: str, fallback: str = "application/octet-stream") -> str:
    if key.endswith(".m3u8"):
        return "application/vnd.apple.mpegurl"
    if key.endswith(".ts"):
        return "video/mp2t"
    if key.endswith(".vtt"):
        return "text/vtt"
    return mimetypes.guess_type(key)[0] or fallback


def upload_fileobj(fileobj: BinaryIO, key: str, content_type: str | None = None) -> str:
    get_client().upload_fileobj(
        fileobj,
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type or _content_type(key)},
    )
    return public_url(key)


def upload_file(path: Path, key: str) -> str:
    get_client().upload_file(
        str(path),
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": _content_type(key)},
    )
    return public_url(key)


def upload_dir(local_dir: Path, prefix: str) -> None:
    """Papkadagi barcha fayllarni prefix ostiga yuklaydi (HLS segmentlari uchun)."""
    for item in local_dir.iterdir():
        if item.is_file():
            upload_file(item, f"{prefix}/{item.name}")


def download_file(key: str, path: Path) -> None:
    get_client().download_file(settings.s3_bucket, key, str(path))


def delete_object(key: str) -> None:
    get_client().delete_object(Bucket=settings.s3_bucket, Key=key)


def public_url(key: str) -> str:
    # R2'da public domen (masalan media.imkondigital.uz) Cloudflare panelida
    # BITTA bucket'ga bog'lanadi — shu sabab yo'lda bucket nomi qatnashmaydi
    # (MinIO'dagi path-style'dan farqli, R2 custom domain to'g'ridan-to'g'ri
    # kalitga ishora qiladi).
    if settings.s3_provider == "r2":
        return f"{settings.s3_public_endpoint}/{key}"
    return f"{settings.s3_public_endpoint}/{settings.s3_bucket}/{key}"
