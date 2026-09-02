"""
Seed script for local/demo data.

Populates:
  - 2 merchants
  - 12 realistic products (spread across both merchants + several categories)
  - 6 orders (covering different order/payment status combinations)
  - order items for each order
  - audit log entries corresponding to each order's lifecycle, plus a few
    standalone "AI shopping flow" style events (search/recommendation/upsell)
    so the /api/audit-logs endpoint has representative data to return.

This is idempotent: running it multiple times will NOT create duplicate
merchants/products (matched by unique email / name+merchant), so it's safe
to re-run after `alembic upgrade head`.

Run with:  python seed.py   (from the backend/ directory)
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.base import SessionLocal
from app.models import Merchant, Product, Order, OrderItem, AuditLog
from app.models.enums import OrderStatus, PaymentStatus


def _now_minus(days: int = 0, hours: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days, hours=hours)


MERCHANTS = [
    {"name": "TechHub Electronics", "email": "contact@techhub-electronics.example.com"},
    {"name": "Fashion Forward", "email": "hello@fashion-forward.example.com"},
]

# Products are keyed to a merchant by index into MERCHANTS (0 or 1).
PRODUCTS = [
    # --- TechHub Electronics (merchant index 0) ---
    dict(
        merchant_idx=0,
        name='MacBook Pro 14" M2',
        description="Apple M2 chip, 16GB unified memory, 512GB SSD. Built for developers and creative professionals.",
        category="Laptops",
        price=Decimal("139999.00"),
        stock=8,
        rating=Decimal("4.9"),
    ),
    dict(
        merchant_idx=0,
        name="Sony WH-1000XM5 Headphones",
        description="Industry-leading noise cancellation with 30-hour battery life and Hi-Res Audio (LDAC).",
        category="Audio",
        price=Decimal("24999.00"),
        stock=25,
        rating=Decimal("4.7"),
    ),
    dict(
        merchant_idx=0,
        name="Dell XPS 13 Plus",
        description="13.4-inch OLED display, Intel Core i7, 16GB RAM, 1TB SSD ultrabook.",
        category="Laptops",
        price=Decimal("124999.00"),
        stock=6,
        rating=Decimal("4.5"),
    ),
    dict(
        merchant_idx=0,
        name="Samsung Galaxy S24 Ultra",
        description="6.8-inch Dynamic AMOLED, Snapdragon 8 Gen 3, 200MP camera, S Pen included.",
        category="Mobiles",
        price=Decimal("129999.00"),
        stock=15,
        rating=Decimal("4.6"),
    ),
    dict(
        merchant_idx=0,
        name="Apple Watch Series 9",
        description="GPS + Cellular, 45mm, always-on Retina display, advanced health sensors.",
        category="Wearables",
        price=Decimal("45999.00"),
        stock=20,
        rating=Decimal("4.8"),
    ),
    dict(
        merchant_idx=0,
        name="Logitech MX Master 3S",
        description="Ergonomic wireless mouse with 8K DPI sensor and quiet clicks.",
        category="Accessories",
        price=Decimal("8999.00"),
        stock=40,
        rating=Decimal("4.7"),
    ),
    dict(
        merchant_idx=0,
        name="Boat Airdopes 141",
        description="Budget-friendly true wireless earbuds with 42 hours of total playback.",
        category="Audio",
        price=Decimal("1499.00"),
        stock=100,
        rating=Decimal("4.1"),
    ),
    # --- Fashion Forward (merchant index 1) ---
    dict(
        merchant_idx=1,
        name="Nike Air Max 90",
        description="Classic silhouette with visible Air cushioning, breathable mesh upper.",
        category="Footwear",
        price=Decimal("8999.00"),
        stock=30,
        rating=Decimal("4.5"),
    ),
    dict(
        merchant_idx=1,
        name="Levi's 511 Slim Fit Jeans",
        description="Slim-fit stretch denim, mid-rise, versatile everyday wear.",
        category="Apparel",
        price=Decimal("3499.00"),
        stock=60,
        rating=Decimal("4.3"),
    ),
    dict(
        merchant_idx=1,
        name="Adidas Ultraboost 22",
        description="Responsive Boost midsole running shoes with Primeknit upper.",
        category="Footwear",
        price=Decimal("15999.00"),
        stock=18,
        rating=Decimal("4.6"),
    ),
    dict(
        merchant_idx=1,
        name="Ray-Ban Aviator Classic",
        description="Iconic gold-frame aviator sunglasses with G-15 green lenses.",
        category="Accessories",
        price=Decimal("7999.00"),
        stock=22,
        rating=Decimal("4.7"),
    ),
    dict(
        merchant_idx=1,
        name="Zara Wool Blend Overcoat",
        description="Tailored knee-length overcoat, wool-blend, winter collection.",
        category="Apparel",
        price=Decimal("12999.00"),
        stock=12,
        rating=Decimal("4.4"),
    ),
    dict(
        merchant_idx=1,
        name="Fossil Gen 6 Smartwatch",
        description="Wear OS smartwatch with heart-rate tracking and 24-hour battery life.",
        category="Wearables",
        price=Decimal("22995.00"),
        stock=14,
        rating=Decimal("4.2"),
    ),
]


def _get_or_create_merchants(db: Session) -> list[Merchant]:
    merchants: list[Merchant] = []
    for data in MERCHANTS:
        merchant = db.query(Merchant).filter(Merchant.email == data["email"]).first()
        if merchant is None:
            merchant = Merchant(**data)
            db.add(merchant)
            db.flush()  # assign an id without committing yet
        merchants.append(merchant)
    return merchants


def _get_or_create_products(db: Session, merchants: list[Merchant]) -> list[Product]:
    products: list[Product] = []
    for data in PRODUCTS:
        merchant = merchants[data["merchant_idx"]]
        existing = (
            db.query(Product)
            .filter(Product.name == data["name"], Product.merchant_id == merchant.id)
            .first()
        )
        if existing is None:
            product = Product(
                merchant_id=merchant.id,
                name=data["name"],
                description=data["description"],
                category=data["category"],
                price=data["price"],
                stock=data["stock"],
                rating=data["rating"],
                is_active=True,
            )
            db.add(product)
            db.flush()
            existing = product
        products.append(existing)
    return products


def _create_orders_and_audit_logs(
    db: Session, merchants: list[Merchant], products: list[Product]
) -> None:
    if db.query(Order).count() > 0:
        # Orders already seeded - skip to keep this idempotent.
        return

    by_name = {p.name: p for p in products}

    # Each entry: (merchant, customer_id, [(product, qty)], status, payment_status, days_ago)
    order_specs = [
        (
            merchants[0],
            "cust-1001",
            [(by_name['MacBook Pro 14" M2'], 1), (by_name["Logitech MX Master 3S"], 1)],
            OrderStatus.delivered,
            PaymentStatus.successful,
            10,
        ),
        (
            merchants[0],
            "cust-1002",
            [(by_name["Sony WH-1000XM5 Headphones"], 1)],
            OrderStatus.shipped,
            PaymentStatus.successful,
            4,
        ),
        (
            merchants[0],
            "cust-1003",
            [(by_name["Samsung Galaxy S24 Ultra"], 1), (by_name["Boat Airdopes 141"], 2)],
            OrderStatus.confirmed,
            PaymentStatus.successful,
            2,
        ),
        (
            merchants[0],
            "cust-1004",
            [(by_name["Apple Watch Series 9"], 1)],
            OrderStatus.pending,
            PaymentStatus.pending,
            0,
        ),
        (
            merchants[1],
            "cust-2001",
            [(by_name["Nike Air Max 90"], 1), (by_name["Levi's 511 Slim Fit Jeans"], 2)],
            OrderStatus.delivered,
            PaymentStatus.successful,
            15,
        ),
        (
            merchants[1],
            "cust-2002",
            [(by_name["Adidas Ultraboost 22"], 1)],
            OrderStatus.cancelled,
            PaymentStatus.failed,
            6,
        ),
    ]

    for merchant, customer_id, items, status, payment_status, days_ago in order_specs:
        total_amount = sum(p.price * qty for p, qty in items)
        created_at = _now_minus(days=days_ago)

        order = Order(
            merchant_id=merchant.id,
            customer_id=customer_id,
            total_amount=total_amount,
            status=status,
            payment_status=payment_status,
            created_at=created_at,
        )
        db.add(order)
        db.flush()  # get order.id

        for product, qty in items:
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=product.price,
                )
            )

        # Audit trail mirroring the eventual AI-agent -> approval -> payment flow.
        product_names = ", ".join(p.name for p, _ in items)
        events = [
            (
                "customer",
                "customer_request_received",
                created_at - timedelta(minutes=12),
                {"customer_id": customer_id, "message": f"Looking for {items[0][0].category.lower()}"},
            ),
            (
                "ai_agent",
                "product_search_performed",
                created_at - timedelta(minutes=10),
                {"category": items[0][0].category, "results_count": len(items)},
            ),
            (
                "ai_agent",
                "product_recommended",
                created_at - timedelta(minutes=8),
                {"products": product_names},
            ),
            (
                "customer",
                "customer_approval_received",
                created_at - timedelta(minutes=2),
                {"approved": True},
            ),
            (
                "system",
                "order_created",
                created_at,
                {"order_id": order.id, "total_amount": str(total_amount)},
            ),
        ]

        if payment_status in (PaymentStatus.successful, PaymentStatus.processing):
            events.append(
                ("system", "payment_initiated", created_at + timedelta(seconds=5),
                 {"order_id": order.id, "amount": str(total_amount)})
            )
        if payment_status == PaymentStatus.successful:
            events.append(
                ("system", "payment_successful", created_at + timedelta(seconds=30),
                 {"order_id": order.id})
            )
        elif payment_status == PaymentStatus.failed:
            events.append(
                ("system", "payment_failed", created_at + timedelta(seconds=20),
                 {"order_id": order.id, "reason": "card_declined"})
            )

        for actor, action, ts, details in events:
            db.add(
                AuditLog(
                    actor=actor,
                    action=action,
                    entity_type="order",
                    entity_id=str(order.id),
                    details=details,
                    created_at=ts,
                )
            )


def seed() -> None:
    db = SessionLocal()
    try:
        merchants = _get_or_create_merchants(db)
        db.flush()
        products = _get_or_create_products(db, merchants)
        db.flush()
        _create_orders_and_audit_logs(db, merchants, products)
        db.commit()

        merchant_count = db.query(Merchant).count()
        product_count = db.query(Product).count()
        order_count = db.query(Order).count()
        audit_count = db.query(AuditLog).count()

        print("Seed complete:")
        print(f"  merchants:  {merchant_count}")
        print(f"  products:   {product_count}")
        print(f"  orders:     {order_count}")
        print(f"  audit_logs: {audit_count}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
