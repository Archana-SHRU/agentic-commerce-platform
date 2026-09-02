from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.merchant import Merchant
from app.schemas.product import ProductCreate, ProductUpdate


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def list_products(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 20,
    category: str | None = None,
    merchant_id: int | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> tuple[list[Product], int]:
    """Return (items, total_count) applying the given filters."""
    stmt = select(Product)
    count_stmt = select(func.count()).select_from(Product)

    if category:
        stmt = stmt.where(Product.category.ilike(category))
        count_stmt = count_stmt.where(Product.category.ilike(category))
    if merchant_id is not None:
        stmt = stmt.where(Product.merchant_id == merchant_id)
        count_stmt = count_stmt.where(Product.merchant_id == merchant_id)
    if is_active is not None:
        stmt = stmt.where(Product.is_active == is_active)
        count_stmt = count_stmt.where(Product.is_active == is_active)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(Product.name.ilike(pattern))
        count_stmt = count_stmt.where(Product.name.ilike(pattern))

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.order_by(Product.id).offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def merchant_exists(db: Session, merchant_id: int) -> bool:
    return db.get(Merchant, merchant_id) is not None


def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, data: ProductUpdate) -> Product:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product
