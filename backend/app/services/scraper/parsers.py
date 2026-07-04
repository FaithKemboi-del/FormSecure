import logging

from app.services.scraper.types import ScrapedEvent

logger = logging.getLogger(__name__)


async def scrape_site_events(site_name: str, base_url: str) -> list[ScrapedEvent]:
    """Dispatch to per-site parsers. Returns empty list until a site is approved and implemented."""
    parser = SITE_PARSERS.get(site_name)
    if parser is None:
        logger.info(
            "No HTML parser implemented for %s (%s) — returning empty result.",
            site_name,
            base_url,
        )
        return []
    return await parser(base_url)


async def _parse_ticketsasa(base_url: str) -> list[ScrapedEvent]:
    # TODO: Implement BeautifulSoup parsing for ticketsasa.com event catalog pages.
    logger.info("[PARSER STUB] ticketsasa.com — wire HTML selectors once site is approved.")
    return []


async def _parse_ticketyetu(base_url: str) -> list[ScrapedEvent]:
    logger.info("[PARSER STUB] ticketyetu.com — wire HTML selectors once site is approved.")
    return []


async def _parse_tikiti(base_url: str) -> list[ScrapedEvent]:
    logger.info("[PARSER STUB] tikiti.co.ke — wire HTML selectors once site is approved.")
    return []


async def _parse_ticketskenya(base_url: str) -> list[ScrapedEvent]:
    logger.info("[PARSER STUB] ticketskenya.com — wire HTML selectors once site is approved.")
    return []


async def _parse_little_africa(base_url: str) -> list[ScrapedEvent]:
    logger.info("[PARSER STUB] apps.little.africa — wire HTML selectors once site is approved.")
    return []


async def _parse_madfun(base_url: str) -> list[ScrapedEvent]:
    logger.info("[PARSER STUB] gigs.madfun.com — wire HTML selectors once site is approved.")
    return []


SITE_PARSERS = {
    "ticketsasa.com": _parse_ticketsasa,
    "ticketyetu.com": _parse_ticketyetu,
    "tikiti.co.ke": _parse_tikiti,
    "ticketskenya.com": _parse_ticketskenya,
    "apps.little.africa": _parse_little_africa,
    "gigs.madfun.com": _parse_madfun,
}
