from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.security import decode_access_token
from app.db.base import get_db  # noqa: F401  (re-exported for convenience)
from app.models.user import User
from app.services import auth_service

SkipParam = Annotated[int, Query(ge=0, description="Number of items to skip")]

LimitParam = Annotated[
    int, Query(ge=1, le=100, description="Max number of items to return")
]


# `auto_error=False` so we can raise a consistent 401 ourselves rather than
# letting FastAPI emit a 403 for a missing Authorization header.
bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the Bearer access token."""
    if credentials is None or not credentials.credentials:
        raise _CREDENTIALS_EXCEPTION

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise _CREDENTIALS_EXCEPTION

    subject = payload.get("sub")
    if subject is None:
        raise _CREDENTIALS_EXCEPTION

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise _CREDENTIALS_EXCEPTION

    user = auth_service.get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise _CREDENTIALS_EXCEPTION

    return user


def get_current_user_optional(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
    db: Session = Depends(get_db),
) -> User | None:
    """Like get_current_user, but returns None instead of raising."""
    if credentials is None or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        return None

    subject = payload.get("sub")

    try:
        user_id = int(subject) if subject is not None else None
    except (TypeError, ValueError):
        return None

    if user_id is None:
        return None

    user = auth_service.get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        return None

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[User | None, Depends(get_current_user_optional)]

# ------------------------------------------------------------
# Merchant authentication
# ------------------------------------------------------------

from app.models.merchant import Merchant


def get_current_merchant(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
    db: Session = Depends(get_db),
) -> Merchant:
    """Resolve an authenticated merchant from a merchant JWT token."""

    if credentials is None or not credentials.credentials:
        raise _CREDENTIALS_EXCEPTION

    payload = decode_access_token(credentials.credentials)

    if payload is None or payload.get("role") != "merchant":
        raise _CREDENTIALS_EXCEPTION

    subject = payload.get("sub")

    try:
        merchant_id = int(subject)
    except (TypeError, ValueError):
        raise _CREDENTIALS_EXCEPTION

    merchant = db.get(Merchant, merchant_id)

    if merchant is None or not merchant.is_active:
        raise _CREDENTIALS_EXCEPTION

    return merchant


CurrentMerchant = Annotated[Merchant, Depends(get_current_merchant)]
