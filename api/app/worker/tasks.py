"""Video transcode task — raw video -> HLS (240p..1080p, AES-128 shifrlangan) -> MinIO + subtitr.

Yuklab olishdan himoya (V2-5/C1.1): har segment AES-128 bilan shifrlanadi, kalit
`Lesson.hls_key_hex`da saqlanadi (hech qachon public schema orqali chiqarilmaydi) —
faqat `GET /v1/lessons/{id}/hls-key` orqali, haqiqiy kirish huquqi (bepul kurs
yoki ro'yxatdan o'tgan) tekshirilgandan keyin xom bayt sifatida beriladi. Segmentlarning
o'zi MinIO'da public-read bo'lib qolaveradi (shifrlangani uchun kalitsiz foydasiz) —
faqat kalit yetkazish autentifikatsiya talab qiladi (Netflix-uslubidagi standart model).
"""

import asyncio
import io
import secrets
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from faster_whisper import WhisperModel
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core import storage
from app.core.config import get_settings
from app.models.course import Lesson
from app.models.enums import LessonStatus
from app.worker.celery_app import celery_app

settings = get_settings()

_whisper_model: WhisperModel | None = None


@dataclass(frozen=True)
class Rendition:
    name: str
    height: int
    v_bitrate: str
    maxrate: str
    bufsize: str
    bandwidth: int
    width: int


# 240p — 3G/"trafik tejash" uchun asosiy; qolganlari HLS ABR orqali avtomatik tanlanadi
RENDITIONS: tuple[Rendition, ...] = (
    Rendition("240p", 240, "350k", "400k", "700k", 414000, 426),
    Rendition("480p", 480, "900k", "1000k", "1800k", 964000, 854),
    Rendition("720p", 720, "2000k", "2200k", "4000k", 2128000, 1280),
    Rendition("1080p", 1080, "4000k", "4400k", "8000k", 4128000, 1920),
)


def _probe_duration(path: Path) -> int | None:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        return int(float(result.stdout.strip()))
    except ValueError:
        return None


def _write_keyinfo(tmp_path: Path, lesson_id: int, key_bytes: bytes) -> Path:
    """AES-128 shifrlash uchun ffmpeg'ning `-hls_key_info_file` fayli.

    1-qator: .m3u8'ga yoziladigan URI (brauzer/hls.js shu manzildan kalitni so'raydi —
    frontend Next.js route orqali, httpOnly sessiya cookie bilan avtorizatsiya qilinadi).
    2-qator: xom kalit fayli mahalliy yo'li (ffmpeg shifrlash uchun ishlatadi).
    """
    key_path = tmp_path / "lesson.key"
    key_path.write_bytes(key_bytes)
    key_uri = f"{settings.site_url}/api/lessons/{lesson_id}/hls-key"
    keyinfo_path = tmp_path / "keyinfo.txt"
    keyinfo_path.write_text(f"{key_uri}\n{key_path}\n", encoding="utf-8")
    return keyinfo_path


def _transcode_rendition(src: Path, out_dir: Path, r: Rendition, keyinfo_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-vf",
            f"scale=-2:{r.height}",
            "-pix_fmt",
            "yuv420p",  # x264 main / web mosligi uchun 4:2:0 majburiy
            "-c:v",
            "libx264",
            "-profile:v",
            "main",
            "-crf",
            "23",
            "-b:v",
            r.v_bitrate,
            "-maxrate",
            r.maxrate,
            "-bufsize",
            r.bufsize,
            "-c:a",
            "aac",
            "-b:a",
            "64k",
            "-ac",
            "2",
            "-hls_time",
            "6",
            "-hls_playlist_type",
            "vod",
            "-hls_key_info_file",
            str(keyinfo_path),
            "-hls_segment_filename",
            str(out_dir / f"{r.name}_%03d.ts"),
            str(out_dir / f"{r.name}.m3u8"),
        ],
        capture_output=True,
        text=True,
        check=True,
    )


def _write_master(out_dir: Path) -> None:
    lines = ["#EXTM3U", "#EXT-X-VERSION:3"]
    for r in RENDITIONS:
        lines.append(f"#EXT-X-STREAM-INF:BANDWIDTH={r.bandwidth},RESOLUTION={r.width}x{r.height}")
        lines.append(f"{r.name}.m3u8")
    (out_dir / "master.m3u8").write_text("\n".join(lines) + "\n", encoding="utf-8")


def _get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = WhisperModel(
            settings.whisper_model_size, device="cpu", compute_type="int8"
        )
    return _whisper_model


