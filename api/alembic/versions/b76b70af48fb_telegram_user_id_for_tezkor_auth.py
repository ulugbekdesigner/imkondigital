"""telegram user id for tezkor auth

Revision ID: b76b70af48fb
Revises: 9478a08f6afb
Create Date: 2026-08-09 20:11:23.232518
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b76b70af48fb'
down_revision: str | None = '9478a08f6afb'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("telegram_user_id", sa.BigInteger(), nullable=True))
    op.create_unique_constraint("uq_users_telegram_user_id", "users", ["telegram_user_id"])


def downgrade() -> None:
    op.drop_constraint("uq_users_telegram_user_id", "users", type_="unique")
    op.drop_column("users", "telegram_user_id")
