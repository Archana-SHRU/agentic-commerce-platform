"""Shared enum types used by SQLAlchemy models (and re-used by Pydantic schemas)."""
import enum


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    successful = "successful"
    failed = "failed"
    refunded = "refunded"
