"""
Payment schemas.

Field names intentionally mirror what `frontend/src/services/paymentService.ts`
already sends/expects (camelCase for the verify payload, `id`/`amount` for the
created order), so the existing frontend needs no protocol change.
"""
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PaymentCustomer(BaseModel):
    name: str = Field(default="", max_length=255)
    email: EmailStr
    phone: str = Field(default="", max_length=32)


class PaymentCartItemProduct(BaseModel):
    """Loose mirror of the frontend Product shape - only what we need."""

    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    price: float | None = None


class PaymentCartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    productId: str | None = None
    quantity: int = 1
    product: PaymentCartItemProduct | None = None


class RazorpayOrderCreate(BaseModel):
    """Payload sent by the frontend to open a Razorpay checkout."""

    model_config = ConfigDict(extra="ignore")

    amount: float = Field(gt=0, description="Amount in major units (e.g. rupees)")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    items: list[PaymentCartItem] = Field(default_factory=list)
    customer: PaymentCustomer
    # Optional link back to the order row created via POST /api/orders
    backendOrderId: int | None = None


class RazorpayOrderResponse(BaseModel):
    """Subset of the Razorpay order object the frontend consumes."""

    id: str
    amount: int = Field(description="Amount in the smallest currency unit (paise)")
    currency: str
    status: str | None = None
    receipt: str | None = None
    key_id: str | None = Field(
        default=None,
        description="Public Razorpay key id. The secret is never returned.",
    )


class PaymentVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    paymentId: str = Field(min_length=1, max_length=100)
    orderId: str = Field(min_length=1, max_length=100)
    signature: str | None = Field(default=None, max_length=256)
    backendOrderId: int | None = None


class PaymentVerifyResponse(BaseModel):
    verified: bool
    message: str
    orderId: str | None = None
    paymentId: str | None = None
    backendOrderId: int | None = None
