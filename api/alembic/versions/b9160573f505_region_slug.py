"""region slug

Revision ID: b9160573f505
Revises: 4f29cbf4cf3d
Create Date: 2026-07-29 08:10:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b9160573f505'
down_revision: str | None = '4f29cbf4cf3d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# 03e7a29cd7f8'da bulk_insert qilingan 14 ta viloyat nomidan deterministik
# hosil qilingan slug'lar (courses/service.py'dagi slugify() bilan bir xil
# regex: [^a-z0-9]+ -> "-").
_SLUGS: dict[str, str] = {
    "Toshkent shahri": "toshkent-shahri",
    "Toshkent viloyati": "toshkent-viloyati",
    "Andijon viloyati": "andijon-viloyati",
    "Farg'ona viloyati": "farg-ona-viloyati",
    "Namangan viloyati": "namangan-viloyati",
    "Samarqand viloyati": "samarqand-viloyati",
    "Buxoro viloyati": "buxoro-viloyati",
    "Xorazm viloyati": "xorazm-viloyati",
    "Qashqadaryo viloyati": "qashqadaryo-viloyati",
    "Surxondaryo viloyati": "surxondaryo-viloyati",
    "Jizzax viloyati": "jizzax-viloyati",
    "Sirdaryo viloyati": "sirdaryo-viloyati",
    "Navoiy viloyati": "navoiy-viloyati",
    "Qoraqalpog'iston Respublikasi": "qoraqalpog-iston-respublikasi",
}


def upgrade() -> None:
    op.add_column("regions", sa.Column("slug", sa.String(length=140), nullable=True))
    regions = sa.table("regions", sa.column("name", sa.String), sa.column("slug", sa.String))
    for name, slug in _SLUGS.items():
        op.execute(
            regions.update().where(regions.c.name == name).values(slug=slug)
        )
    op.alter_column("regions", "slug", nullable=False)
    op.create_unique_constraint("uq_regions_slug", "regions", ["slug"])
    op.create_index("ix_regions_slug", "regions", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_regions_slug", table_name="regions")
    op.drop_constraint("uq_regions_slug", "regions", type_="unique")
    op.drop_column("regions", "slug")
