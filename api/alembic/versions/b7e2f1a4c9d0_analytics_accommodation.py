"""analytics page_view + accommodation

Revision ID: b7e2f1a4c9d0
Revises: e7dd751f35dd
Create Date: 2026-08-06 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b7e2f1a4c9d0'
down_revision: Union[str, None] = 'e7dd751f35dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Cookieless, IP-anonymised page views ---
    op.create_table(
        'page_view',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('path', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('referrer_host', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('country', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('country_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('city', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('region', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('device', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('browser', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('os', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('visitor_hash', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_page_view_tenant_id'), 'page_view', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_page_view_visitor_hash'), 'page_view', ['visitor_hash'], unique=False)
    op.create_index(op.f('ix_page_view_day'), 'page_view', ['day'], unique=False)
    op.create_index(op.f('ix_page_view_created_at'), 'page_view', ['created_at'], unique=False)

    # --- Accommodations (cazări) content type ---
    op.create_table(
        'accommodation',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('short_description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('image', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('gallery', sa.JSON(), nullable=True),
        sa.Column('price_from', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('rooms', sa.Integer(), nullable=False),
        sa.Column('amenities', sa.JSON(), nullable=True),
        sa.Column('address', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('contact_phone', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('contact_website', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('booking_url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('featured', sa.Boolean(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_accommodation_tenant_id'), 'accommodation', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_accommodation_slug'), 'accommodation', ['slug'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_accommodation_slug'), table_name='accommodation')
    op.drop_index(op.f('ix_accommodation_tenant_id'), table_name='accommodation')
    op.drop_table('accommodation')
    op.drop_index(op.f('ix_page_view_created_at'), table_name='page_view')
    op.drop_index(op.f('ix_page_view_day'), table_name='page_view')
    op.drop_index(op.f('ix_page_view_visitor_hash'), table_name='page_view')
    op.drop_index(op.f('ix_page_view_tenant_id'), table_name='page_view')
    op.drop_table('page_view')
