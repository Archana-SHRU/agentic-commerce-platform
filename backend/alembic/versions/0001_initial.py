"""create initial tables (merchants, products, orders, order_items, audit_logs)

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-29 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- merchants ---------------------------------------------------
    op.create_table(
        "merchants",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_merchants_email",
        "merchants",
        ["email"],
        unique=True,
    )

    # --- products ----------------------------------------------------
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "merchant_id",
            sa.Integer(),
            sa.ForeignKey("merchants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "stock",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "rating",
            sa.Numeric(2, 1),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_products_merchant_id",
        "products",
        ["merchant_id"],
    )
    op.create_index(
        "ix_products_name",
        "products",
        ["name"],
    )
    op.create_index(
        "ix_products_category",
        "products",
        ["category"],
    )

    # --- orders ------------------------------------------------------
    order_status_enum = sa.Enum(
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        name="order_status",
    )

    payment_status_enum = sa.Enum(
        "pending",
        "processing",
        "successful",
        "failed",
        "refunded",
        name="payment_status",
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "merchant_id",
            sa.Integer(),
            sa.ForeignKey("merchants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "total_amount",
            sa.Numeric(10, 2),
            nullable=False,
        ),
        sa.Column(
            "status",
            order_status_enum,
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "payment_status",
            payment_status_enum,
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_orders_merchant_id",
        "orders",
        ["merchant_id"],
    )
    op.create_index(
        "ix_orders_customer_id",
        "orders",
        ["customer_id"],
    )

    # --- order_items -------------------------------------------------
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "order_id",
            sa.Integer(),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "quantity",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "unit_price",
            sa.Numeric(10, 2),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_order_items_order_id",
        "order_items",
        ["order_id"],
    )
    op.create_index(
        "ix_order_items_product_id",
        "order_items",
        ["product_id"],
    )

    # --- audit_logs ---------------------------------------------------
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "actor",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "action",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "entity_type",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "entity_id",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "details",
            sa.JSON(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_audit_logs_actor",
        "audit_logs",
        ["actor"],
    )
    op.create_index(
        "ix_audit_logs_action",
        "audit_logs",
        ["action"],
    )
    op.create_index(
        "ix_audit_logs_entity_type",
        "audit_logs",
        ["entity_type"],
    )
    op.create_index(
        "ix_audit_logs_entity_id",
        "audit_logs",
        ["entity_id"],
    )
    op.create_index(
        "ix_audit_logs_created_at",
        "audit_logs",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_table("merchants")

    # Drop enum types explicitly.
    sa.Enum(
        name="order_status"
    ).drop(op.get_bind(), checkfirst=True)

    sa.Enum(
        name="payment_status"
    ).drop(op.get_bind(), checkfirst=True)