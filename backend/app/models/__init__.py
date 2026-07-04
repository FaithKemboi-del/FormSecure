import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EscrowTransactionStatus(str, enum.Enum):
    PENDING = "pending"
    ESCROWED = "escrowed"
    VERIFIED = "verified"
    RELEASED = "released"
    EXPIRED = "expired"
    REFUNDED = "refunded"


class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    RESERVED = "reserved"
    SOLD = "sold"
    CANCELLED = "cancelled"


class TicketPhaseStatus(str, enum.Enum):
    AVAILABLE = "available"
    SOLD_OUT = "sold_out"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    NEEDS_MORE_INFO = "needs_more_info"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.PENDING,
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(default=False)
    is_blocked: Mapped[bool] = mapped_column(default=False)
    is_admin: Mapped[bool] = mapped_column(default=False)
    blocked_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verification_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    mpesa_registered_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    listings: Mapped[list["Listing"]] = relationship(back_populates="seller")
    buyer_transactions: Mapped[list["EscrowTransaction"]] = relationship(
        back_populates="buyer",
        foreign_keys="EscrowTransaction.buyer_id",
    )
    seller_transactions: Mapped[list["EscrowTransaction"]] = relationship(
        back_populates="seller",
        foreign_keys="EscrowTransaction.seller_id",
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(back_populates="user")
    waitlist_entries: Mapped[list["WaitlistEntry"]] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200))
    venue: Mapped[str] = mapped_column(String(200))
    location: Mapped[str] = mapped_column(String(120))
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_site: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    external_event_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    phases: Mapped[list["TicketPhase"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(back_populates="event")

    __table_args__ = (
        UniqueConstraint(
            "source_site",
            "external_event_id",
            name="uq_events_source_site_external_event_id",
        ),
    )


class TicketPhase(Base):
    __tablename__ = "ticket_phases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(80))
    face_value: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    estimated_gate_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[TicketPhaseStatus] = mapped_column(
        Enum(TicketPhaseStatus, name="ticket_phase_status"),
        default=TicketPhaseStatus.AVAILABLE,
    )
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="phases")
    listings: Mapped[list["Listing"]] = relationship(back_populates="ticket_phase")
    waitlist_entries: Mapped[list["WaitlistEntry"]] = relationship(back_populates="ticket_phase")

    __table_args__ = (UniqueConstraint("event_id", "slug", name="uq_ticket_phases_event_id_slug"),)


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ticket_phase_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ticket_phases.id", ondelete="CASCADE"),
        index=True,
    )
    asking_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    external_ticket_identifier: Mapped[str] = mapped_column(String(200))
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus, name="listing_status"),
        default=ListingStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    seller: Mapped["User"] = relationship(back_populates="listings")
    ticket_phase: Mapped["TicketPhase"] = relationship(back_populates="listings")
    transactions: Mapped[list["EscrowTransaction"]] = relationship(back_populates="listing")


class EscrowTransaction(Base):
    __tablename__ = "escrow_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("listings.id", ondelete="RESTRICT"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    buyer_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    seller_commission: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    status: Mapped[EscrowTransactionStatus] = mapped_column(
        Enum(EscrowTransactionStatus, name="escrow_transaction_status"),
        default=EscrowTransactionStatus.PENDING,
        index=True,
    )
    transfer_code: Mapped[str | None] = mapped_column(String(4), nullable=True)
    mpesa_checkout_request_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mpesa_receipt_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    buyer: Mapped["User"] = relationship(back_populates="buyer_transactions", foreign_keys=[buyer_id])
    seller: Mapped["User"] = relationship(back_populates="seller_transactions", foreign_keys=[seller_id])
    listing: Mapped["Listing"] = relationship(back_populates="transactions")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="wishlist_items")
    event: Mapped["Event"] = relationship(back_populates="wishlist_items")

    __table_args__ = (UniqueConstraint("user_id", "event_id", name="uq_wishlist_items_user_id_event_id"),)


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ticket_phase_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ticket_phases.id", ondelete="CASCADE"),
        index=True,
    )
    max_budget: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    contact_number: Mapped[str] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    notify_via_email: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="waitlist_entries")
    ticket_phase: Mapped["TicketPhase"] = relationship(back_populates="waitlist_entries")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "ticket_phase_id",
            name="uq_waitlist_entries_user_id_ticket_phase_id",
        ),
    )


class NotificationType(str, enum.Enum):
    WAITLIST_MATCH = "waitlist_match"
    WAITLIST_CONFIRMED = "waitlist_confirmed"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(String(1000))
    event_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("events.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    listing_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("listings.id", ondelete="SET NULL"),
        nullable=True,
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="notifications")


class PhoneOTP(Base):
    __tablename__ = "phone_otps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number: Mapped[str] = mapped_column(String(20), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class RobotsTxtStatus(str, enum.Enum):
    ALLOWED = "allowed"
    DISALLOWED = "disallowed"
    UNCLEAR = "unclear"


class TosStatus(str, enum.Enum):
    PROHIBITS_SCRAPING = "prohibits_scraping"
    SILENT = "silent"
    ALLOWS = "allows"
    UNCLEAR = "unclear"


class ScraperSource(Base):
    __tablename__ = "scraper_sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_name: Mapped[str] = mapped_column(String(120), unique=True)
    base_url: Mapped[str] = mapped_column(String(500))
    robots_txt_status: Mapped[RobotsTxtStatus] = mapped_column(
        Enum(RobotsTxtStatus, name="robots_txt_status"),
        default=RobotsTxtStatus.UNCLEAR,
    )
    tos_status: Mapped[TosStatus] = mapped_column(
        Enum(TosStatus, name="tos_status"),
        default=TosStatus.UNCLEAR,
    )
    has_public_api: Mapped[bool] = mapped_column(default=False)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_currently_approved: Mapped[bool] = mapped_column(default=False)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
