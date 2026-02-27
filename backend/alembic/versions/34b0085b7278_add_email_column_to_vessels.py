"""add email column to vessels

Revision ID: 34b0085b7278
Revises: d01228942122
Create Date: 2026-02-26 16:54:00.276359

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34b0085b7278'
down_revision: Union[str, Sequence[str], None] = 'd01228942122'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('vessels', sa.Column('email', sa.String(100), nullable=True))
    pass


def downgrade() -> None:
    op.drop_column('vessels', 'email')
    pass
