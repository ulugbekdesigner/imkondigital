"""fix placeholder company name

Revision ID: 01bcad55b844
Revises: 1d75bb63419c
Create Date: 2026-08-09 19:03:47.308521
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '01bcad55b844'
down_revision: str | None = '1d75bb63419c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# QA_AUDIT D2: "555" - demo ma'lumotida qolib ketgan taqdimotga yaroqsiz nom
# (haqiqiy ish beruvchi emas, ustidan yozilishi xavfsiz - CONTRIBUTING.md
# ma'lumotlar migratsiyasi qoidasi: faqat aniq, qaytariladigan UPDATE).
_OLD_NAME = "555"
_NEW_NAME = "Alfa Media Studio"


def upgrade() -> None:
    op.execute(
        sa.text("UPDATE companies SET name = :new_name WHERE name = :old_name").bindparams(
            new_name=_NEW_NAME, old_name=_OLD_NAME
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text("UPDATE companies SET name = :old_name WHERE name = :new_name").bindparams(
            old_name=_OLD_NAME, new_name=_NEW_NAME
        )
    )
