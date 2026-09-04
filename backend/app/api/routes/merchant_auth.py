from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import SecurityConfigError, create_access_token, verify_password
from app.models.merchant import Merchant
from app.schemas.auth import LoginRequest

router = APIRouter(prefix="/merchant-auth", tags=["merchant-auth"])

INVALID_CREDENTIALS_DETAIL = "Invalid merchant email or password"


@router.post("/login")
def merchant_login(payload: LoginRequest, db: Session = Depends(get_db)):
    merchant = (
        db.query(Merchant)
        .filter(Merchant.email == payload.email.strip().lower())
        .first()
    )

    if (
        merchant is None
        or not merchant.is_active
        or not verify_password(payload.password, merchant.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS_DETAIL,
        )

    try:
        token = create_access_token(
            subject=merchant.id,
            extra_claims={"role": "merchant"},
        )
    except SecurityConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured on the server.",
        ) from exc

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "email": merchant.email,
        },
    }
