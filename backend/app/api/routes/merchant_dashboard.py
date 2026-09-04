from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentMerchant, SkipParam, LimitParam, get_db
from app.models.merchant import Merchant
from app.schemas.common import PaginatedResponse
from app.schemas.order import OrderOut
from app.services import merchant_service


router = APIRouter(
    prefix="/merchant-dashboard",
    tags=["merchant-dashboard"],
)


@router.get("/me")
def get_dashboard_profile(
    current_merchant: CurrentMerchant,
):
    return {
        "id": current_merchant.id,
        "name": current_merchant.name,
        "email": current_merchant.email,
    }


@router.get("/orders", response_model=PaginatedResponse[OrderOut])
def get_my_orders(
    current_merchant: CurrentMerchant,
    skip: SkipParam = 0,
    limit: LimitParam = 20,
    db: Session = Depends(get_db),
):
    items, total = merchant_service.list_merchant_orders(
        db,
        current_merchant.id,
        skip=skip,
        limit=limit,
    )

    return PaginatedResponse(
        total=total,
        skip=skip,
        limit=limit,
        items=items,
    )
