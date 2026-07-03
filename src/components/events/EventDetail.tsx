import { useState } from 'react'
import { Icon } from '../icons/Icon'
import type { Event, Seller, TicketPhase } from '../../types/event'
import { formatKSh } from '../../utils/currency'

interface EventDetailProps {
  event: Event
  isSaved: boolean
  isAnimating: boolean
  onBack: () => void
  onToggleWishlist: (eventId: string) => void
  onEscrowBuy: (event: Event, phase: TicketPhase, seller: Seller) => void
}

export function EventDetail({
  event,
  isSaved,
  isAnimating,
  onBack,
  onToggleWishlist,
  onEscrowBuy,
}: EventDetailProps) {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const activePhase = event.phases[activePhaseIndex]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="relative h-[150px] shrink-0 sm:h-56 lg:h-64"
        style={{
          background: `linear-gradient(135deg, ${event.gradientFrom}, ${event.gradientTo})`,
        }}
      >
        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          className="icon-btn absolute left-3.5 top-3.5 bg-bg/50 sm:left-5 sm:top-5"
        >
          <Icon name="arrow-left" size={16} className="text-white" />
        </button>

        <div className="absolute right-3.5 top-3.5 flex gap-2 sm:right-5 sm:top-5">
          <button type="button" aria-label="Share event" className="icon-btn bg-bg/50">
            <Icon name="share" size={15} className="text-white" />
          </button>
          <button
            type="button"
            aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isSaved}
            onClick={() => onToggleWishlist(event.id)}
            className={`icon-btn bg-bg/50 ${isAnimating ? 'animate-heart-pop' : ''}`}
          >
            <Icon
              name={isSaved ? 'heart-filled' : 'heart'}
              size={15}
              className={isSaved ? 'text-emerald' : 'text-white'}
            />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-5 lg:px-8">
        <div>
          <h2 className="h-title text-[17px] text-text-hi sm:text-xl lg:text-2xl">{event.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-lo sm:text-xs">
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={12} />
              {event.dateShort}
              {event.time ? ` · ${event.time}` : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={12} />
              {event.venue}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {event.phases.map((phase, index) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => setActivePhaseIndex(index)}
              className={`pill transition-all active:scale-95 ${
                index === activePhaseIndex ? 'pill-on' : ''
              }`}
            >
              {phase.tabLabel}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-[14px] border border-white/8 bg-panel-glass p-3 text-[11.5px] leading-relaxed text-text-mid sm:text-xs">
          <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-emerald" />
          <p>
            Price capped at face value +10–20%. No bidding — every seller below is fixed-price.
          </p>
        </div>

        {activePhase.status === 'SOLD OUT' || activePhase.sellers.length === 0 ? (
          <div className="card text-center">
            <span className="pill pill-amber">Sold out for {activePhase.name}</span>
            <p className="mt-3 text-sm text-text-mid">
              No verified listings right now. Join the Die-Hard waitlist from the home card.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {activePhase.sellers.map((seller) => (
              <div
                key={seller.id}
                className="card flex items-center justify-between gap-3 sm:gap-4"
              >
                <div>
                  <div className="text-xs font-semibold text-text-hi sm:text-sm">
                    Seller · {seller.initials}
                  </div>
                  <span className="pill pill-emerald mt-1.5 sm:mt-2">
                    Save {formatKSh(seller.savingsVsGate)} vs gate
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className="text-base font-bold text-text-hi sm:text-lg"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {formatKSh(seller.price)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onEscrowBuy(event, activePhase, seller)}
                    className="btn btn-emerald mt-1.5 px-3 py-1.5 text-[11px] sm:text-xs"
                  >
                    Escrow &amp; buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
