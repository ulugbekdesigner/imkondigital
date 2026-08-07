"""external jobs

Revision ID: 93499677a752
Revises: b9160573f505
Create Date: 2026-07-29 09:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '93499677a752'
down_revision: str | None = 'b9160573f505'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "external_jobs",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("external_id", sa.String(length=200), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("title_uz", sa.String(length=300), nullable=True),
        sa.Column("company_name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("description_uz", sa.Text(), nullable=True),
        sa.Column("ladder_step", sa.Integer(), nullable=True),
        sa.Column(
            "tags", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"
        ),
        sa.Column("location_note", sa.String(length=200), nullable=True),
        sa.Column("source_url", sa.String(length=600), nullable=False),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "fetched_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source", "external_id", name="uq_external_job"),
    )
    op.create_index(
        "ix_external_jobs_is_active", "external_jobs", ["is_active"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_external_jobs_is_active", table_name="external_jobs")
    op.drop_table("external_jobs")
