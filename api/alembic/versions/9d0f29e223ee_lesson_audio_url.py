"""lesson audio url

Revision ID: 9d0f29e223ee
Revises: b76b70af48fb
Create Date: 2026-08-10 20:10:58.651381
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '9d0f29e223ee'
down_revision: str | None = 'b76b70af48fb'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('lessons', sa.Column('audio_url', sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column('lessons', 'audio_url')
