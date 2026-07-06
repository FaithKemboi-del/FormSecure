import logging

from fastapi import APIRouter, Request

from app.core.database import AsyncSessionLocal
from app.services.escrow import mark_escrow_paid_from_mpesa

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mpesa", tags=["mpesa"])


@router.post("/stk-callback")
async def stk_callback(request: Request) -> dict[str, str]:
    """Safaricom Daraja STK Push result callback. Must be a public HTTPS URL."""
    payload = await request.json()
    logger.info("Daraja STK callback received: %s", payload)

    body = payload.get("Body", {}).get("stkCallback", {})
    result_code = body.get("ResultCode")
    checkout_request_id = body.get("CheckoutRequestID")
    result_desc = body.get("ResultDesc", "")

    if result_code != 0:
        logger.warning(
            "STK payment failed checkout=%s code=%s desc=%s",
            checkout_request_id,
            result_code,
            result_desc,
        )
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    metadata_items = body.get("CallbackMetadata", {}).get("Item", [])
    metadata = {item.get("Name"): item.get("Value") for item in metadata_items if item.get("Name")}
    receipt = str(metadata.get("MpesaReceiptNumber", ""))
    payer_name = metadata.get("Name") or metadata.get("FirstName")

    if checkout_request_id and receipt:
        async with AsyncSessionLocal() as session:
            try:
                transaction = await mark_escrow_paid_from_mpesa(
                    session,
                    checkout_request_id=checkout_request_id,
                    mpesa_receipt_number=receipt,
                    payer_name=str(payer_name) if payer_name else None,
                )
                await session.commit()
                if transaction:
                    logger.info(
                        "Escrow funded via Daraja checkout=%s receipt=%s transfer_code=%s",
                        checkout_request_id,
                        receipt,
                        transaction.transfer_code,
                    )
            except Exception:
                logger.exception("Failed to process STK callback")
                await session.rollback()

    return {"ResultCode": 0, "ResultDesc": "Accepted"}
