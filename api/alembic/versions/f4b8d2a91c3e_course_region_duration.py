"""course region and duration

Revision ID: f4b8d2a91c3e
Revises: e3a7c9f1b2d4
Create Date: 2026-08-02 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f4b8d2a91c3e'
down_revision: str | None = 'e3a7c9f1b2d4'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("region_id", sa.BigInteger(), nullable=True))
    op.add_column("courses", sa.Column("duration_weeks", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_courses_region_id_regions",
        "courses",
        "regions",
        ["region_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_courses_region_id_regions", "courses", type_="foreignkey")
    op.drop_column("courses", "duration_weeks")
    op.drop_column("courses", "region_id")
