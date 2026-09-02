from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor: str
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    details: dict[str, Any] | None = None
    created_at: datetime
