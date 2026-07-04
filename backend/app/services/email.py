import logging
import re

logger = logging.getLogger(__name__)

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EmailError(ValueError):
    pass


def normalize_email(raw: str) -> str:
    email = raw.strip().lower()
    if not EMAIL_PATTERN.match(email):
        raise EmailError("Invalid email address.")
    return email


async def send_email(to_address: str, subject: str, body: str) -> None:
    """Stub email provider — swap for SendGrid, Resend, AWS SES, etc."""
    logger.info("[EMAIL STUB] To: %s | Subject: %s", to_address, subject)
    logger.info("[EMAIL STUB] Body: %s", body)
    print(f"[EMAIL STUB] To: {to_address}")
    print(f"[EMAIL STUB] Subject: {subject}")
    print(f"[EMAIL STUB] {body}")
