"""drop unit requisition_items

Revision ID: df033372255e
Revises: b1baccaf13f8
Create Date: 2026-02-01 22:09:21.424123

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df033372255e'
down_revision: Union[str, Sequence[str], None] = 'b1baccaf13f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("requisition_items", "unit")
    pass


def downgrade() -> None:
    op.add_column("requisition_items", sa.Column("unit", sa.String()))
    pass
