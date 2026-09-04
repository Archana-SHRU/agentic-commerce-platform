"""add users, password_reset_tokens and Razorpay payment fields on orders

Revision ID: 0002_auth_payment
Revises: 0001_initial
Create Date: 2026-09-02 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_auth_payment"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users --------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
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
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )

    # --- password_reset_tokens ----------------------------------------
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # SHA-256 hex digest of the token - the raw token is never stored.
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_password_reset_tokens_user_id",
        "password_reset_tokens",
        ["user_id"],
    )
    op.create_index(
        "ix_password_reset_tokens_token_hash",
        "password_reset_tokens",
        ["token_hash"],
        unique=True,
    )

    # --- orders: Razorpay payment tracking ----------------------------
    op.add_column(
        "orders",
        sa.Column("razorpay_order_id", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("razorpay_payment_id", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "payment_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.create_index(
        "ix_orders_razorpay_order_id",
        "orders",
        ["razorpay_order_id"],
    )
    op.create_index(
        "ix_orders_razorpay_payment_id",
        "orders",
        ["razorpay_payment_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_orders_razorpay_payment_id", table_name="orders")
    op.drop_index("ix_orders_razorpay_order_id", table_name="orders")
    op.drop_column("orders", "payment_verified")
    op.drop_column("orders", "razorpay_payment_id")
    op.drop_column("orders", "razorpay_order_id")

    op.drop_index(
        "ix_password_reset_tokens_token_hash",
        table_name="password_reset_tokens",
    )
    op.drop_index(
        "ix_password_reset_tokens_user_id",
        table_name="password_reset_tokens",
    )
    op.drop_table("password_reset_tokens")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
