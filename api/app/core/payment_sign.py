"""To'lov provayder imzolarini tekshirish — sof funksiyalar, DB/tarmoqsiz testlanadi.

Click MD5 imzo formulasi rasmiy hujjatga mos:
  Prepare:  MD5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
                + amount + action + sign_time)
  Complete: MD5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
                + merchant_prepare_id + amount + action + sign_time)
"""

import base64
import hashlib
import hmac
from urllib.parse import urlencode


def click_prepare_signature(
    *,
    click_trans_id: str,
    service_id: str,
    secret_key: str,
    merchant_trans_id: str,
    amount: str,
    action: str,
    sign_time: str,
) -> str:
    raw = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{amount}{action}{sign_time}"
    return hashlib.md5(raw.encode()).hexdigest()


def click_complete_signature(
    *,
    click_trans_id: str,
    service_id: str,
    secret_key: str,
    merchant_trans_id: str,
    merchant_prepare_id: str,
    amount: str,
    action: str,
    sign_time: str,
) -> str:
    raw = (
        f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}"
        f"{merchant_prepare_id}{amount}{action}{sign_time}"
    )
    return hashlib.md5(raw.encode()).hexdigest()


def verify_click_signature(received_sign: str, computed_sign: str) -> bool:
    """Vaqt-hujumidan himoyalangan solishtirish (timing attack)."""
    return hmac.compare_digest(received_sign.lower(), computed_sign.lower())


def sum_to_tiyin(sum_amount: float | str) -> int:
    """Click so'mda (kasr bilan) yuboradi — tiyinga aylantiradi (Payme bilan bir xil birlik)."""
    return round(float(sum_amount) * 100)


def tiyin_to_sum(tiyin: int) -> float:
    return tiyin / 100


def build_payme_checkout_url(
    *,
    merchant_id: str,
    account_key: str,
    account_value: int | str,
    amount_sum: int,
    base_url: str = "https://checkout.paycom.uz",
) -> str:
    """Payme checkout havolasi — parametrlar base64'da kodlanadi (rasmiy format).

    `account_key` — Payme "account" obyektidagi maydon nomi (masalan
    "order_id" buyurtma, "donation_id" xayriya uchun) — webhook shu nom
    orqali qaysi turdagi to'lov ekanini aniqlaydi (app/modules/payments/payme.py).
    """
    amount_tiyin = amount_sum * 100
    raw = f"m={merchant_id};ac.{account_key}={account_value};a={amount_tiyin}"
    encoded = base64.b64encode(raw.encode()).decode()
    return f"{base_url}/{encoded}"


def build_click_checkout_url(
    *,
    service_id: str,
    merchant_id: str,
    transaction_param: str,
    amount_sum: int,
    return_url: str,
    base_url: str = "https://my.click.uz/services/pay",
) -> str:
    """`transaction_param` — Click bizga `merchant_trans_id` sifatida qaytaradi.

    Buyurtma uchun oddiy raqam (`str(order.id)`), xayriya uchun `d` prefiksi
    bilan (`f"d{donation.id}"`) — webhook shu prefiks orqali turini aniqlaydi
    (app/modules/payments/click.py).
    """
    params = {
        "service_id": service_id,
        "merchant_id": merchant_id,
        "amount": amount_sum,
        "transaction_param": transaction_param,
        "return_url": return_url,
    }
    return f"{base_url}?{urlencode(params)}"
