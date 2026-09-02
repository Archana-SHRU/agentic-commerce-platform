"""
SQLAlchemy models package.

All models are imported here so that:
1. `Base.metadata` is fully populated (needed for Alembic autogenerate and
   for any `Base.metadata.create_all()` bootstrap calls).
2. String-based relationship references (e.g. "Product") resolve correctly.
"""
from app.models.enums import OrderStatus, PaymentStatus  # noqa: F401
from app.models.merchant import Merchant  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.order_item import OrderItem  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401

__all__ = [
    "OrderStatus",
    "PaymentStatus",
    "Merchant",
    "Product",
    "Order",
    "OrderItem",
    "AuditLog",
]
