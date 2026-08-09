"""daily_db_backup - pg_dump chaqiruvi va R2'ga yuklash (subprocess/storage mock)."""

from unittest.mock import MagicMock, patch

from app.worker.backup_tasks import _run_backup, _sync_database_url


def test_sync_database_url_strips_asyncpg_driver() -> None:
    with patch("app.worker.backup_tasks.settings") as mock_settings:
        mock_settings.database_url = "postgresql+asyncpg://imkon:imkon@localhost:5432/imkon"
        assert _sync_database_url() == "postgresql://imkon:imkon@localhost:5432/imkon"


def test_run_backup_calls_pg_dump_and_uploads_gzip() -> None:
    def fake_pg_dump(cmd, stdout, stderr, check, timeout):
        stdout.write(b"-- fake pg_dump output\n")
        return MagicMock(returncode=0)

    with (
        patch("app.worker.backup_tasks.subprocess.run", side_effect=fake_pg_dump) as mock_run,
        patch("app.worker.backup_tasks.storage.ensure_bucket") as mock_ensure,
        patch("app.worker.backup_tasks.storage.upload_file") as mock_upload,
    ):
        result = _run_backup()

    assert mock_run.call_count == 1
    assert mock_run.call_args.kwargs["check"] is True
    mock_ensure.assert_called_once()
    mock_upload.assert_called_once()
    uploaded_path, uploaded_key = mock_upload.call_args.args
    assert uploaded_key == result["key"]
    assert str(uploaded_key).startswith("backups/imkon-")
    assert str(uploaded_key).endswith(".sql.gz")
    assert result["size_bytes"] > 0
