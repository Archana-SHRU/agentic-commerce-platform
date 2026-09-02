from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, SkipParam, LimitParam
from app.schemas.merchant import MerchantOut
from app.schemas.order import OrderOut
from app.schemas.common import PaginatedResponse
from app.services import merchant_service

router = APIRouter(prefix="/merchants", tags=["merchants"])


@router.get("/{merchant_id}", response_model=MerchantOut)
def get_merchant(merchant_id: int, db: Session = Depends(get_db)):
    merchant = merchant_service.get_merchant(db, merchant_id)
    if merchant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    return merchant


@router.get("/{merchant_id}/orders", response_model=PaginatedResponse[OrderOut])
def list_merchant_orders(
    merchant_id: int,
    skip: SkipParam = 0,
    limit: LimitParam = 20,
    db: Session = Depends(get_db),
):
    merchant = merchant_service.get_merchant(db, merchant_id)
    if merchant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")

    items, total = merchant_service.list_merchant_orders(db, merchant_id, skip=skip, limit=limit)
    return PaginatedResponse(total=total, skip=skip, limit=limit, items=items)
