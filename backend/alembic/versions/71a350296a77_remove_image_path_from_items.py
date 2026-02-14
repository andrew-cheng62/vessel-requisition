"""remove image_path from items

Revision ID: 71a350296a77
Revises: 364d140175bf
Create Date: 2026-01-13 22:08:27.878287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71a350296a77'
down_revision: Union[str, Sequence[str], None] = '364d140175bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('items', 'image_path')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        'items',
        sa.Column('image_path', sa.String(), nullable=True)
    )
