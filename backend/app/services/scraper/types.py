from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass
class ScrapedPhase:
    name: str
    slug: str
    face_value: Decimal
    sort_order: int = 0


@dataclass
class ScrapedEvent:
    external_event_id: str
    title: str
    venue: str
    location: str
    event_date: datetime
    image_url: str | None
    phases: list[ScrapedPhase]
