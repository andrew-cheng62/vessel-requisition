"""fix requisition_items foreign keys

Revision ID: 168346ef1be6
Revises: 120fb0155172
Create Date: 2026-01-28 23:13:28.902394

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '168346ef1be6'
down_revision: Union[str, Sequence[str], None] = '120fb0155172'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # DROP old foreign keys (names MUST match DB)
    op.drop_constraint(
        "requisition_items_item_id_fkey",
        "requisition_items",
        type_="foreignkey",
    )

    op.drop_constraint(
        "requisition_items_requisition_id_fkey",
        "requisition_items",
        type_="foreignkey",
    )

    # CREATE correct foreign keys
    op.create_foreign_key(
        "fk_reqitem_item",
        "requisition_items",
        "items",
        ["item_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.create_foreign_key(
        "fk_reqitem_requisition",
        "requisition_items",
        "requisitions",
        ["requisition_id"],
        ["id"],
        ondelete="CASCADE",
    )
    pass


def downgrade() -> None:
    op.drop_constraint("fk_reqitem_item", "requisition_items", type_="foreignkey")
    op.drop_constraint("fk_reqitem_requisition", "requisition_items", type_="foreignkey")
    pass