def _vtt_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def _generate_subtitle_vtt(src: Path) -> tuple[str | None, str | None]:
    """Videodagi nutqni AI (self-hosted Whisper) orqali IKKI shaklda qaytaradi:
    (1) WebVTT — video pleer subtitri uchun, vaqt belgilari bilan;
    (2) tekis matn — lesson.transcript uchun (Study Buddy AI konteksti sifatida
    ishlatiladi — study_buddy.py). Bitta Whisper o'tishidan ikkalasi ham olinadi,
    qayta transkripsiya qilinmaydi.
    """
    model = _get_whisper_model()
    segments, _info = model.transcribe(str(src), beam_size=1)
    vtt_lines = ["WEBVTT", ""]
    plain_parts: list[str] = []
    has_content = False
    for seg in segments:
        has_content = True
        text = seg.text.strip()
        vtt_lines.append(f"{_vtt_timestamp(seg.start)} --> {_vtt_timestamp(seg.end)}")
        vtt_lines.append(text)
        vtt_lines.append("")
        plain_parts.append(text)
    if not has_content:
        return None, None
    return "\n".join(vtt_lines), " ".join(plain_parts)


async def _get_lesson_info(lesson_id: int) -> tuple[str | None, str | None]:
    """(raw_video_key, mavjud subtitle_url) qaytaradi."""
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    async with async_sessionmaker(engine)() as session:
        lesson = await session.get(Lesson, lesson_id)
        result = (lesson.raw_video_key, lesson.subtitle_url) if lesson else (None, None)
    await engine.dispose()
    return result


async def _finalize(
    lesson_id: int,
    hls_url: str | None,
    duration: int | None,
    new_status: str,
    subtitle_url: str | None = None,
    hls_key_hex: str | None = None,
    transcript: str | None = None,
) -> None:
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    async with async_sessionmaker(engine)() as session:
        lesson = await session.get(Lesson, lesson_id)
        if lesson is not None:
            lesson.status = new_status
            if hls_url is not None:
                lesson.hls_url = hls_url
            if duration is not None:
                lesson.duration = duration
            if subtitle_url is not None:
                lesson.subtitle_url = subtitle_url
            if hls_key_hex is not None:
                lesson.hls_key_hex = hls_key_hex
            if transcript is not None:
                lesson.transcript = transcript
            await session.commit()
    await engine.dispose()


@celery_app.task(name="transcode_lesson")  # type: ignore[untyped-decorator]
def transcode_lesson(lesson_id: int) -> dict[str, object]:
    """Darsning raw videosini HLS'ga o'giradi, lesson'ni yangilaydi va AI subtitr tayyorlaydi."""
    raw_key, existing_subtitle_url = asyncio.run(_get_lesson_info(lesson_id))
    if not raw_key:
        asyncio.run(_finalize(lesson_id, None, None, LessonStatus.FAILED))
        return {"lesson_id": lesson_id, "status": "failed", "reason": "raw video yo'q"}

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        src = tmp_path / "input"
        out_dir = tmp_path / "hls"
        out_dir.mkdir()

        try:
            storage.download_file(raw_key, src)
            duration = _probe_duration(src)
            key_bytes = secrets.token_bytes(16)
            keyinfo_path = _write_keyinfo(tmp_path, lesson_id, key_bytes)
            for r in RENDITIONS:
                _transcode_rendition(src, out_dir, r, keyinfo_path)
            _write_master(out_dir)
            storage.upload_dir(out_dir, f"hls/{lesson_id}")
            hls_url = storage.public_url(f"hls/{lesson_id}/master.m3u8")

            subtitle_url = existing_subtitle_url
            transcript: str | None = None
            if subtitle_url is None:
                # AI subtitr ixtiyoriy — muvaffaqiyatsiz bo'lsa ham video tayyor bo'lishi kerak
                try:
                    vtt_text, transcript = _generate_subtitle_vtt(src)
                    if vtt_text:
                        subtitle_url = storage.upload_fileobj(
                            io.BytesIO(vtt_text.encode()),
                            f"subtitles/{lesson_id}/auto.vtt",
                            "text/vtt",
                        )
                except Exception:
                    subtitle_url = None
                    transcript = None

            asyncio.run(
                _finalize(
                    lesson_id,
                    hls_url,
                    duration,
                    LessonStatus.READY,
                    subtitle_url,
                    key_bytes.hex(),
                    transcript,
                )
            )
            # Xom video endi kerak emas — HLS tayyor va DB'ga yozildi. O'chirish
            # xotira sarfini ~yarmiga tushiradi (xotira hisobi: docs/deploy.md).
            # Muvaffaqiyatsiz o'chirish darsni "failed" qilmasligi kerak — video
            # allaqachon tayyor, faqat xom nusxa ombordagi joyni band qiladi.
            try:
                storage.delete_object(raw_key)
            except Exception:
                pass
            return {"lesson_id": lesson_id, "status": "ready", "hls_url": hls_url}
        except subprocess.CalledProcessError as exc:
            asyncio.run(_finalize(lesson_id, None, None, LessonStatus.FAILED))
            return {"lesson_id": lesson_id, "status": "failed", "reason": (exc.stderr or "")[-500:]}
