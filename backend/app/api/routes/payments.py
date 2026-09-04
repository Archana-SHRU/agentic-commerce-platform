"""
Payment routes.

  POST /api/payments/create-order   - create a Razorpay order
  POST /api/payments/verify         - verify a Razorpay payment signature

Security notes:
  * RAZORPAY_KEY_SECRET is used only inside app/services/payment_service.py and
    is never returned in any response.
  * /verify performs the HMAC signature check server-side. The frontend's
    claim about a payment is never trusted, and a failed check always results
    in `verified: false` plus an order marked as a failed payment.
"""
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.payment import (
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    RazorpayOrderCreate,
    RazorpayOrderResponse,
)
from app.services import audit_service, order_service, payment_service

logger = logging.getLogger("app.payments")

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)


def _build_receipt(payment_data: RazorpayOrderCreate) -> str:
    """Razorpay receipts are limited to 40 characters."""
    if payment_data.backendOrderId is not None:
        return f"order_{payment_data.backendOrderId}"[:40]
    return f"receipt_{payment_data.customer.email}"[:40]


@router.post(
    "/create-order",
    response_model=RazorpayOrderResponse,
)
def create_payment_order(
    payment_data: RazorpayOrderCreate,
    db: Session = Depends(get_db),
):
    """
    Create a Razorpay order for the given amount.

    Returns HTTP 503 with a clear message when Razorpay credentials are not
    configured. The frontend treats that as "demo mode" and never reports the
    resulting payment as verified.
    """
    notes: dict[str, str] = {}
    if payment_data.backendOrderId is not None:
        notes["backend_order_id"] = str(payment_data.backendOrderId)
    if payment_data.customer.email:
        notes["customer_email"] = str(payment_data.customer.email)

    razorpay_order = payment_service.create_razorpay_order(
        amount=payment_data.amount,
        currency=payment_data.currency,
        receipt=_build_receipt(payment_data),
        notes=notes or None,
    )

    if payment_data.backendOrderId is not None:
        # Record which Razorpay order this local order is attached to, and
        # move it into "processing". Payment is NOT verified at this point.
        order_service.attach_razorpay_order(
            db,
            order_id=payment_data.backendOrderId,
            razorpay_order_id=razorpay_order["id"],
        )

        try:
            audit_service.record_event(
                db,
                actor="system",
                action="payment_initiated",
                entity_type="order",
                entity_id=str(payment_data.backendOrderId),
                details={
                    "razorpay_order_id": razorpay_order["id"],
                    "amount": payment_data.amount,
                    "currency": razorpay_order["currency"],
                },
            )
        except Exception:  # audit failures must not break checkout
            logger.exception("Failed to record payment_initiated audit event")

    return razorpay_order


@router.post(
    "/verify",
    response_model=PaymentVerifyResponse,
)
def verify_payment(
    payment_data: PaymentVerifyRequest,
    db: Session = Depends(get_db),
):
    """
    Verify a Razorpay payment signature and record the outcome on the order.

    `verified` is True only when the server-side HMAC check succeeds.
    """
    verified = payment_service.verify_razorpay_payment(
        payment_id=payment_data.paymentId,
        order_id=payment_data.orderId,
        signature=payment_data.signature,
    )

    if payment_data.backendOrderId is not None:
        order_service.record_payment_result(
            db,
            order_id=payment_data.backendOrderId,
            razorpay_order_id=payment_data.orderId,
            razorpay_payment_id=payment_data.paymentId,
            verified=verified,
        )

        try:
            audit_service.record_event(
                db,
                actor="system",
                action="payment_successful" if verified else "payment_failed",
                entity_type="order",
                entity_id=str(payment_data.backendOrderId),
                details={
                    "razorpay_order_id": payment_data.orderId,
                    "razorpay_payment_id": payment_data.paymentId,
                    "signature_verified": verified,
                },
            )
        except Exception:
            logger.exception("Failed to record payment verification audit event")

    return PaymentVerifyResponse(
        verified=verified,
        message=(
            "Payment signature verified successfully"
            if verified
            else "Payment signature verification failed"
        ),
        orderId=payment_data.orderId,
        paymentId=payment_data.paymentId,
        backendOrderId=payment_data.backendOrderId,
    )
