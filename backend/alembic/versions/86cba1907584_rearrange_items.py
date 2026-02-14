"""rearrange items

Revision ID: 86cba1907584
Revises: 666e0e382aff
Create Date: 2026-01-31 12:48:54.238374

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '86cba1907584'
down_revision: Union[str, Sequence[str], None] = '666e0e382aff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("items", sa.Column("unit", sa.String(), nullable=False, server_default="pcs"))
    op.drop_column("items", "supplier_id")
    pass


def downgrade() -> None:
    op.drop_column("items", sa.Column("unit"))
    op.add_column("items", sa.Column("supplier_id", sa.Integer(), nullable=True))

    pass
