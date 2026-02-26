"""vessel_item table, username unique per vessel, remove vessel_id from items

Revision ID: d01228942122
Revises: 980cc5099d70
Create Date: 2026-02-25 20:06:34.806350

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd01228942122'
down_revision: Union[str, Sequence[str], None] = '980cc5099d70'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Remove vessel_id from items — items are now global
    op.drop_constraint('fk_items_vessel', 'items', type_='foreignkey')
    op.drop_column('items', 'vessel_id')

    # 2. Create vessel_items override table
    op.create_table(
        'vessel_items',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('vessel_id', sa.Integer(), sa.ForeignKey('vessels.id', ondelete='CASCADE'), nullable=False),
        sa.Column('item_id', sa.Integer(), sa.ForeignKey('items.id', ondelete='CASCADE'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.UniqueConstraint('vessel_id', 'item_id', name='uq_vessel_item'),
    )

    # 3. Drop global unique constraint on username, add per-vessel unique constraint
    op.drop_constraint('users_username_key', 'users', type_='unique')
    op.create_unique_constraint('uq_username_per_vessel', 'users', ['username', 'vessel_id'])

    pass


def downgrade() -> None:
    op.drop_constraint('uq_username_per_vessel', 'users', type_='unique')
    op.create_unique_constraint('users_username_key', 'users', ['username'])
    op.drop_table('vessel_items')
    op.add_column('items', sa.Column('vessel_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_items_vessel', 'items', 'vessels', ['vessel_id'], ['id'], ondelete='CASCADE')

    pass
