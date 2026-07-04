from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ScraperSourceResponse(BaseModel):
    id: UUID
    site_name: str
    base_url: str
    robots_txt_status: str
    tos_status: str
    has_public_api: bool
    last_checked_at: datetime | None
    is_currently_approved: bool
    notes: str | None

    model_config = {"from_attributes": True}


class ScraperSourceListResponse(BaseModel):
    items: list[ScraperSourceResponse]
