"""alter requisitions table

Revision ID: 120fb0155172
Revises: 99d4f9a98b36
Create Date: 2026-01-28 18:36:08.100768

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '120fb0155172'
down_revision: Union[str, Sequence[str], None] = '99d4f9a98b36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("requisition_items", sa.Column("unit", sa.String()))
    op.add_column("requisition_items", sa.Column("received_qty", sa.Integer(), server_default="0"))
    pass


def downgrade() -> None:
    op.drop_column("requisition_items", sa.Column("unit")),
    op.drop_column("requisition_items", sa.Column("received_qty"))   
    pass
