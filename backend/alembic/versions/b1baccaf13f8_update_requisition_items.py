"""update requisition_items

Revision ID: b1baccaf13f8
Revises: 86cba1907584
Create Date: 2026-01-31 16:02:42.844499

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1baccaf13f8'
down_revision: Union[str, Sequence[str], None] = '86cba1907584'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "requisition_items",
        sa.Column("supplier_id", sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        "requisition_items_supplier_id_fkey",
        "requisition_items",
        "companies",
        ["supplier_id"],
        ["id"],
    )
    pass


def downgrade() -> None:
    op.drop_constraint("requisition_items_supplier_id_fkey", "requisition_items", type_="foreignkey")
    op.drop_column("requisition_items", "supplier_id")
    pass
