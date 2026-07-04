from uuid import UUID, uuid4

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification, NotificationType
from app.services.email import send_email


async def create_notification(
    session: AsyncSession,
    *,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    body: str,
    event_id: UUID | None = None,
    listing_id: UUID | None = None,
    email: str | None = None,
    email_subject: str | None = None,
    send_email_notification: bool = False,
) -> Notification:
    notification = Notification(
        id=uuid4(),
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        body=body,
        event_id=event_id,
        listing_id=listing_id,
    )
    session.add(notification)
    await session.flush()

    if send_email_notification and email:
        await send_email(
            email,
            email_subject or title,
            body,
        )

    return notification


async def list_notifications(
    session: AsyncSession,
    user_id: UUID,
    *,
    unread_only: bool = False,
    limit: int = 50,
) -> list[Notification]:
    query = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    if unread_only:
        query = query.where(Notification.read_at.is_(None))

    result = await session.execute(query)
    return list(result.scalars().all())


async def count_unread_notifications(session: AsyncSession, user_id: UUID) -> int:
    result = await session.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
    )
    return result.scalar_one()


async def mark_notification_read(
    session: AsyncSession,
    user_id: UUID,
    notification_id: UUID,
) -> Notification | None:
    result = await session.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    notification = result.scalar_one_or_none()
    if notification is None:
        return None

    from datetime import UTC, datetime

    notification.read_at = datetime.now(UTC)
    await session.flush()
    return notification


async def mark_all_notifications_read(session: AsyncSession, user_id: UUID) -> int:
    from datetime import UTC, datetime

    now = datetime.now(UTC)
    result = await session.execute(
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
        )
        .values(read_at=now)
    )
    return result.rowcount or 0
