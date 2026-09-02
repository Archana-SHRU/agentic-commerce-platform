from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, SkipParam, LimitParam
from app.schemas.audit_log import AuditLogOut
from app.schemas.common import PaginatedResponse
from app.services import audit_service

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=PaginatedResponse[AuditLogOut])
def list_audit_logs(
    skip: SkipParam = 0,
    limit: LimitParam = 50,
    actor: str | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    db: Session = Depends(get_db),
):
    items, total = audit_service.list_audit_logs(
        db,
        skip=skip,
        limit=limit,
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    return PaginatedResponse(total=total, skip=skip, limit=limit, items=items)
