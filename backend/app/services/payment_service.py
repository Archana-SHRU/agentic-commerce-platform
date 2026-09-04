"""
Razorpay payment service.

Responsibilities:
  * create real Razorpay orders through the official server SDK
  * verify payment signatures server-side using RAZORPAY_KEY_SECRET

Hard rules enforced here:
  * RAZORPAY_KEY_SECRET never leaves the backend.
  * A payment is only ever reported as verified when the HMAC signature check
    over "<razorpay_order_id>|<razorpay_payment_id>" succeeds. There is no
    code path that fakes a verified payment, and the frontend's claim is never
    trusted.
  * When credentials are absent the service raises a clear configuration
    error (HTTP 503). The existing frontend already treats a failed
    create-order call as "demo mode, unverified", which keeps the honest
    fallback intact.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("app.payments")

try:  # pragma: no cover - import guard only
    import razorpay
except ImportError:  # pragma: no cover
    razorpay = None  # type: ignore[assignment]


class PaymentConfigurationError(HTTPException):
    """Raised when Razorpay credentials or the SDK are unavailable."""

    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
        )


def to_smallest_unit(amount: float | Decimal) -> int:
    """
    Convert a major-unit amount (rupees) to the smallest unit (paise).

    Uses Decimal so 199.99 -> 19999 rather than 19998.
    """
    quantised = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int((quantised * 100).to_integral_value(rounding=ROUND_HALF_UP))


def _require_client():
    if not settings.razorpay_configured:
        raise PaymentConfigurationError(
            "Razorpay is not configured on the server. Set RAZORPAY_KEY_ID and "
            "RAZORPAY_KEY_SECRET in the backend environment to enable live "
            "payments."
        )

    if razorpay is None:
        raise PaymentConfigurationError(
            "The razorpay package is not installed on the server. Install the "
            "backend requirements to enable live payments."
        )

    client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID.strip(), settings.RAZORPAY_KEY_SECRET.strip())
    )
    client.set_app_details({"title": settings.APP_NAME, "version": settings.APP_VERSION})
    return client


def create_razorpay_order(
    amount: float | Decimal,
    currency: str = "INR",
    receipt: str | None = None,
    notes: dict[str, str] | None = None,
) -> dict:
    """
    Create a Razorpay order and return the fields the frontend needs.

    Raises PaymentConfigurationError (503) when credentials are missing, and
    HTTP 502 when Razorpay itself rejects/fails the request.
    """
    client = _require_client()

    payload: dict = {
        "amount": to_smallest_unit(amount),
        "currency": (currency or "INR").upper(),
        "payment_capture": 1,
    }

    if receipt:
        payload["receipt"] = receipt[:40]
    if notes:
        payload["notes"] = notes

    try:
        order = client.order.create(data=payload)
    except Exception as exc:  # razorpay raises several distinct error types
        logger.error("Razorpay order creation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to create the payment order with Razorpay.",
        ) from exc

    return {
        "id": order["id"],
        "amount": order["amount"],
        "currency": order.get("currency", payload["currency"]),
        "status": order.get("status"),
        "receipt": order.get("receipt"),
        # Public key id only - the secret is never returned to any client.
        "key_id": settings.RAZORPAY_KEY_ID.strip(),
    }


def verify_razorpay_payment(
    payment_id: str,
    order_id: str,
    signature: str | None,
) -> bool:
    """
    Verify a Razorpay payment signature server-side.

    Returns True only when the HMAC-SHA256 of "<order_id>|<payment_id>" keyed
    with RAZORPAY_KEY_SECRET matches the signature supplied by Razorpay
    Checkout. Any missing input, configuration gap or mismatch returns False.
    """
    if not signature or not payment_id or not order_id:
        logger.info("Payment verification rejected: missing payment/order/signature")
        return False

    if not settings.razorpay_configured:
        # Cannot verify without the secret - report unverified, never verified.
        logger.warning(
            "Payment verification attempted while Razorpay is not configured"
        )
        return False

    expected = hmac.new(
        key=settings.RAZORPAY_KEY_SECRET.strip().encode("utf-8"),
        msg=f"{order_id}|{payment_id}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    verified = hmac.compare_digest(expected, signature.strip())

    if not verified:
        logger.warning(
            "Payment signature mismatch for razorpay_order_id=%s", order_id
        )

    return verified
