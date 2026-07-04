import logging
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, TicketPhase, TicketPhaseStatus
from app.services.pricing import resolve_gate_value

logger = logging.getLogger(__name__)

SOURCE_SITE = "formsecure-seed"

SAMPLE_EVENTS = [
    {
        "external_event_id": "watendawili-live",
        "title": "Watendawili Live",
        "venue": "KICC Amphitheatre",
        "location": "Nairobi",
        "event_date": datetime(2026, 7, 12, 16, 0, tzinfo=UTC),
        "phases": [
            ("Phase 1 (Early Bird)", "phase-1", Decimal("1500.00"), 0),
            ("Phase 2 (Main Wave)", "phase-2", Decimal("2500.00"), 1),
            ("Die-Hard (Final / VIP)", "die-hard", Decimal("4000.00"), 2, TicketPhaseStatus.SOLD_OUT),
        ],
    },
    {
        "external_event_id": "blankets-and-wine",
        "title": "Blankets & Wine",
        "venue": "Ngong Racecourse",
        "location": "Nairobi",
        "event_date": datetime(2026, 7, 20, 9, 0, tzinfo=UTC),
        "phases": [
            ("Phase 1 (Early Bird)", "phase-1", Decimal("1800.00"), 0, TicketPhaseStatus.SOLD_OUT),
            ("Phase 2 (Main Wave)", "phase-2", Decimal("2800.00"), 1, TicketPhaseStatus.SOLD_OUT),
            ("Die-Hard (Final / VIP)", "die-hard", Decimal("4500.00"), 2, TicketPhaseStatus.SOLD_OUT),
        ],
    },
    {
        "external_event_id": "sauti-sol-homecoming",
        "title": "Sauti Sol Homecoming",
        "venue": "Carnivore Grounds",
        "location": "Nairobi",
        "event_date": datetime(2026, 8, 2, 15, 0, tzinfo=UTC),
        "phases": [
            ("Phase 1 (Early Bird)", "phase-1", Decimal("2000.00"), 0),
            ("Phase 2 (Main Wave)", "phase-2", Decimal("3500.00"), 1),
            ("Die-Hard (Final / VIP)", "die-hard", Decimal("6000.00"), 2),
        ],
    },
]


async def seed_sample_events(session: AsyncSession) -> None:
    created = 0
    for sample in SAMPLE_EVENTS:
        existing = await session.execute(
            select(Event).where(
                Event.source_site == SOURCE_SITE,
                Event.external_event_id == sample["external_event_id"],
            )
        )
        if existing.scalar_one_or_none() is not None:
            continue

        event = Event(
            id=uuid4(),
            title=sample["title"],
            venue=sample["venue"],
            location=sample["location"],
            event_date=sample["event_date"],
            source_site=SOURCE_SITE,
            external_event_id=sample["external_event_id"],
        )
        session.add(event)
        await session.flush()

        for phase_data in sample["phases"]:
            name, slug, face_value, sort_order = phase_data[:4]
            status = phase_data[4] if len(phase_data) > 4 else TicketPhaseStatus.AVAILABLE
            session.add(
                TicketPhase(
                    id=uuid4(),
                    event_id=event.id,
                    name=name,
                    slug=slug,
                    face_value=face_value,
                    estimated_gate_value=resolve_gate_value(face_value, None),
                    status=status,
                    sort_order=sort_order,
                )
            )
        created += 1

    if created:
        await session.commit()
        logger.info("Seeded %s sample events for local development.", created)
    else:
        await session.rollback()
