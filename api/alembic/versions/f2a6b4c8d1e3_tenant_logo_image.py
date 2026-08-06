"""tenant logo_image

Revision ID: f2a6b4c8d1e3
Revises: e1f5a3c9d2b4
Create Date: 2026-08-06 15:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f2a6b4c8d1e3'
down_revision: Union[str, None] = 'e1f5a3c9d2b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tenant',
        sa.Column(
            'logo_image',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default='',
        ),
    )


def downgrade() -> None:
    op.drop_column('tenant', 'logo_image')
