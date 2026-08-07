"""notification category

Revision ID: d630219d17e5
Revises: a04ec437af2a
Create Date: 2026-07-29 00:08:09.954419
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd630219d17e5'
down_revision: str | None = 'a04ec437af2a'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("category", sa.String(length=16), nullable=False, server_default="learning"),
    )
    # Mavjud yozuvlarni turi bo'yicha to'g'ri toifaga o'tkazamiz (backfill) —
    # server_default faqat yangi ustun uchun zaxira, aniqroq qiymat beramiz.
    op.execute(
        """
        UPDATE notifications SET category = 'opportunity'
        WHERE type IN ('application_status', 'order_status', 'order_message')
        """
    )
    op.alter_column("notifications", "category", server_default=None)


def downgrade() -> None:
    op.drop_column("notifications", "category")
