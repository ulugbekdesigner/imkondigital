"""ai_client.generate_ai_reply — Gemini 429/5xx xatolarini boshqarish."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from google.genai import errors

from app.core.ai_client import generate_ai_reply


async def test_gemini_quota_exhausted_returns_503() -> None:
    quota_error = errors.ClientError(429, {"status": "RESOURCE_EXHAUSTED", "message": "kunlik limit"})
    with patch(
        "app.core.ai_client._client.aio.models.generate_content",
        new=AsyncMock(side_effect=quota_error),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await generate_ai_reply(system="tizim", messages=[{"role": "user", "content": "salom"}])
    assert exc_info.value.status_code == 503


async def test_other_client_error_returns_502() -> None:
    bad_request = errors.ClientError(400, {"status": "INVALID_ARGUMENT", "message": "yaroqsiz"})
    with patch(
        "app.core.ai_client._client.aio.models.generate_content",
        new=AsyncMock(side_effect=bad_request),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await generate_ai_reply(system="tizim", messages=[{"role": "user", "content": "salom"}])
    assert exc_info.value.status_code == 502


async def test_server_error_retries_then_succeeds() -> None:
    server_error = errors.ServerError(503, {"status": "UNAVAILABLE", "message": "band"})
    mock_response = AsyncMock()
    mock_response.text = "Muvaffaqiyatli javob"
    mock_call = AsyncMock(side_effect=[server_error, mock_response])
    with patch("app.core.ai_client._client.aio.models.generate_content", new=mock_call):
        with patch("app.core.ai_client.asyncio.sleep", new=AsyncMock()) as mock_sleep:
            result = await generate_ai_reply(
                system="tizim", messages=[{"role": "user", "content": "salom"}]
            )
    assert result == "Muvaffaqiyatli javob"
    assert mock_call.call_count == 2
    mock_sleep.assert_awaited_once_with(1.0)


async def test_server_error_exhausts_retries_returns_502() -> None:
    server_error = errors.ServerError(503, {"status": "UNAVAILABLE", "message": "band"})
    mock_call = AsyncMock(side_effect=[server_error, server_error, server_error])
    with patch("app.core.ai_client._client.aio.models.generate_content", new=mock_call):
        with patch("app.core.ai_client.asyncio.sleep", new=AsyncMock()):
            with pytest.raises(HTTPException) as exc_info:
                await generate_ai_reply(
                    system="tizim", messages=[{"role": "user", "content": "salom"}]
                )
    assert exc_info.value.status_code == 502
    # 1 dastlabki urinish + 2 qayta urinish = 3 ta chaqiruv
    assert mock_call.call_count == 3


async def test_unexpected_exception_returns_502() -> None:
    with patch(
        "app.core.ai_client._client.aio.models.generate_content",
        new=AsyncMock(side_effect=RuntimeError("kutilmagan")),
    ):
        with patch("app.core.ai_client.asyncio.sleep", new=AsyncMock()):
            with pytest.raises(HTTPException) as exc_info:
                await generate_ai_reply(
                    system="tizim", messages=[{"role": "user", "content": "salom"}]
                )
    assert exc_info.value.status_code == 502
