"""form builder: definitions, submissions + tenant organisation block

Revision ID: a2f8c1d4b6e9
Revises: d6f9b2e4a1c8
Create Date: 2026-08-07 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a2f8c1d4b6e9'
down_revision: Union[str, None] = 'd6f9b2e4a1c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tenant',
        sa.Column(
            'organization', sa.JSON(), nullable=False, server_default=sa.text("'{}'")
        ),
    )

    op.create_table(
        'form_definition',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('fields', sa.JSON(), nullable=True),
        sa.Column('submit_label', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('success_message', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('notify_email', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('show_organization', sa.Boolean(), nullable=False),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_form_definition_tenant_id'), 'form_definition', ['tenant_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_form_definition_slug'), 'form_definition', ['slug'], unique=False
    )

    op.create_table(
        'form_submission',
        sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tenant_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('form_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('form_title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=True),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('summary', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('email', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.ForeignKeyConstraint(['form_id'], ['form_definition.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_form_submission_tenant_id'), 'form_submission', ['tenant_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_form_submission_form_id'), 'form_submission', ['form_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_form_submission_form_id'), table_name='form_submission')
    op.drop_index(op.f('ix_form_submission_tenant_id'), table_name='form_submission')
    op.drop_table('form_submission')
    op.drop_index(op.f('ix_form_definition_slug'), table_name='form_definition')
    op.drop_index(op.f('ix_form_definition_tenant_id'), table_name='form_definition')
    op.drop_table('form_definition')
    op.drop_column('tenant', 'organization')
