"""primary image make unique

Revision ID: fb1b75597610
Revises: a67fcd9aef83
Create Date: 2026-01-14 14:16:08.722496

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fb1b75597610'
down_revision: Union[str, Sequence[str], None] = 'a67fcd9aef83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        "uq_item_primary_image",
        "item_images",
        ["item_id"],
        unique=True,
        postgresql_where=sa.text("is_primary = true"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("uq_item_primary_image", table_name="item_images")
