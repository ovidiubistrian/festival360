"""tenant seo controls

Revision ID: d6f9b2e4a1c8
Revises: c4e7a9b1d3f6
Create Date: 2026-08-06 19:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6f9b2e4a1c8'
down_revision: Union[str, None] = 'c4e7a9b1d3f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tenant',
        sa.Column('seo', sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )


def downgrade() -> None:
    op.drop_column('tenant', 'seo')
