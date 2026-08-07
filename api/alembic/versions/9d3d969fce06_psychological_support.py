"""psychological support

Revision ID: 9d3d969fce06
Revises: c8cba54ede1e
Create Date: 2026-07-29 11:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '9d3d969fce06'
down_revision: str | None = 'c8cba54ede1e'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "support_contents",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("topic", sa.String(length=100), nullable=False),
        sa.Column("body_text", sa.Text(), nullable=False),
        sa.Column("media_url", sa.String(length=512), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="draft"),
        sa.Column("created_by", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "support_resources",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=16), nullable=False, server_default="hotline"),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("url", sa.String(length=512), nullable=True),
        sa.Column("audience_note", sa.String(length=200), nullable=True),
        sa.Column("is_free", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="draft"),
        sa.Column("created_by", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Faqat HAQIQATAN tekshirilgan, tasdiqlangan manbalar (2026-07-29'da qidiruv
    # orqali tekshirilgan) — o'ylab topilgan/taxminiy raqam YO'Q (CONTRIBUTING.md 2-qoida).
    # Admin panel orqali ko'proq (hamkor psixologlar va h.k.) qo'shilishi kutiladi.
    resources = sa.table(
        "support_resources",
        sa.column("name", sa.String),
        sa.column("category", sa.String),
        sa.column("description", sa.Text),
        sa.column("phone", sa.String),
        sa.column("audience_note", sa.String),
        sa.column("is_free", sa.Boolean),
        sa.column("sort", sa.Integer),
        sa.column("status", sa.String),
    )
    op.bulk_insert(
        resources,
        [
            {
                "name": "Tez tibbiy yordam",
                "category": "hotline",
                "description": (
                    "Shoshilinch tibbiy yordam kerak bo'lganda — jumladan o'z joniga "
                    "qasd qilish xavfi yoki og'ir ruhiy holat kabi shoshilinch "
                    "vaziyatlarda ham qo'ng'iroq qiling."
                ),
                "phone": "103",
                "audience_note": None,
                "is_free": True,
                "sort": 0,
                "status": "published",
            },
            {
                "name": "Ayollar uchun ishonch telefoni",
                "category": "hotline",
                "description": (
                    "Bosim va zo'ravonlik holatlarida ijtimoiy, psixologik va "
                    "huquqiy maslahat beriladi."
                ),
                "phone": "1146",
                "audience_note": "Ayollar uchun",
                "is_free": True,
                "sort": 1,
                "status": "published",
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("support_resources")
    op.drop_table("support_contents")
