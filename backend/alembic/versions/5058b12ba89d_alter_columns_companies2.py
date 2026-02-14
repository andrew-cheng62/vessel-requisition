"""alter columns companies2

Revision ID: 5058b12ba89d
Revises: 908774ebeae4
Create Date: 2026-02-09 12:43:18.872104

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5058b12ba89d'
down_revision: Union[str, Sequence[str], None] = '908774ebeae4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
    "Companies",
    sa.Column("contact_person", "website", nullable=True),
)
    op.alter_column(
    "Companies",
    sa.Column("role", "logo_path", nullable=True),
)
    pass


def downgrade() -> None:
    op.alter_column(
    "Companies",
    sa.Column("website", "contact_person", nullable=True),
)
    op.alter_column(
    "Companies",
    sa.Column("logo_path", "role", nullable=True),
)
    pass
