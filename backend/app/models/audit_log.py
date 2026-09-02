from datetime import datetime

from sqlalchemy import String, Integer, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    """
    Generic, append-only audit trail.

    This step only creates the storage/API surface. The actual events this
    table is designed to hold (customer_request_received, product_search_performed,
    product_recommended, upsell_suggested, customer_approval_received,
    order_created, payment_initiated, payment_successful, ...) will be written
    by the AI agent / payment workflow implemented in a later step.
    """

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Who/what performed the action, e.g. "customer", "ai_agent", "merchant", "system"
    actor: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # What happened, e.g. "product_search_performed", "order_created"
    action: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    # What kind of entity the action relates to, e.g. "product", "order", "merchant"
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    # The id of that entity (kept as string so it can reference any entity type)
    entity_id: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    # Free-form structured context about the event
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AuditLog id={self.id} action={self.action!r}>"
