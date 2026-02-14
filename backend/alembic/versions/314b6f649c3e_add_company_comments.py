"""add company comments

Revision ID: 314b6f649c3e
Revises: 83e69f0be9dc
Create Date: 2026-01-28 13:37:36.640436

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '314b6f649c3e'
down_revision: Union[str, Sequence[str], None] = '83e69f0be9dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("comments", sa.String()))
    pass


def downgrade() -> None:
    op.drop_column("companies", "comments")
    pass
