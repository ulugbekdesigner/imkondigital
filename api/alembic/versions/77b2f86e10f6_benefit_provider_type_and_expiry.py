"""benefit provider type and expiry

Revision ID: 77b2f86e10f6
Revises: 9d3d969fce06
Create Date: 2026-07-31 10:14:15.244464
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '77b2f86e10f6'
down_revision: str | None = '9d3d969fce06'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "benefits",
        sa.Column(
            "provider_type", sa.String(length=16), nullable=False, server_default="davlat"
        ),
    )
    op.add_column(
        "benefits",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("benefits", "expires_at")
    op.drop_column("benefits", "provider_type")
