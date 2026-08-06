"""restaurant content type

Revision ID: e1f5a3c9d2b4
Revises: d9e4f2a1b7c8
Create Date: 2026-08-06 14:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'e1f5a3c9d2b4'
down_revision: Union[str, None] = 'd9e4f2a1b7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'restaurant',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('cuisine', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('short_description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('image', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('gallery', sa.JSON(), nullable=True),
        sa.Column('price_range', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('hours', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('address', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('contact_phone', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('contact_website', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('menu_url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('booking_url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('amenities', sa.JSON(), nullable=True),
        sa.Column('featured', sa.Boolean(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_restaurant_tenant_id'), 'restaurant', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_restaurant_slug'), 'restaurant', ['slug'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_restaurant_slug'), table_name='restaurant')
    op.drop_index(op.f('ix_restaurant_tenant_id'), table_name='restaurant')
    op.drop_table('restaurant')
