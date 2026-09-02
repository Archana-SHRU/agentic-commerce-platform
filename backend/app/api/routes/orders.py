from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.order import (
    OrderCreate,
    OrderOut,
    PaginatedOrders,
)
from app.services import order_service


router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)


# =========================
# CREATE ORDER
# =========================

@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
):
    return order_service.create_order(
        db,
        order_data,
    )


# =========================
# GET ALL ORDERS
# =========================

@router.get(
    "",
    response_model=PaginatedOrders,
)
def get_orders(
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    total, orders = order_service.get_orders(
        db=db,
        skip=skip,
        limit=limit,
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": orders,
    }


# =========================
# GET SINGLE ORDER
# =========================

@router.get(
    "/{order_id}",
    response_model=OrderOut,
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = order_service.get_order(
        db,
        order_id,
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order