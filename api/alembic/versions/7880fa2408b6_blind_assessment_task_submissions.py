"""blind assessment task submissions

Revision ID: 7880fa2408b6
Revises: c70f0437de41
Create Date: 2026-08-09 14:43:16.304703
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '7880fa2408b6'
down_revision: str | None = 'c70f0437de41'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "vacancy_tasks",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("vacancy_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["vacancy_id"], ["vacancies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vacancy_id"),
    )

    op.create_table(
        "task_submissions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("application_id", sa.BigInteger(), nullable=False),
        sa.Column("vacancy_id", sa.BigInteger(), nullable=False),
        sa.Column("blind_index", sa.Integer(), nullable=False),
        sa.Column("file_url", sa.String(length=512), nullable=True),
        sa.Column("text", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="submitted"),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("revealed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["vacancy_id"], ["vacancies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id"),
    )
    op.create_index(
        op.f("ix_task_submissions_vacancy_id"), "task_submissions", ["vacancy_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_task_submissions_vacancy_id"), table_name="task_submissions")
    op.drop_table("task_submissions")
    op.drop_table("vacancy_tasks")
