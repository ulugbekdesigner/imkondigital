"""mentorship request message

Revision ID: a520b6951c96
Revises: d81b2f5d4b4f
Create Date: 2026-07-31 14:35:12.078678
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a520b6951c96'
down_revision: str | None = 'd81b2f5d4b4f'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("mentorships", sa.Column("message", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("mentorships", "message")
