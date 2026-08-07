"""quiz question points

Revision ID: e3a7c9f1b2d4
Revises: adce12d74a14
Create Date: 2026-08-02 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e3a7c9f1b2d4'
down_revision: str | None = 'adce12d74a14'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "quiz_questions",
        sa.Column("points", sa.Integer(), nullable=False, server_default="1"),
    )
    op.alter_column("quiz_questions", "points", server_default=None)


def downgrade() -> None:
    op.drop_column("quiz_questions", "points")
