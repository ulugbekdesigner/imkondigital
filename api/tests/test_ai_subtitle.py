"""AI subtitr — VTT vaqt formatlash va ikki-shaklli (VTT+tekis matn) generatsiya,
Whisper modelisiz (soxta model bilan) testlanadi.
"""

from pathlib import Path
from unittest.mock import patch

from app.worker import tasks
from app.worker.tasks import _vtt_timestamp


def test_vtt_timestamp_formats_zero() -> None:
    assert _vtt_timestamp(0.0) == "00:00:00.000"


def test_vtt_timestamp_formats_minutes_and_seconds() -> None:
    assert _vtt_timestamp(75.5) == "00:01:15.500"


def test_vtt_timestamp_formats_hours() -> None:
    assert _vtt_timestamp(3661.25) == "01:01:01.250"


class _FakeSegment:
    def __init__(self, start: float, end: float, text: str) -> None:
        self.start = start
        self.end = end
        self.text = text


class _FakeWhisperModel:
    def __init__(self, segments: list[_FakeSegment]) -> None:
        self._segments = segments

    def transcribe(self, *args: object, **kwargs: object) -> tuple[list[_FakeSegment], None]:
        return self._segments, None


def test_generate_subtitle_vtt_returns_vtt_and_plain_transcript() -> None:
    """lesson.transcript (Study Buddy AI konteksti) va subtitle_url (video pleer)
    BITTA Whisper o'tishidan ikkalasi ham to'g'ri chiqishini tekshiradi."""
    segments = [
        _FakeSegment(0.0, 2.5, " Salom, bugun HTML haqida gaplashamiz."),
        _FakeSegment(2.5, 5.0, " Birinchi teglarni ko'rib chiqamiz."),
    ]
    with patch.object(tasks, "_get_whisper_model", return_value=_FakeWhisperModel(segments)):
        vtt_text, transcript = tasks._generate_subtitle_vtt(Path("fake.mp4"))

    assert vtt_text is not None
    assert vtt_text.startswith("WEBVTT")
    assert "00:00:00.000 --> 00:00:02.500" in vtt_text
    assert "Salom, bugun HTML haqida gaplashamiz." in vtt_text

    assert transcript == (
        "Salom, bugun HTML haqida gaplashamiz. Birinchi teglarni ko'rib chiqamiz."
    )


def test_generate_subtitle_vtt_returns_none_for_silent_video() -> None:
    with patch.object(tasks, "_get_whisper_model", return_value=_FakeWhisperModel([])):
        vtt_text, transcript = tasks._generate_subtitle_vtt(Path("fake.mp4"))
    assert vtt_text is None
    assert transcript is None
