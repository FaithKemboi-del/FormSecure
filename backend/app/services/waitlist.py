from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Event, NotificationType, TicketPhase, User, WaitlistEntry
from app.services.email import EmailError, normalize_email
from app.services.notifications import create_notification


class WaitlistError(Exception):
    pass


async def join_waitlist(
    session: AsyncSession,
    user: User,
    *,
    event_id: UUID,
    phase_id: UUID,
    max_budget: Decimal,
    email: str | None = None,
    notify_via_email: bool = True,
) -> tuple[WaitlistEntry, TicketPhase]:
    phase_result = await session.execute(
        select(TicketPhase)
        .where(TicketPhase.id == phase_id)
        .options(selectinload(TicketPhase.event))
    )
    phase = phase_result.scalar_one_or_none()
    if phase is None or phase.event_id != event_id:
        raise WaitlistError("Phase not found for this event.")

    if max_budget <= 0:
        raise WaitlistError("Max budget must be greater than zero.")

    normalized_email: str | None = None
    if email and email.strip():
        try:
            normalized_email = normalize_email(email)
        except EmailError as exc:
            raise WaitlistError(str(exc)) from exc
        user.email = normalized_email
    elif user.email:
        normalized_email = user.email

    if notify_via_email and not normalized_email:
        raise WaitlistError("Email is required to receive email alerts.")

    existing = await session.execute(
        select(WaitlistEntry).where(
            WaitlistEntry.user_id == user.id,
            WaitlistEntry.ticket_phase_id == phase.id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise WaitlistError("You are already on the waitlist for this phase.")

    entry = WaitlistEntry(
        id=uuid4(),
        user_id=user.id,
        ticket_phase_id=phase.id,
        max_budget=max_budget,
        contact_number=user.phone_number,
        email=normalized_email,
        notify_via_email=notify_via_email,
    )
    session.add(entry)
    await session.flush()

    await create_notification(
        session,
        user_id=user.id,
        notification_type=NotificationType.WAITLIST_CONFIRMED,
        title=f"Waitlist joined — {phase.event.title}",
        body=(
            f"You will be notified in the app"
            + (" and by email" if notify_via_email and normalized_email else "")
            + f" when a {phase.name} ticket drops at KSh {max_budget} or less."
        ),
        event_id=phase.event_id,
        email=normalized_email if notify_via_email else None,
        email_subject=f"FormSecure waitlist confirmed — {phase.event.title}",
        send_email_notification=notify_via_email and normalized_email is not None,
    )

    return entry, phase


async def list_my_waitlist(session: AsyncSession, user_id: UUID) -> list[WaitlistEntry]:
    result = await session.execute(
        select(WaitlistEntry)
        .where(WaitlistEntry.user_id == user_id)
        .options(
            selectinload(WaitlistEntry.ticket_phase).selectinload(TicketPhase.event),
        )
        .order_by(WaitlistEntry.created_at.desc())
    )
    return list(result.scalars().all())


async def leave_waitlist(session: AsyncSession, user_id: UUID, entry_id: UUID) -> None:
    result = await session.execute(
        select(WaitlistEntry).where(
            WaitlistEntry.id == entry_id,
            WaitlistEntry.user_id == user_id,
        )
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise WaitlistError("Waitlist entry not found.")
    await session.delete(entry)
    await session.flush()


async def notify_waitlist_for_new_listing(
    session: AsyncSession,
    *,
    listing_id: UUID,
    phase_id: UUID,
    event: Event,
    phase_name: str,
    asking_price: Decimal,
) -> None:
    result = await session.execute(
        select(WaitlistEntry)
        .where(
            WaitlistEntry.ticket_phase_id == phase_id,
            WaitlistEntry.max_budget >= asking_price,
        )
        .options(selectinload(WaitlistEntry.user))
    )
    entries = result.scalars().all()

    for entry in entries:
        email = entry.email or entry.user.email
        title = f"Ticket available — {event.title}"
        body = (
            f"A {phase_name} ticket for {event.title} is now listed at KSh {asking_price}. "
            f"Open FormSecure to buy before it is gone."
        )
        await create_notification(
            session,
            user_id=entry.user_id,
            notification_type=NotificationType.WAITLIST_MATCH,
            title=title,
            body=body,
            event_id=event.id,
            listing_id=listing_id,
            email=email if entry.notify_via_email else None,
            email_subject=title,
            send_email_notification=entry.notify_via_email and email is not None,
        )
