"""Add user email, waitlist email prefs, and notifications

Revision ID: e4f8a2c1b903
Revises: dd1295b6fe9b
Create Date: 2026-07-04 10:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e4f8a2c1b903'
down_revision: Union[str, Sequence[str], None] = 'dd1295b6fe9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email', sa.String(length=254), nullable=True))
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)

    op.add_column('waitlist_entries', sa.Column('email', sa.String(length=254), nullable=True))
    op.add_column(
        'waitlist_entries',
        sa.Column('notify_via_email', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column('waitlist_entries', 'notify_via_email', server_default=None)

    op.create_table(
        'notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column(
            'notification_type',
            sa.Enum('WAITLIST_MATCH', 'WAITLIST_CONFIRMED', name='notification_type'),
            nullable=False,
        ),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('body', sa.String(length=1000), nullable=False),
        sa.Column('event_id', sa.UUID(), nullable=True),
        sa.Column('listing_id', sa.UUID(), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], name=op.f('fk_notifications_event_id_events'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['listing_id'], ['listings.id'], name=op.f('fk_notifications_listing_id_listings'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_notifications_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_notifications')),
    )
    op.create_index(op.f('ix_notifications_event_id'), 'notifications', ['event_id'], unique=False)
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_notification_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_event_id'), table_name='notifications')
    op.drop_table('notifications')
    op.execute('DROP TYPE IF EXISTS notification_type')

    op.drop_column('waitlist_entries', 'notify_via_email')
    op.drop_column('waitlist_entries', 'email')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_column('users', 'email')
