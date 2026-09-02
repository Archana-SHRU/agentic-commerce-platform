from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.merchant import Merchant
from app.models.order import Order


def get_merchant(db: Session, merchant_id: int) -> Merchant | None:
    return db.get(Merchant, merchant_id)


def list_merchant_orders(
    db: Session, merchant_id: int, *, skip: int = 0, limit: int = 20
) -> tuple[list[Order], int]:
    stmt = (
        select(Order)
        .where(Order.merchant_id == merchant_id)
        .order_by(Order.created_at.desc())
    )
    count_stmt = select(func.count()).select_from(Order).where(Order.merchant_id == merchant_id)

    total = db.execute(count_stmt).scalar_one()
    stmt = stmt.offset(skip).limit(limit)
    items = list(db.execute(stmt).scalars().all())
    return items, total
