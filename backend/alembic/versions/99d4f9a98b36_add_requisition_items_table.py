"""add requisition_items table

Revision ID: 99d4f9a98b36
Revises: 314b6f649c3e
Create Date: 2026-01-28 16:51:49.534346

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99d4f9a98b36'
down_revision: Union[str, Sequence[str], None] = '314b6f649c3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "requisition_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("requisition_id", sa.Integer(), sa.ForeignKey("requisitions.id", ondelete="CASCADE")),
        sa.Column("item_id", sa.Integer(), sa.ForeignKey("items.id")),
        sa.Column("quantity", sa.Integer(), nullable=False),
    )
    pass


def downgrade() -> None:
    op.drop_table("requisition_items")
    pass
