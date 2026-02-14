"""add notes to requisitions table

Revision ID: 666e0e382aff
Revises: 168346ef1be6
Create Date: 2026-01-29 23:08:54.553966

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '666e0e382aff'
down_revision: Union[str, Sequence[str], None] = '168346ef1be6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'requisitions',
        sa.Column('notes', sa.Text()))
    pass


def downgrade() -> None:
    op.drop_column('requisitions', 'notes')
    pass
