"""Click MD5 imzo formulasi — sof funksiyalar, DB/tarmoqsiz."""

import hashlib

from app.core.payment_sign import (
    click_complete_signature,
    click_prepare_signature,
    sum_to_tiyin,
    tiyin_to_sum,
    verify_click_signature,
)


def test_click_prepare_signature_matches_manual_md5() -> None:
    # Rasmiy formula: click_trans_id+service_id+SECRET+merchant_trans_id+amount+action+sign_time
    raw = "111" + "service1" + "secret42" + "150000" + "42000" + "0" + "20260710"
    expected = hashlib.md5(raw.encode()).hexdigest()
    actual = click_prepare_signature(
        click_trans_id="111",
        service_id="service1",
        secret_key="secret42",
        merchant_trans_id="150000",
        amount="42000",
        action="0",
        sign_time="20260710",
    )
    assert actual == expected
    assert len(actual) == 32  # MD5 hex digest — 32 belgi


def test_click_complete_signature_matches_manual_md5() -> None:
    # Rasmiy formula: ...+merchant_trans_id+merchant_prepare_id+amount+action+sign_time
    raw = "111" + "service1" + "secret42" + "150000" + "999" + "42000" + "1" + "20260710"
    expected = hashlib.md5(raw.encode()).hexdigest()
    actual = click_complete_signature(
        click_trans_id="111",
        service_id="service1",
        secret_key="secret42",
        merchant_trans_id="150000",
        merchant_prepare_id="999",
        amount="42000",
        action="1",
        sign_time="20260710",
    )
    assert actual == expected


def test_prepare_and_complete_signatures_differ() -> None:
    kwargs = dict(
        click_trans_id="1",
        service_id="s",
        secret_key="k",
        merchant_trans_id="42",
        amount="1000",
        action="0",
        sign_time="t",
    )
    prepare = click_prepare_signature(**kwargs)
    complete = click_complete_signature(**{**kwargs, "merchant_prepare_id": "7", "action": "1"})
    assert prepare != complete


def test_verify_click_signature_accepts_matching() -> None:
    sig = click_prepare_signature(
        click_trans_id="1",
        service_id="s",
        secret_key="k",
        merchant_trans_id="42",
        amount="1000",
        action="0",
        sign_time="t",
    )
    assert verify_click_signature(sig, sig) is True


def test_verify_click_signature_rejects_tampered() -> None:
    sig = click_prepare_signature(
        click_trans_id="1",
        service_id="s",
        secret_key="k",
        merchant_trans_id="42",
        amount="1000",
        action="0",
        sign_time="t",
    )
    tampered = click_prepare_signature(
        click_trans_id="1",
        service_id="s",
        secret_key="k",
        merchant_trans_id="42",
        amount="9999",  # amount o'zgartirilgan — imzo mos kelmasligi kerak
        action="0",
        sign_time="t",
    )
    assert verify_click_signature(tampered, sig) is False


def test_verify_click_signature_is_case_insensitive() -> None:
    sig = click_prepare_signature(
        click_trans_id="1",
        service_id="s",
        secret_key="k",
        merchant_trans_id="42",
        amount="1000",
        action="0",
        sign_time="t",
    )
    assert verify_click_signature(sig.upper(), sig) is True


def test_sum_to_tiyin_and_back() -> None:
    assert sum_to_tiyin(150000) == 15_000_000
    assert sum_to_tiyin("150000.50") == 15_000_050
    assert tiyin_to_sum(15_000_000) == 150000.0
