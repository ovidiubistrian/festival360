"""tenant_event content type

Revision ID: c4e7a9b1d3f6
Revises: b5d8f3a2c6e7
Create Date: 2026-08-06 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c4e7a9b1d3f6'
down_revision: Union[str, None] = 'b5d8f3a2c6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tenant_event',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('cover_image', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('gallery', sa.JSON(), nullable=True),
        sa.Column('short_description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('time_label', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('location', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('program', sa.JSON(), nullable=True),
        sa.Column('ticket_url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('ticket_label', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('featured', sa.Boolean(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tenant_event_tenant_id'), 'tenant_event', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_tenant_event_slug'), 'tenant_event', ['slug'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tenant_event_slug'), table_name='tenant_event')
    op.drop_index(op.f('ix_tenant_event_tenant_id'), table_name='tenant_event')
    op.drop_table('tenant_event')
