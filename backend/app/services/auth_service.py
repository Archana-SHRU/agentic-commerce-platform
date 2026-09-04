"""
Authentication business logic.

Passwords are hashed with bcrypt and only the hash is stored. Password reset
tokens are random, hashed at rest, time limited and single use.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User

logger = logging.getLogger("app.auth")


def normalise_email(email: str) -> str:
    return email.strip().lower()


# ---------------------------------------------------------------------------
# Lookups
# ---------------------------------------------------------------------------

def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == normalise_email(email))
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


# ---------------------------------------------------------------------------
# Registration / login
# ---------------------------------------------------------------------------

class EmailAlreadyRegisteredError(Exception):
    """Raised when a signup uses an email that already has an account."""


def create_user(db: Session, *, name: str, email: str, password: str) -> User:
    """
    Create a new user.

    Raises EmailAlreadyRegisteredError when the email is taken. The unique
    index on users.email is the real guard, so a concurrent duplicate signup
    also surfaces as EmailAlreadyRegisteredError rather than a 500.
    """
    clean_email = normalise_email(email)

    if get_user_by_email(db, clean_email) is not None:
        raise EmailAlreadyRegisteredError(clean_email)

    user = User(
        name=name.strip(),
        email=clean_email,
        password_hash=hash_password(password),
        is_active=True,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError(clean_email) from exc

    db.refresh(user)
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User | None:
    """
    Verify credentials.

    Returns None for unknown email, wrong password, or a deactivated account -
    the caller returns one generic error so the response does not disclose
    which of those it was.
    """
    user = get_user_by_email(db, email)

    if user is None:
        # Still run a hash comparison so response timing does not obviously
        # differ between "unknown email" and "wrong password".
        verify_password(password, hash_password("timing-equaliser"))
        return None

    if not verify_password(password, user.password_hash):
        return None

    if not user.is_active:
        return None

    return user


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

def create_password_reset_token(db: Session, user: User) -> str:
    """
    Issue a new reset token for the user and invalidate any outstanding ones.

    Returns the raw token - it is only ever placed in the reset email link.
    Only its SHA-256 hash is stored.
    """
    now = datetime.now(timezone.utc)

    # Invalidate previously issued, still-unused tokens for this user.
    outstanding = db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
    ).scalars().all()

    for token_row in outstanding:
        token_row.used_at = now

    raw_token = generate_reset_token()

    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(raw_token),
            expires_at=now
            + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
        )
    )
    db.commit()

    return raw_token


def build_reset_url(raw_token: str) -> str:
    base = settings.FRONTEND_URL.strip().rstrip("/")
    return f"{base}/reset-password?token={raw_token}"


def _find_usable_reset_token(db: Session, raw_token: str) -> PasswordResetToken | None:
    stmt = select(PasswordResetToken).where(
        PasswordResetToken.token_hash == hash_reset_token(raw_token)
    )
    token_row = db.execute(stmt).scalar_one_or_none()

    if token_row is None or token_row.used_at is not None:
        return None

    expires_at = token_row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= datetime.now(timezone.utc):
        return None

    return token_row


class InvalidResetTokenError(Exception):
    """Raised when a reset token is unknown, already used or expired."""


def reset_password(db: Session, *, raw_token: str, new_password: str) -> User:
    """
    Consume a reset token and set a new password.

    The token is marked used in the same transaction as the password update,
    so it cannot be replayed.
    """
    token_row = _find_usable_reset_token(db, raw_token)

    if token_row is None:
        raise InvalidResetTokenError()

    user = db.get(User, token_row.user_id)
    if user is None:
        raise InvalidResetTokenError()

    user.password_hash = hash_password(new_password)
    token_row.used_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(user)
    return user
