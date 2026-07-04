import logging
import re
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, ScraperSource, TicketPhase, TicketPhaseStatus
from app.services.pricing import resolve_gate_value
from app.services.scraper.parsers import scrape_site_events
from app.services.scraper.types import ScrapedEvent

logger = logging.getLogger(__name__)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or "phase"


async def ingest_scraped_events(session: AsyncSession) -> None:
    result = await session.execute(
        select(ScraperSource).where(ScraperSource.is_currently_approved.is_(True))
    )
    approved_sources = result.scalars().all()

    if not approved_sources:
        logger.info("No approved scraper sources — skipping nightly ingestion.")
        return

    created_events = 0
    updated_phases = 0

    for source in approved_sources:
        if not source.is_currently_approved:
            logger.info("Skipping %s — not approved.", source.site_name)
            continue

        scraped_events = await scrape_site_events(source.site_name, source.base_url)
        for scraped in scraped_events:
            created, phases = await _upsert_event(session, source.site_name, scraped)
            if created:
                created_events += 1
            updated_phases += phases

    await session.commit()
    logger.info(
        "Scraper ingestion finished: %s new events, %s phase upserts",
        created_events,
        updated_phases,
    )


async def _upsert_event(
    session: AsyncSession,
    source_site: str,
    scraped: ScrapedEvent,
) -> tuple[bool, int]:
    existing = await session.execute(
        select(Event).where(
            Event.source_site == source_site,
            Event.external_event_id == scraped.external_event_id,
        )
    )
    event = existing.scalar_one_or_none()
    created = False

    if event is None:
        event = Event(
            id=uuid4(),
            title=scraped.title,
            venue=scraped.venue,
            location=scraped.location,
            event_date=scraped.event_date,
            image_url=scraped.image_url,
            source_site=source_site,
            external_event_id=scraped.external_event_id,
        )
        session.add(event)
        await session.flush()
        created = True

    phase_upserts = 0
    for scraped_phase in scraped.phases:
        phase_result = await session.execute(
            select(TicketPhase).where(
                TicketPhase.event_id == event.id,
                TicketPhase.slug == scraped_phase.slug,
            )
        )
        phase = phase_result.scalar_one_or_none()
        gate = resolve_gate_value(scraped_phase.face_value, None)

        if phase is None:
            session.add(
                TicketPhase(
                    id=uuid4(),
                    event_id=event.id,
                    name=scraped_phase.name,
                    slug=scraped_phase.slug,
                    face_value=scraped_phase.face_value,
                    estimated_gate_value=gate,
                    status=TicketPhaseStatus.AVAILABLE,
                    sort_order=scraped_phase.sort_order,
                )
            )
            phase_upserts += 1
        else:
            phase.face_value = scraped_phase.face_value
            phase.estimated_gate_value = gate
            phase.name = scraped_phase.name
            phase_upserts += 1

    return created, phase_upserts
