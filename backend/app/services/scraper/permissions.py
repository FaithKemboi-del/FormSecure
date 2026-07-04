import logging
import re
from datetime import UTC, datetime
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser
from uuid import uuid4

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RobotsTxtStatus, ScraperSource, TosStatus

logger = logging.getLogger(__name__)

TOS_KEYWORDS = re.compile(
    r"\b(scrape|scraping|crawl|crawling|automated access|automated tool|bot|bots|spider|spiders)\b",
    re.IGNORECASE,
)

TOS_PATHS = ("/terms", "/terms-of-service", "/tos", "/terms-and-conditions", "/legal/terms")

USER_AGENT = "FormSecureCatalogBot/1.0 (+https://formsecure.local)"


async def seed_scraper_sources(session: AsyncSession) -> None:
    defaults = [
        ("ticketsasa.com", "https://ticketsasa.com"),
        ("ticketyetu.com", "https://ticketyetu.com"),
        ("tikiti.co.ke", "https://tikiti.co.ke"),
        ("ticketskenya.com", "https://ticketskenya.com"),
        ("apps.little.africa", "https://apps.little.africa"),
        ("gigs.madfun.com", "https://gigs.madfun.com"),
    ]
    for site_name, base_url in defaults:
        stmt = (
            insert(ScraperSource)
            .values(
                id=uuid4(),
                site_name=site_name,
                base_url=base_url,
                robots_txt_status=RobotsTxtStatus.UNCLEAR,
                tos_status=TosStatus.UNCLEAR,
                has_public_api=False,
                is_currently_approved=False,
            )
            .on_conflict_do_nothing(index_elements=["site_name"])
        )
        await session.execute(stmt)
    await session.commit()
    logger.info("Scraper source seed completed (skips sites that already exist).")


async def _fetch_text(client: httpx.AsyncClient, url: str) -> str | None:
    try:
        response = await client.get(url, follow_redirects=True, timeout=20.0)
        if response.status_code >= 400:
            return None
        return response.text
    except httpx.HTTPError:
        return None


def _evaluate_robots(base_url: str, robots_body: str | None) -> RobotsTxtStatus:
    if not robots_body:
        return RobotsTxtStatus.UNCLEAR

    parser = RobotFileParser()
    parser.set_url(f"{base_url.rstrip('/')}/robots.txt")
    parser.parse(robots_body.splitlines())

    paths = ["/", "/events", "/event", "/tickets"]
    disallowed_all = all(not parser.can_fetch(USER_AGENT, path) for path in paths)
    if disallowed_all:
        return RobotsTxtStatus.DISALLOWED

    allowed_any = any(parser.can_fetch(USER_AGENT, path) for path in paths)
    if allowed_any:
        return RobotsTxtStatus.ALLOWED

    return RobotsTxtStatus.UNCLEAR


def _evaluate_tos(tos_text: str | None) -> TosStatus:
    if not tos_text:
        return TosStatus.UNCLEAR

    lowered = tos_text.lower()
    if TOS_KEYWORDS.search(lowered):
        prohibitive = any(
            phrase in lowered
            for phrase in (
                "may not scrape",
                "shall not scrape",
                "prohibited from using",
                "no automated",
                "without our prior written consent",
            )
        )
        if prohibitive:
            return TosStatus.PROHIBITS_SCRAPING
        return TosStatus.UNCLEAR

    if "automated" in lowered or "scraping" in lowered:
        return TosStatus.UNCLEAR

    return TosStatus.SILENT


def _is_approved(robots: RobotsTxtStatus, tos: TosStatus) -> bool:
    return robots == RobotsTxtStatus.ALLOWED and tos != TosStatus.PROHIBITS_SCRAPING


async def check_scraper_permissions(session: AsyncSession) -> None:
    result = await session.execute(select(ScraperSource).order_by(ScraperSource.site_name))
    sources = result.scalars().all()

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}) as client:
        for source in sources:
            was_approved = source.is_currently_approved
            robots_url = urljoin(source.base_url, "/robots.txt")
            robots_body = await _fetch_text(client, robots_url)
            robots_status = _evaluate_robots(source.base_url, robots_body)

            tos_text = None
            for path in TOS_PATHS:
                tos_text = await _fetch_text(client, urljoin(source.base_url, path))
                if tos_text:
                    break
            tos_status = _evaluate_tos(tos_text)

            source.robots_txt_status = robots_status
            source.tos_status = tos_status
            source.last_checked_at = datetime.now(UTC)
            source.is_currently_approved = _is_approved(robots_status, tos_status)

            notes = [
                f"robots.txt checked at {robots_url}",
                f"robots={robots_status.value}",
                f"tos={tos_status.value}",
            ]
            source.notes = "; ".join(notes)

            if was_approved and not source.is_currently_approved:
                logger.warning(
                    "ALERT: scraping permission revoked for %s, disabling scraper",
                    source.site_name,
                )

    await session.commit()
    logger.info("Scraper permission check completed for %s sources", len(sources))
