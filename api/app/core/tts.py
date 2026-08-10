"""Edge-TTS orqali dars matnini ovozga aylantirish (voice_tts xususiyat bayrogʻi ortida)."""

import tempfile
from pathlib import Path

import edge_tts

from app.core import storage

_VOICE = "uz-UZ-MadinaNeural"


async def synthesize_lesson_audio(lesson_id: int, text: str) -> str:
    """Matnni MP3'ga aylantirib, obyekt omboriga yuklaydi va ochiq URL qaytaradi."""
    communicate = edge_tts.Communicate(text, _VOICE)
    storage.ensure_bucket()
    with tempfile.TemporaryDirectory() as tmp_dir:
        path = Path(tmp_dir) / f"{lesson_id}.mp3"
        await communicate.save(str(path))
        return storage.upload_file(path, f"tts/lessons/{lesson_id}.mp3")
