"""destination cta_label

Revision ID: d9e4f2a1b7c8
Revises: c8d3e2f1a5b6
Create Date: 2026-08-06 13:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'd9e4f2a1b7c8'
down_revision: Union[str, None] = 'c8d3e2f1a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'destination',
        sa.Column(
            'cta_label',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default='',
        ),
    )


def downgrade() -> None:
    op.drop_column('destination', 'cta_label')
