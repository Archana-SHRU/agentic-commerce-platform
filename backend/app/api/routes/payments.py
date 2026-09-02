from fastapi import APIRouter

from app.schemas.payment import (
    RazorpayOrderCreate,
    RazorpayOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
)

from app.services import payment_service


router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)


@router.post(
    "/create-order",
    response_model=RazorpayOrderResponse,
)
def create_payment_order(
    payment_data: RazorpayOrderCreate,
):
    receipt = f"receipt_{payment_data.customer.email}"

    return payment_service.create_razorpay_order(
        amount=payment_data.amount,
        currency=payment_data.currency,
        receipt=receipt[:40],
    )


@router.post(
    "/verify",
    response_model=PaymentVerifyResponse,
)
def verify_payment(
    payment_data: PaymentVerifyRequest,
):
    verified = payment_service.verify_razorpay_payment(
        payment_id=payment_data.paymentId,
        order_id=payment_data.orderId,
        signature=payment_data.signature,
    )

    return {
        "verified": verified,
        "message": (
            "Payment verified successfully"
            if verified
            else "Payment verification failed"
        ),
    }