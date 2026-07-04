import hashlib
import hmac
import logging
import secrets

from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_otp_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(phone_number: str, code: str) -> str:
    message = f"{phone_number}:{code}".encode()
    key = settings.otp_hmac_secret.encode()
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def verify_otp_hash(phone_number: str, code: str, code_hash: str) -> bool:
    expected = hash_otp(phone_number, code)
    return hmac.compare_digest(expected, code_hash)


async def send_otp_sms(phone_number: str, code: str) -> None:
    """Stub SMS provider — swap for Africa's Talking, Twilio, etc."""
    logger.info(
        "[SMS STUB] OTP for %s: %s (valid for %s minutes)",
        phone_number,
        code,
        settings.otp_expire_minutes,
    )
    print(f"[SMS STUB] OTP for {phone_number}: {code}")
