"""disability profile submitted at and rejection reason

Revision ID: d81b2f5d4b4f
Revises: 77b2f86e10f6
Create Date: 2026-07-31 13:34:33.440514
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd81b2f5d4b4f'
down_revision: str | None = '77b2f86e10f6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "disability_profiles",
        sa.Column(
            "submitted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.add_column(
        "disability_profiles",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("disability_profiles", "rejection_reason")
    op.drop_column("disability_profiles", "submitted_at")
