from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, Numeric, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OrderStatus, PaymentStatus


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    merchant_id: Mapped[int] = mapped_column(
        ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Nullable for now - no customer/auth system yet (see project scope for this step)
    customer_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"), nullable=False, default=OrderStatus.pending
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"), nullable=False, default=PaymentStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # --- Razorpay payment tracking ---------------------------------------
    # Populated by the payment flow. `payment_verified` is only ever set to
    # True after a successful server-side Razorpay signature check.
    razorpay_order_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    razorpay_payment_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    payment_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # Relationships
    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Order id={self.id} status={self.status}>"
