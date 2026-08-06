"""tenant about images

Revision ID: c8d3e2f1a5b6
Revises: b7e2f1a4c9d0
Create Date: 2026-08-06 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c8d3e2f1a5b6'
down_revision: Union[str, None] = 'b7e2f1a4c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tenant',
        sa.Column(
            'about_image',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default='',
        ),
    )
    op.add_column(
        'tenant',
        sa.Column(
            'about_image_2',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default='',
        ),
    )


def downgrade() -> None:
    op.drop_column('tenant', 'about_image_2')
    op.drop_column('tenant', 'about_image')
