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
        .options(
            selectinload(Order.items).selectinload(OrderItem.product)
        )
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
        .options(
            selectinload(Order.items).selectinload(OrderItem.product)
        )
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
            .options(
                selectinload(Order.items).selectinload(OrderItem.product)
            )
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


# =========================
# PAYMENT STATE TRANSITIONS
# =========================

def attach_razorpay_order(
    db: Session,
    *,
    order_id: int,
    razorpay_order_id: str,
) -> Order | None:
    """
    Link a local order to the Razorpay order that was just created and move
    its payment into `processing`.

    This records intent only - `payment_verified` stays False until the
    signature check in record_payment_result() succeeds.
    """
    order = db.get(Order, order_id)

    if order is None:
        return None

    order.razorpay_order_id = razorpay_order_id
    order.payment_status = PaymentStatus.processing

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(order)
    return order


def record_payment_result(
    db: Session,
    *,
    order_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    verified: bool,
) -> Order | None:
    """
    Persist the outcome of a Razorpay signature verification.

    `payment_verified` / `payment_status = successful` are only ever set when
    `verified` is True. A failed verification marks the payment as failed and
    leaves the order unconfirmed.
    """
    order = db.get(Order, order_id)

    if order is None:
        return None

    order.razorpay_order_id = razorpay_order_id
    order.razorpay_payment_id = razorpay_payment_id
    order.payment_verified = bool(verified)

    if verified:
        order.payment_status = PaymentStatus.successful
        order.status = OrderStatus.confirmed
    else:
        order.payment_status = PaymentStatus.failed

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(order)
    return order
