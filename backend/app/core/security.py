"""
Security primitives: password hashing, JWT access tokens and password-reset
tokens.

All secrets are read from application settings (which read from environment
variables / .env). Nothing here is ever hardcoded.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

# bcrypt only considers the first 72 bytes of the input.
_BCRYPT_MAX_BYTES = 72


class SecurityConfigError(RuntimeError):
    """Raised when a security-critical setting is missing."""


# ---------------------------------------------------------------------------
# Passwords
# ---------------------------------------------------------------------------

def _password_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (random per-password salt)."""
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Constant-time verification of a plaintext password against its hash."""
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(_password_bytes(password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        # Malformed / legacy hash - treat as a failed login, never as success.
        return False


# ---------------------------------------------------------------------------
# JWT access tokens
# ---------------------------------------------------------------------------

def _require_secret_key() -> str:
    secret = (settings.SECRET_KEY or "").strip()
    if not secret:
        raise SecurityConfigError(
            "SECRET_KEY is not configured. Set SECRET_KEY in the backend "
            "environment before using authentication."
        )
    return secret


def create_access_token(
    subject: str | int,
    expires_minutes: int | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed JWT access token for the given subject (user id)."""
    secret = _require_secret_key()

    expire_minutes = (
        expires_minutes
        if expires_minutes is not None
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expire_minutes)).timestamp()),
        "type": "access",
    }

    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, secret, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode/validate a JWT access token. Returns None when invalid."""
    try:
        secret = _require_secret_key()
    except SecurityConfigError:
        return None

    try:
        payload = jwt.decode(token, secret, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None

    if payload.get("type") != "access":
        return None

    return payload


# ---------------------------------------------------------------------------
# Password reset tokens
# ---------------------------------------------------------------------------

def generate_reset_token() -> str:
    """Create a cryptographically secure, URL-safe reset token."""
    return secrets.token_urlsafe(48)


def hash_reset_token(token: str) -> str:
    """
    Hash a reset token for storage.

    Only the hash is persisted, so a database leak does not hand out usable
    reset links.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def reset_tokens_match(token: str, token_hash: str) -> bool:
    return hmac.compare_digest(hash_reset_token(token), token_hash)
