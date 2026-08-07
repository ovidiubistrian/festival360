"""newsletter subscriber: nume (import CSV nume + email)

Revision ID: b9c4e7d2f8a1
Revises: a2f8c1d4b6e9
Create Date: 2026-08-07 20:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b9c4e7d2f8a1'
down_revision: Union[str, None] = 'a2f8c1d4b6e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'newsletter_subscriber',
        sa.Column(
            'name',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default='',
        ),
    )


def downgrade() -> None:
    op.drop_column('newsletter_subscriber', 'name')
