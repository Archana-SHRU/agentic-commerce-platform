"""Application settings.

Environment loading is deliberately made independent of the current working
directory. Previously ``env_file=".env"`` was resolved relative to wherever
uvicorn happened to be launched from, so starting the server from the repo
root silently skipped ``backend/.env`` and fell back to a hardcoded
placeholder DATABASE_URL. That produced the classic
``password authentication failed for user "user"`` error even though a
correct .env existed. Paths are now anchored to this file's location.
"""

from pathlib import Path
from typing import List, Optional

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

# ---------------------------------------------------------------------------
# Absolute, CWD-independent .env discovery
# ---------------------------------------------------------------------------
# This file lives at: <backend>/app/core/config.py
#   parents[0] = app/core   parents[1] = app   parents[2] = backend
BACKEND_DIR: Path = Path(__file__).resolve().parents[2]
PROJECT_ROOT: Path = BACKEND_DIR.parent

# Later files win in pydantic-settings, so the most specific location
# (backend/.env) is listed last and overrides a repo-root .env.
ENV_FILE_CANDIDATES: tuple[Path, ...] = (
    PROJECT_ROOT / ".env",
    BACKEND_DIR / ".env",
)

# Optional explicit override, useful in containers: ENV_FILE=/run/secrets/app.env
import os as _os

_explicit_env_file = _os.environ.get("ENV_FILE", "").strip()
if _explicit_env_file:
    ENV_FILE_CANDIDATES = (Path(_explicit_env_file).expanduser().resolve(),)

LOADED_ENV_FILES: list[str] = [str(p) for p in ENV_FILE_CANDIDATES if p.is_file()]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=tuple(str(p) for p in ENV_FILE_CANDIDATES),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    DEBUG: bool = True
    APP_NAME: str = "RazorCart AI"
    APP_VERSION: str = "0.1.0"

    # No credentialed default on purpose. An unset DATABASE_URL must fail
    # loudly with an actionable message rather than silently attempting to
    # connect as a placeholder user.
    DATABASE_URL: str = ""
    DATABASE_ECHO: bool = False

    # Stored as a raw string so a comma-separated env value works. Declaring
    # this as List[str] made pydantic-settings attempt json.loads() on the
    # env var, so "https://a.com,https://b.com" raised SettingsError at
    # startup. Read the parsed list via the CORS_ORIGINS property below.
    CORS_ORIGINS_RAW: str = Field(
        default=(
            "http://localhost:3000,"
            "http://localhost:5173,"
            "http://127.0.0.1:3000,"
            "http://127.0.0.1:5173"
        ),
        validation_alias=AliasChoices("CORS_ORIGINS", "CORS_ORIGINS_RAW"),
    )

    API_PREFIX: str = "/api"
    API_V1_PREFIX: str = "/api/v1"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    # --- Authentication / JWT -------------------------------------------
    # SECRET_KEY MUST be supplied via the environment. There is deliberately
    # no usable default: authentication endpoints fail loudly if it is unset
    # rather than silently signing tokens with a known key.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Password reset token lifetime (minutes)
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # --- SMTP / Email ----------------------------------------------------
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "RazorCart AI"
    SMTP_USE_TLS: bool = True

    # ------------------------------------------------------------------
    # Validation / normalisation
    # ------------------------------------------------------------------
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _normalise_database_url(cls, value: Optional[str]) -> str:
        """Clean up and sanity-check DATABASE_URL without altering credentials."""
        if value is None:
            return ""

        url = str(value).strip()

        # Strip accidental surrounding quotes, e.g. DATABASE_URL="postgres://..."
        if len(url) >= 2 and url[0] == url[-1] and url[0] in ("'", '"'):
            url = url[1:-1].strip()

        if not url:
            return ""

        # Managed hosts (Render/Heroku/Railway) hand out postgres:// URLs,
        # which SQLAlchemy 2.x no longer recognises as a dialect.
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://") :]

        # Catch the missing "/" before the database name, i.e.
        # ...@localhost:5432razorcart_ai -> ...@localhost:5432/razorcart_ai
        # A port is digits only, so digits followed directly by a letter is
        # unambiguously this typo. Report it instead of guessing a rewrite.
        import re as _re

        bad_port = _re.search(r":(\d+)([A-Za-z][\w.\-]*)(\?|$)", url)
        if bad_port:
            port, dbname = bad_port.group(1), bad_port.group(2)
            raise ValueError(
                f"DATABASE_URL is missing the '/' before the database name: "
                f"found ':{port}{dbname}' but expected ':{port}/{dbname}'. "
                "Fix this in your .env file."
            )

        # Validate the shape early so failures name the real problem rather
        # than surfacing later as an opaque 500 from an API route.
        try:
            make_url(url)
        except Exception as exc:
            raise ValueError(
                f"DATABASE_URL could not be parsed ({exc}). Expected format: "
                "postgresql://<user>:<password>@<host>:<port>/<database>. "
                "If your password contains @ : / ? # or %, percent-encode it "
                "(@ becomes %40, for example)."
            ) from exc

        return url

    # ------------------------------------------------------------------
    # Derived values
    # ------------------------------------------------------------------
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Allowed browser origins, parsed from a comma-separated env value.

        Also accepts a JSON array for backwards compatibility, and "*" to
        allow any origin.
        """
        raw = (self.CORS_ORIGINS_RAW or "").strip()
        if not raw:
            return []

        if raw.startswith("["):
            import json

            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(o).strip().rstrip("/") for o in parsed if str(o).strip()]
            except ValueError:
                pass

        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

    @property
    def database_target(self) -> str:
        """Human-readable connection target with the password redacted.

        Safe to log: never includes the password.
        """
        if not self.DATABASE_URL:
            return "<unset>"
        try:
            u = make_url(self.DATABASE_URL)
        except Exception:
            return "<unparseable>"
        host = u.host or "-"
        port = f":{u.port}" if u.port else ""
        return f"{u.drivername}://{u.username or '-'}@{host}{port}/{u.database or '-'}"

    @property
    def env_files_loaded(self) -> List[str]:
        """Which .env files were actually found and read."""
        return list(LOADED_ENV_FILES)

    @property
    def env_files_searched(self) -> List[str]:
        return [str(p) for p in ENV_FILE_CANDIDATES]

    @property
    def razorpay_configured(self) -> bool:
        return bool(self.RAZORPAY_KEY_ID.strip() and self.RAZORPAY_KEY_SECRET.strip())

    @property
    def smtp_configured(self) -> bool:
        """SMTP is only usable when host and a from-address are present."""
        return bool(self.SMTP_HOST.strip() and self.SMTP_FROM_EMAIL.strip())


settings = Settings()


def require_database_url() -> str:
    """Return DATABASE_URL or raise an actionable configuration error."""
    if settings.DATABASE_URL:
        return settings.DATABASE_URL

    searched = "\n  ".join(settings.env_files_searched)
    found = settings.env_files_loaded
    found_msg = ("\n  ".join(found)) if found else "(none found)"

    raise RuntimeError(
        "DATABASE_URL is not set, so the database cannot be reached.\n"
        f".env files searched:\n  {searched}\n"
        f".env files loaded:\n  {found_msg}\n"
        "Create one of the searched files with a line such as:\n"
        "  DATABASE_URL=postgresql://<user>:<password>@localhost:5432/razorcart_ai\n"
        "Percent-encode special characters in the password (@ -> %40)."
    )
