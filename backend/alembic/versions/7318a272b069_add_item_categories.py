"""add item categories

Revision ID: 7318a272b069
Revises: 6a830f98213e
Create Date: 2026-02-06 16:12:01.548873

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7318a272b069'
down_revision: Union[str, Sequence[str], None] = '6a830f98213e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1️⃣ Create categories table
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
    )

    # 2️⃣ Insert default category
    op.execute(
        "INSERT INTO categories (name) VALUES ('Uncategorized')"
    )

    # 3️⃣ Add category_id column (TEMPORARILY nullable)
    op.add_column(
        "items",
        sa.Column("category_id", sa.Integer, nullable=True),
    )

    # 4️⃣ Assign default category to existing items
    op.execute("""
        UPDATE items
        SET category_id = (
            SELECT id FROM categories WHERE name = 'Uncategorized'
        )
    """)

    # 5️⃣ Add FK constraint
    op.create_foreign_key(
        "fk_items_category",
        source_table="items",
        referent_table="categories",
        local_cols=["category_id"],
        remote_cols=["id"],
        ondelete="RESTRICT"
    )

    # 6️⃣ Make category_id NOT NULL
    op.alter_column(
        "items",
        "category_id",
        nullable=False
    )

    # 7️⃣ Add index (filters will thank you later)
    op.create_index(
        "ix_items_category_id",
        "items",
        ["category_id"]
    )
    pass


def downgrade() -> None:
    op.drop_index("ix_items_category_id", table_name="items")
    op.drop_constraint("fk_items_category", "items", type_="foreignkey")
    op.drop_column("items", "category_id")
    op.drop_table("categories")
    pass
