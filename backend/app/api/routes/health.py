from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Basic liveness + DB connectivity check."""
    db_status = "connected"
    db_error: str | None = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 - reported, not raised
        db_status = "disconnected"
        db_error = str(exc).splitlines()[0][:300] if str(exc) else "unknown error"

    payload: dict = {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": db_status,
    }

    # Diagnostics are only exposed in DEBUG mode. The target string never
    # contains the password, but the username/host are still withheld in
    # production to avoid unnecessary disclosure.
    if settings.DEBUG:
        payload["database_target"] = settings.database_target
        payload["env_files_loaded"] = settings.env_files_loaded
        if db_error:
            payload["database_error"] = db_error

    return payload
