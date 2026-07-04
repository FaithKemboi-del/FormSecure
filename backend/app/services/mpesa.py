import logging
import secrets
import uuid

from app.core.config import settings

logger = logging.getLogger(__name__)


async def initiate_stk_push(
    *,
    phone_number: str,
    amount: float,
    account_reference: str,
    transaction_desc: str,
) -> dict[str, str]:
    checkout_request_id = f"ws_CO_{uuid.uuid4().hex[:16]}"

    if settings.mpesa_mode == "stub":
        logger.info(
            "[MPESA STUB] STK Push to %s for KSh %s | ref=%s | %s",
            phone_number,
            amount,
            account_reference,
            transaction_desc,
        )
        print(f"[MPESA STUB] STK Push sent to {phone_number} for KSh {amount:.2f}")
        print(f"[MPESA STUB] CheckoutRequestID: {checkout_request_id}")
        print("[MPESA STUB] Enter PIN on phone (simulated in dev via confirm-payment endpoint)")
        return {
            "checkout_request_id": checkout_request_id,
            "merchant_request_id": f"mr_{secrets.token_hex(8)}",
            "mode": "stub",
        }

    raise NotImplementedError("Daraja M-Pesa integration is not configured yet. Set MPESA_MODE=stub.")


async def simulate_stk_success(*, checkout_request_id: str, phone_number: str) -> dict[str, str]:
    receipt = f"STB{secrets.token_hex(6).upper()[:10]}"
    logger.info(
        "[MPESA STUB] Payment confirmed for %s | checkout=%s | receipt=%s",
        phone_number,
        checkout_request_id,
        receipt,
    )
    print(f"[MPESA STUB] Payment confirmed. Receipt: {receipt}")
    return {
        "checkout_request_id": checkout_request_id,
        "mpesa_receipt_number": receipt,
        "registered_name": "STUB USER",
    }
