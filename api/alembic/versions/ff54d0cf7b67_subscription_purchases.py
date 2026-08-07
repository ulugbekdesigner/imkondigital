"""subscription purchases

Revision ID: ff54d0cf7b67
Revises: f4b8d2a91c3e
Create Date: 2026-08-07 13:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'ff54d0cf7b67'
down_revision: str | None = 'f4b8d2a91c3e'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("subscriptions", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "subscription_purchases",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("plan", sa.String(length=8), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=16), nullable=True),
        sa.Column("provider_transaction_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider_transaction_id"),
    )
    op.create_index(
        "ix_subscription_purchases_user_id", "subscription_purchases", ["user_id"]
    )
    op.create_index(
        "ix_subscription_purchases_provider_transaction_id",
        "subscription_purchases",
        ["provider_transaction_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_subscription_purchases_provider_transaction_id",
        table_name="subscription_purchases",
    )
    op.drop_index("ix_subscription_purchases_user_id", table_name="subscription_purchases")
    op.drop_table("subscription_purchases")
    op.drop_column("subscriptions", "expires_at")
