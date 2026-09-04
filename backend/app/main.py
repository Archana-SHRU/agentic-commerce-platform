import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.api.routes import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
)

logger = logging.getLogger("app")

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-quality AI-powered agentic commerce platform",
    version=settings.APP_VERSION,
)

# Configure CORS so the React frontend (dev server or deployed domain) can
# call this API. Origins come from the CORS_ORIGINS env var as a
# comma-separated list, e.g.
#   CORS_ORIGINS=https://shop.example.com,https://www.shop.example.com
_cors_origins = settings.CORS_ORIGINS

# Browsers reject "Access-Control-Allow-Origin: *" together with credentials,
# so a wildcard configuration must disable credentialed CORS to stay valid.
_allow_credentials = "*" not in _cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All backend-foundation endpoints live under /api (e.g. /api/health, /api/products)
app.include_router(api_router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a clean 422 with field-level details, without leaking internals.

    `exc.errors()` can contain non-JSON-serializable objects in its `ctx`
    (Pydantic v2 puts the raised ValueError there for custom validators), so
    the payload is normalised with jsonable_encoder before being returned.
    Without this, any custom-validator failure would surface as a 500.
    """
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Report database failures as 503 with an actionable message.

    These used to fall through to the catch-all below and surface as
    {"detail": "Internal server error"}, which hid the real cause (bad
    credentials, database not running, migrations never applied). The
    response still contains no credentials or stack traces.
    """
    logger.exception(
        "Database error while processing %s %s (target: %s)",
        request.method,
        request.url,
        settings.database_target,
    )
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Database unavailable. Check that PostgreSQL is running, that "
                "DATABASE_URL in backend/.env is correct, and that migrations "
                "have been applied (alembic upgrade head)."
            )
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Never leak stack traces / internals to API clients."""
    logger.exception("Unhandled error while processing %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.on_event("startup")
def _log_configuration() -> None:
    """Surface the effective configuration and verify DB connectivity.

    Printed at boot so a misconfiguration is obvious immediately instead of
    only when the first request fails. The password is never logged.
    """
    from app.db.base import engine

    loaded = settings.env_files_loaded
    logger.info("%s v%s starting", settings.APP_NAME, settings.APP_VERSION)
    logger.info(
        ".env loaded from: %s",
        ", ".join(loaded) if loaded else "(none found - using environment only)",
    )
    logger.info("Database target: %s", settings.database_target)
    logger.info("CORS origins: %s", ", ".join(settings.CORS_ORIGINS) or "(none)")

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection: OK")
    except Exception as exc:  # noqa: BLE001 - startup diagnostics only
        logger.error("Database connection FAILED: %s", exc)
        logger.error(
            "The API will return 503 for database-backed routes until this is "
            "resolved. Verify DATABASE_URL and that PostgreSQL is reachable."
        )


@app.get("/health")
async def health_check():
    """Kept for backward compatibility - canonical health check is /api/health."""
    return {"status": "healthy", "service": settings.APP_NAME}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": "/api",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
