"""Add tags table and item_tags join table

Revision ID: d32be4fa6c6d
Revises: 34b0085b7278
Create Date: 2026-02-27 12:34:53.982641

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd32be4fa6c6d'
down_revision: Union[str, Sequence[str], None] = '34b0085b7278'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False, unique=True),
        sa.Column('slug', sa.String(50), nullable=False, unique=True),
        sa.Column('color', sa.String(7), nullable=False, server_default='#6b7280'),
    )

    op.create_table(
        'item_tags',
        sa.Column('item_id', sa.Integer(), sa.ForeignKey('items.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('tag_id', sa.Integer(), sa.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
    )

    # Seed a few useful default tags
    op.execute("""
        INSERT INTO tags (name, slug, color) VALUES
        ('Consumable', 'consumable', '#10b981'),
        ('Spare Part', 'spare-part', '#3b82f6'),
        ('Critical', 'critical', '#ef4444'),
        ('Hazmat', 'hazmat', '#f59e0b'),
        ('Safety', 'safety', '#8b5cf6')
    """)

    pass


def downgrade() -> None:
    op.drop_table('item_tags')
    op.drop_table('tags')

    pass
