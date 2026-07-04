import base64
import logging
from datetime import UTC, datetime

import httpx

from app.core.config import settings
from app.utils.phone import PhoneNumberError, normalize_kenyan_phone

logger = logging.getLogger(__name__)


class DarajaError(Exception):
    pass


def _base_url() -> str:
    if settings.mpesa_environment == "production":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def _format_phone_for_mpesa(phone_number: str) -> str:
    try:
        normalized = normalize_kenyan_phone(phone_number)
    except PhoneNumberError as exc:
        raise DarajaError(str(exc)) from exc
    return normalized.lstrip("+")


def _generate_password() -> tuple[str, str]:
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    data_to_encode = f"{settings.mpesa_shortcode}{settings.mpesa_passkey}{timestamp}"
    password = base64.b64encode(data_to_encode.encode()).decode()
    return password, timestamp


async def get_oauth_token() -> str:
    if not settings.mpesa_consumer_key or not settings.mpesa_consumer_secret:
        raise DarajaError(
            "Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET. "
            "Create an app at https://developer.safaricom.co.ke"
        )

    url = f"{_base_url()}/oauth/v1/generate"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            url,
            params={"grant_type": "client_credentials"},
            auth=(settings.mpesa_consumer_key, settings.mpesa_consumer_secret),
        )

    if response.status_code >= 400:
        raise DarajaError(f"Daraja OAuth failed: {response.text}")

    token = response.json().get("access_token")
    if not token:
        raise DarajaError("Daraja OAuth did not return an access token.")
    return token


async def initiate_stk_push_daraja(
    *,
    phone_number: str,
    amount: float,
    account_reference: str,
    transaction_desc: str,
) -> dict[str, str]:
    if not settings.mpesa_passkey:
        raise DarajaError("Missing MPESA_PASSKEY from the Safaricom developer portal.")
    if not settings.mpesa_callback_url:
        raise DarajaError(
            "Missing MPESA_CALLBACK_URL. Safaricom must reach a public HTTPS URL "
            "(use ngrok locally, e.g. https://abc123.ngrok.io/api/mpesa/stk-callback)."
        )

    token = await get_oauth_token()
    password, timestamp = _generate_password()
    party_a = _format_phone_for_mpesa(phone_number)
    amount_int = int(round(amount))

    payload = {
        "BusinessShortCode": settings.mpesa_shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount_int,
        "PartyA": party_a,
        "PartyB": settings.mpesa_shortcode,
        "PhoneNumber": party_a,
        "CallBackURL": settings.mpesa_callback_url,
        "AccountReference": account_reference[:12],
        "TransactionDesc": transaction_desc[:20],
    }

    url = f"{_base_url()}/mpesa/stkpush/v1/processrequest"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )

    data = response.json()
    if response.status_code >= 400 or data.get("errorCode"):
        raise DarajaError(data.get("errorMessage") or data.get("errorMessage") or response.text)

    checkout_request_id = data.get("CheckoutRequestID")
    merchant_request_id = data.get("MerchantRequestID")
    if not checkout_request_id:
        raise DarajaError(f"Unexpected Daraja STK response: {data}")

    logger.info(
        "Daraja STK initiated for %s amount=%s checkout=%s",
        party_a,
        amount_int,
        checkout_request_id,
    )
    return {
        "checkout_request_id": checkout_request_id,
        "merchant_request_id": merchant_request_id or "",
        "mode": "daraja",
    }
