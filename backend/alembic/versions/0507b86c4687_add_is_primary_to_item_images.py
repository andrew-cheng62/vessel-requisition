"""add is_primary to item_images

Revision ID: 0507b86c4687
Revises: 71a350296a77
Create Date: 2026-01-13 22:48:52.070120

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0507b86c4687'
down_revision: Union[str, Sequence[str], None] = '71a350296a77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'item_images',
        sa.Column('is_primary', sa.Boolean(), server_default='false', nullable=False)
    )
def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('item_images', 'is_primary')
