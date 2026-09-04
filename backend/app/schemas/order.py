from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderStatus, PaymentStatus


# =========================
# ORDER ITEM CREATE
# =========================

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


# =========================
# ORDER CREATE
# =========================

class OrderCreate(BaseModel):
    customer_id: str | None = None
    items: list[OrderItemCreate] = Field(
        min_length=1
    )


# =========================
# ORDER ITEM RESPONSE
# =========================

class OrderItemOut(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    order_id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    unit_price: Decimal


# =========================
# ORDER RESPONSE
# =========================

class OrderOut(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    merchant_id: int
    customer_id: str | None = None
    total_amount: Decimal
    status: OrderStatus
    payment_status: PaymentStatus
    created_at: datetime

    # Razorpay payment tracking. `payment_verified` is True only when the
    # backend successfully verified the Razorpay signature.
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    payment_verified: bool = False

    items: list[OrderItemOut] = []


# =========================
# PAGINATED ORDER RESPONSE
# =========================

class PaginatedOrders(BaseModel):
    total: int
    skip: int
    limit: int
    items: list[OrderOut]