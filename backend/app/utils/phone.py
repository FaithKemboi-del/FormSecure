import re

KENYAN_MOBILE_PATTERN = re.compile(r"^\+254[17]\d{8}$")


class PhoneNumberError(ValueError):
    pass


def normalize_kenyan_phone(raw: str) -> str:
    """Normalize Kenyan mobile numbers to E.164 +254 format."""
    cleaned = re.sub(r"[\s\-()]", "", raw.strip())

    if cleaned.startswith("+"):
        digits = "+" + re.sub(r"\D", "", cleaned[1:])
    else:
        digits_only = re.sub(r"\D", "", cleaned)
        if digits_only.startswith("254"):
            digits = f"+{digits_only}"
        elif digits_only.startswith("0") and len(digits_only) == 10:
            digits = f"+254{digits_only[1:]}"
        elif digits_only.startswith("7") or digits_only.startswith("1"):
            digits = f"+254{digits_only}"
        else:
            digits = f"+{digits_only}" if digits_only else cleaned

    if not KENYAN_MOBILE_PATTERN.match(digits):
        raise PhoneNumberError(
            "Invalid Kenyan phone number. Use +254 followed by 9 digits (e.g. +254712345678)."
        )

    return digits


def mask_phone(phone: str) -> str:
    if len(phone) < 8:
        return phone
    return f"{phone[:5]}•••{phone[-3:]}"
