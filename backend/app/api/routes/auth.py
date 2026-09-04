"""
Authentication routes.

  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me
  POST /api/auth/forgot-password
  POST /api/auth/reset-password
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.core.config import settings
from app.core.security import SecurityConfigError, create_access_token
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)
from app.services import auth_service, email_service

logger = logging.getLogger("app.auth")

router = APIRouter(prefix="/auth", tags=["auth"])

# Deliberately identical for "no such email" and "wrong password" so the API
# does not disclose which accounts exist.
INVALID_CREDENTIALS_DETAIL = "Invalid email or password"

# Always returned by forgot-password, whether or not the account exists.
FORGOT_PASSWORD_MESSAGE = (
    "If an account exists for this email, a password reset link has been sent."
)


def _issue_token(user) -> TokenResponse:
    try:
        token = create_access_token(subject=user.id)
    except SecurityConfigError as exc:
        logger.error("Cannot issue access token: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Authentication is not configured on the server. Set "
                "SECRET_KEY in the backend environment."
            ),
        ) from exc

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user),
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Create an account and return an access token."""
    try:
        user = auth_service.create_user(
            db,
            name=payload.name,
            email=payload.email,
            password=payload.password,
        )
    except auth_service.EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    return _issue_token(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email + password and return an access token."""
    user = auth_service.authenticate_user(
        db,
        email=payload.email,
        password=payload.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _issue_token(user)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: CurrentUser):
    """Return the authenticated user's profile."""
    return current_user


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Start a password reset.

    The response never reveals whether the email is registered. It also never
    claims an email was sent when SMTP is unconfigured or the send failed -
    those cases return an explicit server error instead.
    """
    if not settings.smtp_configured:
        logger.error(
            "forgot-password requested but SMTP is not configured; no email sent"
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Password reset email could not be sent because email delivery "
                "is not configured on the server."
            ),
        )

    user = auth_service.get_user_by_email(db, payload.email)

    if user is None or not user.is_active:
        # Do nothing, but respond identically to the success case.
        return MessageResponse(message=FORGOT_PASSWORD_MESSAGE)

    raw_token = auth_service.create_password_reset_token(db, user)
    reset_url = auth_service.build_reset_url(raw_token)

    try:
        email_service.send_password_reset_email(
            to_email=user.email,
            reset_url=reset_url,
            user_name=user.name,
        )
    except email_service.EmailNotConfiguredError as exc:
        logger.error("Password reset email not sent: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Password reset email could not be sent because email delivery "
                "is not configured on the server."
            ),
        ) from exc
    except email_service.EmailSendError as exc:
        logger.error("Password reset email delivery failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Password reset email could not be delivered. Please try again "
                "later."
            ),
        ) from exc

    return MessageResponse(message=FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Consume a reset token and set the new password."""
    try:
        auth_service.reset_password(
            db,
            raw_token=payload.token,
            new_password=payload.new_password,
        )
    except auth_service.InvalidResetTokenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This password reset link is invalid or has expired. Please "
                "request a new one."
            ),
        )

    return MessageResponse(
        message="Your password has been updated. You can now sign in."
    )
