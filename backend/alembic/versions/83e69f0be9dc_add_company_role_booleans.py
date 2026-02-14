"""add company role booleans

Revision ID: 83e69f0be9dc
Revises: 97f3eb65ab28
Create Date: 2026-01-26 23:39:20.546477

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83e69f0be9dc'
down_revision: Union[str, Sequence[str], None] = '97f3eb65ab28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("is_manufacturer", sa.Boolean(), server_default="false"))
    op.add_column("companies", sa.Column("is_supplier", sa.Boolean(), server_default="false"))
    pass


def downgrade() -> None:
    op.drop_column("companies", "is_supplier")
    op.drop_column("companies", "is_manufacturer")
    pass
