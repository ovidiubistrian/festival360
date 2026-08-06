"""tenant email settings (marketing SMTP)

Revision ID: a3c7e9f1b2d5
Revises: f2a6b4c8d1e3
Create Date: 2026-08-06 16:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a3c7e9f1b2d5'
down_revision: Union[str, None] = 'f2a6b4c8d1e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tenant_email_settings',
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('smtp_host', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('smtp_port', sa.Integer(), nullable=False),
        sa.Column('smtp_user', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('smtp_password_encrypted', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('from_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('from_email', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('use_tls', sa.Boolean(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('tenant_id'),
    )


def downgrade() -> None:
    op.drop_table('tenant_email_settings')
