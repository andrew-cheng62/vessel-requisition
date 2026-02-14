"""add column catalogue_nr to items

Revision ID: a67fcd9aef83
Revises: 0507b86c4687
Create Date: 2026-01-13 23:11:57.301053

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a67fcd9aef83'
down_revision: Union[str, Sequence[str], None] = '0507b86c4687'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'items',
        sa.Column('catalogue_nr', sa.String(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('items', 'catalogue_nr')
