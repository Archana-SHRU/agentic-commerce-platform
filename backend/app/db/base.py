import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import require_database_url, settings

logger = logging.getLogger("app.db")

# require_database_url() raises a clear, actionable error when DATABASE_URL is
# missing, instead of letting the app boot and fail later inside every request
# with an opaque "Internal server error".
DATABASE_URL = require_database_url()

# Logged without the password so the effective target is visible at startup.
logger.info("Database target: %s", settings.database_target)

_engine_kwargs: dict = {
    "echo": settings.DATABASE_ECHO,
    # Recycle dead connections instead of handing a broken one to a request.
    # Important behind managed Postgres / PgBouncer, which drop idle sockets.
    "pool_pre_ping": True,
}

# SQLite (used by some local/dev setups) needs a different connect arg set and
# does not support these pool options.
if DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs["pool_recycle"] = 1800

engine = create_engine(DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
