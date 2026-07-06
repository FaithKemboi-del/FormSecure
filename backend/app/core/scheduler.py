import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.core.database import AsyncSessionLocal
from app.services.escrow import expire_stale_transactions
from app.services.scraper.ingestion import ingest_scraped_events
from app.services.scraper.permissions import check_scraper_permissions, seed_scraper_sources

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def _run_permission_check() -> None:
    async with AsyncSessionLocal() as session:
        try:
            await check_scraper_permissions(session)
        except Exception:
            logger.exception("Scraper permission check failed")
            await session.rollback()


async def _run_scraper_ingestion() -> None:
    async with AsyncSessionLocal() as session:
        try:
            await ingest_scraped_events(session)
        except Exception:
            logger.exception("Scraper ingestion job failed")
            await session.rollback()


async def _run_escrow_expiry() -> None:
    async with AsyncSessionLocal() as session:
        try:
            count = await expire_stale_transactions(session)
            await session.commit()
            if count:
                logger.info("Expired and refunded %s escrow transactions", count)
        except Exception:
            logger.exception("Escrow expiry job failed")
            await session.rollback()


async def bootstrap_scraper_sources() -> None:
    async with AsyncSessionLocal() as session:
        await seed_scraper_sources(session)


async def run_startup_permission_check() -> None:
    await _run_permission_check()


def start_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(
        _run_permission_check,
        trigger=CronTrigger(day=1, hour=2, minute=0),
        id="monthly_scraper_permission_check",
        replace_existing=True,
    )
    scheduler.add_job(
        _run_scraper_ingestion,
        trigger=CronTrigger(hour=3, minute=0),
        id="nightly_scraper_ingestion",
        replace_existing=True,
    )

    scheduler.add_job(
        _run_escrow_expiry,
        trigger=IntervalTrigger(minutes=5),
        id="escrow_expiry_check",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Background scheduler started (permission checks + nightly scraper).")


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped.")
