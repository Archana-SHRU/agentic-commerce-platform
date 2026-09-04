"""add merchant authentication

Revision ID: a4bdb8310845
Revises: 0002_auth_payment
Create Date: 2026-09-04 20:23:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4bdb8310845"
down_revision: Union[str, Sequence[str], None] = "0002_auth_payment"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "merchants",
        sa.Column(
            "password_hash",
            sa.String(length=255),
            nullable=False,
            server_default="",
        ),
    )

    op.add_column(
        "merchants",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column("merchants", "is_active")
    op.drop_column("merchants", "password_hash")
