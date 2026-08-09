"""Kunlik PostgreSQL backup - E6-bo'lim (UPDATE_5.0).

`pg_dump` orqali butun bazani gzip qilib R2/S3'ga yuklaydi (mavjud
`storage.py` naqshi - boshqa fayllar bilan bir xil bucket, alohida `backups/`
prefiks). Railway'ning o'zi ham volume-darajasida zaxira qilishi mumkin,
lekin bu ilova-darajasidagi, kuzatilishi mumkin bo'lgan qo'shimcha qatlam -
muvaffaqiyatsiz bo'lsa Celery natijasida ko'rinadi.
"""

import gzip
import subprocess
import tempfile
from datetime import UTC, datetime
from pathlib import Path

from app.core import storage
from app.core.config import get_settings
from app.worker.celery_app import celery_app

settings = get_settings()


def _sync_database_url() -> str:
    # pg_dump asyncpg drayverini tushunmaydi - oddiy postgresql:// kerak.
    return settings.database_url.replace("postgresql+asyncpg://", "postgresql://", 1)


def _run_backup() -> dict[str, object]:
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    key = f"backups/imkon-{today}.sql.gz"

    with tempfile.TemporaryDirectory() as tmp_dir:
        dump_path = Path(tmp_dir) / "dump.sql"
        gz_path = Path(tmp_dir) / "dump.sql.gz"

        with dump_path.open("wb") as dump_file:
            subprocess.run(
                ["pg_dump", "--no-owner", "--no-privileges", _sync_database_url()],
                stdout=dump_file,
                stderr=subprocess.PIPE,
                check=True,
                timeout=1200,
            )

        with dump_path.open("rb") as raw, gzip.open(gz_path, "wb") as gz_out:
            gz_out.writelines(raw)

        size_bytes = gz_path.stat().st_size
        storage.ensure_bucket()
        storage.upload_file(gz_path, key)

    return {"key": key, "size_bytes": size_bytes}


@celery_app.task(name="daily_db_backup")  # type: ignore[untyped-decorator]
def daily_db_backup() -> dict[str, object]:
    return _run_backup()
