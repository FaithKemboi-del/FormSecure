"""Add manual verification, blacklist, and escrow mpesa fields

Revision ID: f7a2b8c4d901
Revises: e4f8a2c1b903
Create Date: 2026-07-04 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f7a2b8c4d901'
down_revision: Union[str, Sequence[str], None] = 'e4f8a2c1b903'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    verification_status = sa.Enum(
        'PENDING', 'VERIFIED', 'NEEDS_MORE_INFO', 'REJECTED',
        name='verification_status',
    )
    verification_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'users',
        sa.Column(
            'verification_status',
            verification_status,
            nullable=False,
            server_default='PENDING',
        ),
    )
    op.create_index(op.f('ix_users_verification_status'), 'users', ['verification_status'], unique=False)
    op.add_column('users', sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('users', sa.Column('blocked_reason', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('verification_notes', sa.String(length=1000), nullable=True))
    op.add_column('users', sa.Column('terms_accepted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('mpesa_registered_name', sa.String(length=200), nullable=True))
    op.alter_column('users', 'is_blocked', server_default=None)
    op.alter_column('users', 'verification_status', server_default=None)

    op.execute("UPDATE users SET verification_status = 'VERIFIED', is_verified = true WHERE is_verified = true")

    op.add_column('escrow_transactions', sa.Column('mpesa_checkout_request_id', sa.String(length=100), nullable=True))
    op.add_column('escrow_transactions', sa.Column('mpesa_receipt_number', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('escrow_transactions', 'mpesa_receipt_number')
    op.drop_column('escrow_transactions', 'mpesa_checkout_request_id')

    op.drop_column('users', 'mpesa_registered_name')
    op.drop_column('users', 'terms_accepted_at')
    op.drop_column('users', 'verification_notes')
    op.drop_column('users', 'blocked_reason')
    op.drop_column('users', 'is_blocked')
    op.drop_index(op.f('ix_users_verification_status'), table_name='users')
    op.drop_column('users', 'verification_status')
    op.execute('DROP TYPE IF EXISTS verification_status')
