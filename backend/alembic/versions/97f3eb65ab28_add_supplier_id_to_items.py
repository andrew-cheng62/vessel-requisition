"""add supplier_id to items

Revision ID: 97f3eb65ab28
Revises: ef7210c33ccf
Create Date: 2026-01-25 20:08:12.230361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97f3eb65ab28'
down_revision: Union[str, Sequence[str], None] = 'ef7210c33ccf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "items",
        sa.Column("supplier_id", sa.Integer(), nullable=True)
    )

    op.create_foreign_key(
        "fk_items_supplier_id_companies",
        "items",
        "companies",
        ["supplier_id"],
        ["id"],
    )

    pass


def downgrade() -> None:
    op.drop_constraint(
        "fk_items_supplier_id_companies",
        "items",
        type_="foreignkey"
    )

    op.drop_column("items", "supplier_id")
    pass
