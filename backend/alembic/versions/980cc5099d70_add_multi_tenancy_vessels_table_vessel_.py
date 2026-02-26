"""add multi-tenancy: vessels table, vessel_id on users/items/requisitions

Revision ID: 980cc5099d70
Revises: a8796b6cea56
Create Date: 2026-02-25 15:52:21.744670

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '980cc5099d70'
down_revision: Union[str, Sequence[str], None] = 'a8796b6cea56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create vessels table
    op.create_table(
        'vessels',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('imo_number', sa.String(20), unique=True, nullable=True),
        sa.Column('flag', sa.String(50), nullable=True),
        sa.Column('vessel_type', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # 2. Create a default vessel for existing data
    op.execute("""
        INSERT INTO vessels (name, is_active, created_at)
        VALUES ('Default Vessel', true, now())
    """)

    # 3. Add vessel_id to users (nullable first, then backfill, then constrain)
    op.add_column('users', sa.Column('vessel_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.execute("UPDATE users SET vessel_id = (SELECT id FROM vessels LIMIT 1) WHERE role != 'super_admin'")
    op.create_foreign_key('fk_users_vessel', 'users', 'vessels', ['vessel_id'], ['id'], ondelete='CASCADE')

    # 4. Add vessel_id to items
    op.add_column('items', sa.Column('vessel_id', sa.Integer(), nullable=True))
    op.execute("UPDATE items SET vessel_id = (SELECT id FROM vessels LIMIT 1)")
    op.alter_column('items', 'vessel_id', nullable=False)
    op.create_foreign_key('fk_items_vessel', 'items', 'vessels', ['vessel_id'], ['id'], ondelete='CASCADE')

    # 5. Add vessel_id to requisitions
    op.add_column('requisitions', sa.Column('vessel_id', sa.Integer(), nullable=True))
    op.execute("UPDATE requisitions SET vessel_id = (SELECT id FROM vessels LIMIT 1)")
    op.alter_column('requisitions', 'vessel_id', nullable=False)
    op.create_foreign_key('fk_requisitions_vessel', 'requisitions', 'vessels', ['vessel_id'], ['id'],     ondelete='CASCADE')

    pass


def downgrade() -> None:
    op.drop_constraint('fk_requisitions_vessel', 'requisitions', type_='foreignkey')
    op.drop_column('requisitions', 'vessel_id')
    op.drop_constraint('fk_items_vessel', 'items', type_='foreignkey')
    op.drop_column('items', 'vessel_id')
    op.drop_constraint('fk_users_vessel', 'users', type_='foreignkey')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'vessel_id')
    op.drop_table('vessels')

    pass
