from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User
from app.schemas.listings import (
    CreateListingBody,
    ListingCreateResponse,
    ListingMineListResponse,
)
from app.services.listings import ListingError, cancel_listing, create_listing, get_my_listings

router = APIRouter(prefix="/api/listings", tags=["listings"])


@router.post("", response_model=ListingCreateResponse, status_code=status.HTTP_201_CREATED)
async def post_listing(
    body: CreateListingBody,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ListingCreateResponse:
    try:
        return await create_listing(
            session,
            current_user,
            event_id=body.event_id,
            phase_id=body.phase_id,
            asking_price=body.asking_price,
            external_ticket_identifier=body.external_ticket_identifier,
        )
    except ListingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/mine", response_model=ListingMineListResponse)
async def get_my_listings_route(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ListingMineListResponse:
    return await get_my_listings(session, current_user)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    try:
        await cancel_listing(session, current_user, listing_id)
    except ListingError as exc:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in str(exc).lower()
            else status.HTTP_409_CONFLICT
        )
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
