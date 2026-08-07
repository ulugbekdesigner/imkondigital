"""peer support

Revision ID: 5a463add0712
Revises: bf97989e4ca7
Create Date: 2026-08-01 00:20:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '5a463add0712'
down_revision: str | None = 'bf97989e4ca7'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "peer_support_rooms",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("key", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )

    op.create_table(
        "peer_support_posts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("room_id", sa.BigInteger(), nullable=False),
        sa.Column("author_id", sa.BigInteger(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("hidden_reason", sa.String(length=300), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["room_id"], ["peer_support_rooms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_peer_support_posts_room_id"), "peer_support_posts", ["room_id"], unique=False
    )
    op.create_index(
        op.f("ix_peer_support_posts_author_id"),
        "peer_support_posts",
        ["author_id"],
        unique=False,
    )

    op.create_table(
        "peer_support_reports",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("post_id", sa.BigInteger(), nullable=False),
        sa.Column("reporter_id", sa.BigInteger(), nullable=False),
        sa.Column("reason", sa.String(length=300), nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["post_id"], ["peer_support_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_peer_support_reports_post_id"), "peer_support_reports", ["post_id"], unique=False
    )

    # Mavzu bo'yicha qat'iy belgilangan davralar (ladder/nogironlik bo'yicha
    # avtomatik guruhlash YO'Q — CONTRIBUTING.md 6-qoida). KENGAYISH_PLAN_3.md
    # 7.1-bo'limida keltirilgan misollarga mos.
    rooms = sa.table(
        "peer_support_rooms",
        sa.column("key", sa.String),
        sa.column("title", sa.String),
        sa.column("description", sa.Text),
        sa.column("sort", sa.Integer),
    )
    op.bulk_insert(
        rooms,
        [
            {
                "key": "ish-qidirish",
                "title": "Ish qidirish",
                "description": "Rezyume, ariza va suhbatga tayyorgarlik haqida tajriba almashing.",
                "sort": 0,
            },
            {
                "key": "birinchi-ish-kuni",
                "title": "Birinchi ish kuni",
                "description": "Yangi jamoada qanday moslashish, savollar va qo'rquvlar.",
                "sort": 1,
            },
            {
                "key": "oziga-ishonch",
                "title": "O'ziga ishonch",
                "description": "Shubha va qo'rquv bilan ishlash — bir-biringizni qo'llab-quvvatlang.",
                "sort": 2,
            },
            {
                "key": "kundalik-motivatsiya",
                "title": "Kundalik motivatsiya",
                "description": "Kichik g'alabalar, streak va yutuqlaringiz bilan bo'lishing.",
                "sort": 3,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_peer_support_reports_post_id"), table_name="peer_support_reports")
    op.drop_table("peer_support_reports")
    op.drop_index(op.f("ix_peer_support_posts_author_id"), table_name="peer_support_posts")
    op.drop_index(op.f("ix_peer_support_posts_room_id"), table_name="peer_support_posts")
    op.drop_table("peer_support_posts")
    op.drop_table("peer_support_rooms")
