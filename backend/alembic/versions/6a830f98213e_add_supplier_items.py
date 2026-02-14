"""add supplier items

Revision ID: 6a830f98213e
Revises: df033372255e
Create Date: 2026-02-05 15:35:44.990781

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a830f98213e'
down_revision: Union[str, Sequence[str], None] = 'df033372255e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
      "items",
      sa.Column("supplier_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
      "fk_items_supplier",
      "items",
      "companies",
      ["supplier_id"],
      ["id"],
)
    pass


def downgrade() -> None:
    op.drop_constraint('fk_items_supplier', 'items'),
    op.drop_column('items', 'supplier_id')
    pass
