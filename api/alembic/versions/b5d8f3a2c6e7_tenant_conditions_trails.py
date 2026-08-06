"""tenant conditions + trails widgets

Revision ID: b5d8f3a2c6e7
Revises: a3c7e9f1b2d5
Create Date: 2026-08-06 17:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5d8f3a2c6e7'
down_revision: Union[str, None] = 'a3c7e9f1b2d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tenant',
        sa.Column('conditions', sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.add_column(
        'tenant',
        sa.Column('trails', sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )


def downgrade() -> None:
    op.drop_column('tenant', 'trails')
    op.drop_column('tenant', 'conditions')
