from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.enums import OrderStatus, PaymentStatus
from app.schemas.order import OrderCreate


def get_order(
    db: Session,
    order_id: int,
) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )

    return db.execute(
        stmt
    ).scalar_one_or_none()


def get_orders(
    db: Session,
    skip: int = 0,
    limit: int = 50,
) -> tuple[int, list[Order]]:

    total = db.scalar(
        select(func.count()).select_from(Order)
    ) or 0

    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    orders = db.execute(
        stmt
    ).scalars().all()

    return total, orders


def create_order(
    db: Session,
    order_data: OrderCreate,
) -> Order:

    # Store validated products here
    products_data: list[
        tuple[Product, int]
    ] = []

    # Validate all products first
    for item in order_data.items:

        product = db.get(
            Product,
            item.product_id,
        )

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Product with ID "
                    f"{item.product_id} not found"
                ),
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Product '{product.name}' "
                    f"is not available"
                ),
            )

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only {product.stock} units of "
                    f"'{product.name}' are available"
                ),
            )

        products_data.append(
            (
                product,
                item.quantity,
            )
        )

    # Current database design supports
    # one merchant per order
    merchant_ids = {
        product.merchant_id
        for product, _ in products_data
    }

    if len(merchant_ids) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Products from multiple merchants "
                "cannot be placed in the same order yet"
            ),
        )

    merchant_id = merchant_ids.pop()

    # Calculate total amount
    total_amount = Decimal("0.00")

    for product, quantity in products_data:
        total_amount += (
            Decimal(str(product.price))
            * quantity
        )

    try:
        # Create order
        order = Order(
            merchant_id=merchant_id,
            customer_id=order_data.customer_id,
            total_amount=total_amount,
            status=OrderStatus.pending,
            payment_status=PaymentStatus.pending,
        )

        db.add(order)
        db.flush()

        # Create order items and update stock
        for product, quantity in products_data:

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price,
            )

            db.add(order_item)

            product.stock -= quantity

        db.commit()

        # Reload order with items
        db.refresh(order)

        stmt = (
            select(Order)
            .where(Order.id == order.id)
            .options(selectinload(Order.items))
        )

        return db.execute(
            stmt
        ).scalar_one()

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise