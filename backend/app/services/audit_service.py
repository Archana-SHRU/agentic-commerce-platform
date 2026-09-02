from typing import Any

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def list_audit_logs(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 50,
    actor: str | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> tuple[list[AuditLog], int]:
    stmt = select(AuditLog)
    count_stmt = select(func.count()).select_from(AuditLog)

    if actor:
        stmt = stmt.where(AuditLog.actor == actor)
        count_stmt = count_stmt.where(AuditLog.actor == actor)
    if action:
        stmt = stmt.where(AuditLog.action == action)
        count_stmt = count_stmt.where(AuditLog.action == action)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
        count_stmt = count_stmt.where(AuditLog.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(AuditLog.entity_id == entity_id)
        count_stmt = count_stmt.where(AuditLog.entity_id == entity_id)

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def record_event(
    db: Session,
    *,
    actor: str,
    action: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    """
    Helper for writing an audit event.

    Not wired into any endpoint yet - this step only builds the storage/API
    surface for audit logs. The AI agent / order / payment workflow built in
    a later step will call this to record events such as
    'product_search_performed', 'order_created', 'payment_successful', etc.
    """
    entry = AuditLog(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
