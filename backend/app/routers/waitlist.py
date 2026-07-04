from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_verified_user
from app.models import User
from app.schemas.waitlist import JoinWaitlistBody, WaitlistEntryResponse, WaitlistListResponse
from app.services.waitlist import WaitlistError, join_waitlist, leave_waitlist, list_my_waitlist

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


@router.post("", response_model=WaitlistEntryResponse, status_code=status.HTTP_201_CREATED)
async def post_waitlist_entry(
    body: JoinWaitlistBody,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_verified_user)],
) -> WaitlistEntryResponse:
    try:
        entry, phase = await join_waitlist(
            session,
            current_user,
            event_id=body.event_id,
            phase_id=body.phase_id,
            max_budget=body.max_budget,
            email=str(body.email) if body.email else None,
            notify_via_email=body.notify_via_email,
        )
    except WaitlistError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return WaitlistEntryResponse(
        id=entry.id,
        event_id=phase.event_id,
        event_title=phase.event.title,
        phase_id=entry.ticket_phase_id,
        phase_name=phase.name,
        max_budget=entry.max_budget,
        email=entry.email,
        notify_via_email=entry.notify_via_email,
        created_at=entry.created_at,
    )


@router.get("/mine", response_model=WaitlistListResponse)
async def get_my_waitlist(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> WaitlistListResponse:
    entries = await list_my_waitlist(session, current_user.id)
    items = [
        WaitlistEntryResponse(
            id=entry.id,
            event_id=entry.ticket_phase.event_id,
            event_title=entry.ticket_phase.event.title,
            phase_id=entry.ticket_phase_id,
            phase_name=entry.ticket_phase.name,
            max_budget=entry.max_budget,
            email=entry.email,
            notify_via_email=entry.notify_via_email,
            created_at=entry.created_at,
        )
        for entry in entries
    ]
    return WaitlistListResponse(items=items)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_waitlist_entry(
    entry_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    try:
        await leave_waitlist(session, current_user.id, entry_id)
    except WaitlistError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
