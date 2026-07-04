from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models import ScraperSource, User
from app.schemas.scraper import ScraperSourceListResponse, ScraperSourceResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/scraper-sources", response_model=ScraperSourceListResponse)
async def list_scraper_sources(
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_admin_user)],
) -> ScraperSourceListResponse:
    result = await session.execute(select(ScraperSource).order_by(ScraperSource.site_name))
    sources = result.scalars().all()
    return ScraperSourceListResponse(
        items=[ScraperSourceResponse.model_validate(source) for source in sources]
    )
