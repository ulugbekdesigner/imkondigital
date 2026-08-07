"""til category and user streaks

Revision ID: 4f29cbf4cf3d
Revises: d630219d17e5
Create Date: 2026-07-29 10:55:03.611557
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4f29cbf4cf3d'
down_revision: str | None = 'd630219d17e5'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_streaks",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    # --- Seed: "Til o'rganish" kategoriyasi (KENGAYISH_PLAN_3.md 3-bo'lim) ---
    cat = sa.table(
        "course_categories",
        sa.column("key", sa.String),
        sa.column("name", sa.String),
        sa.column("ladder_step", sa.Integer),
        sa.column("sort", sa.Integer),
    )
    op.bulk_insert(
        cat,
        [{"key": "I", "name": "Til o'rganish", "ladder_step": 2, "sort": 9}],
    )


def downgrade() -> None:
    op.execute("DELETE FROM course_categories WHERE key = 'I'")
    op.drop_table("user_streaks")
