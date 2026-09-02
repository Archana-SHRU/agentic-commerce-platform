from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, SkipParam, LimitParam
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.schemas.common import PaginatedResponse
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=PaginatedResponse[ProductOut])
def list_products(
    skip: SkipParam = 0,
    limit: LimitParam = 20,
    category: str | None = None,
    merchant_id: int | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    """List products with optional filtering and pagination."""
    items, total = product_service.list_products(
        db,
        skip=skip,
        limit=limit,
        category=category,
        merchant_id=merchant_id,
        is_active=is_active,
        search=search,
    )
    return PaginatedResponse(total=total, skip=skip, limit=limit, items=items)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    if not product_service.merchant_exists(db, payload.merchant_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Merchant with id {payload.merchant_id} does not exist",
        )
    return product_service.create_product(db, payload)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product_service.update_product(db, product, payload)
