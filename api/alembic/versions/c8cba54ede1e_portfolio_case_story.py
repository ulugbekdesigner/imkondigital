"""portfolio case story

Revision ID: c8cba54ede1e
Revises: 93499677a752
Create Date: 2026-07-29 10:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c8cba54ede1e'
down_revision: str | None = '93499677a752'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "portfolio_items", sa.Column("task", sa.Text(), nullable=False, server_default="")
    )
    op.add_column(
        "portfolio_items", sa.Column("result", sa.Text(), nullable=False, server_default="")
    )
    op.add_column("portfolio_items", sa.Column("client_feedback", sa.Text(), nullable=True))
    op.add_column(
        "portfolio_items",
        sa.Column("skills", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
    )

    op.create_table(
        "portfolio_item_steps",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("portfolio_item_id", sa.BigInteger(), nullable=False),
        sa.Column("caption", sa.String(length=300), nullable=False, server_default=""),
        sa.Column("media_url", sa.String(length=512), nullable=False),
        sa.Column("sort", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["portfolio_item_id"], ["portfolio_items.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_portfolio_item_steps_portfolio_item_id",
        "portfolio_item_steps",
        ["portfolio_item_id"],
    )

    op.create_table(
        "case_story_sessions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("portfolio_item_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["portfolio_item_id"], ["portfolio_items.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_case_story_sessions_user_id", "case_story_sessions", ["user_id"]
    )
    op.create_index(
        "ix_case_story_sessions_portfolio_item_id",
        "case_story_sessions",
        ["portfolio_item_id"],
    )

    op.create_table(
        "case_story_messages",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("session_id", sa.BigInteger(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False, server_default="user"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["session_id"], ["case_story_sessions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_case_story_messages_session_id", "case_story_messages", ["session_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_case_story_messages_session_id", table_name="case_story_messages")
    op.drop_table("case_story_messages")
    op.drop_index("ix_case_story_sessions_portfolio_item_id", table_name="case_story_sessions")
    op.drop_index("ix_case_story_sessions_user_id", table_name="case_story_sessions")
    op.drop_table("case_story_sessions")
    op.drop_index(
        "ix_portfolio_item_steps_portfolio_item_id", table_name="portfolio_item_steps"
    )
    op.drop_table("portfolio_item_steps")
    op.drop_column("portfolio_items", "skills")
    op.drop_column("portfolio_items", "client_feedback")
    op.drop_column("portfolio_items", "result")
    op.drop_column("portfolio_items", "task")
