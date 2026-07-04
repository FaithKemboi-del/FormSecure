import { Icon } from '../icons/Icon'
import { getFeaturedPhase } from '../../utils/eventMapper'
import type { Event } from '../../types/event'
import { formatKSh, savingsPercent } from '../../utils/currency'

interface EventCardProps {
  event: Event
  isSaved: boolean
  isAnimating: boolean
  onToggleWishlist: (eventId: string) => void
  onView: (event: Event) => void
  onJoinWaitlist: (event: Event) => void
  compact?: boolean
}

export function EventCard({
  event,
  isSaved,
  isAnimating,
  onToggleWishlist,
  onView,
  onJoinWaitlist,
  compact = false,
}: EventCardProps) {
  const featuredPhase = getFeaturedPhase(event)
  const resalePrice = featuredPhase.currentResalePrice
  const gateValue = featuredPhase.estimatedGateValue
  const savePct =
    resalePrice !== null ? savingsPercent(resalePrice, gateValue) : 0

  return (
    <article className="card overflow-hidden p-0">
      <div
        className={`relative ${compact ? 'h-[70px]' : 'h-[86px] sm:h-24 lg:h-28'}`}
        style={{
          background: `linear-gradient(135deg, ${event.gradientFrom}, ${event.gradientTo})`,
        }}
      >
        <button
          type="button"
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isSaved}
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist(event.id)
          }}
          className={`absolute right-2 top-2 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-bg/50 transition-all active:scale-95 sm:right-3 sm:top-3 sm:h-7 sm:w-7 ${
            isAnimating ? 'animate-heart-pop' : ''
          }`}
        >
          <Icon
            name={isSaved ? 'heart-filled' : 'heart'}
            size={14}
            className={isSaved ? 'text-emerald' : 'text-white'}
          />
        </button>

        {event.soldOut ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-amber/85 px-1.5 py-0.5 font-mono text-[9.5px] text-[#241400]">
            Sold out — waitlist
          </span>
        ) : (
          <span className="absolute bottom-2 left-2 rounded-md bg-bg/55 px-1.5 py-0.5 font-mono text-[9.5px] text-white">
            🔥 {event.sellerCount} seller{event.sellerCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="space-y-2 p-3 sm:p-3.5">
        <div>
          <h3 className="h-title text-[13.5px] leading-snug text-text-hi sm:text-sm lg:text-base">
            {event.shortTitle}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10.5px] text-text-lo sm:text-xs">
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={11} />
              {event.dateShort}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={11} />
              {event.location}
            </span>
          </div>
        </div>

        {event.soldOut ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10.5px] text-text-lo sm:text-xs">
              {event.waitlistPhaseLabel ?? 'All phases'}
            </span>
            <button
              type="button"
              onClick={() => onJoinWaitlist(event)}
              className="rounded-[14px] bg-violet-dim px-3 py-1.5 text-[11.5px] font-semibold text-[#c9baff] transition-all active:scale-95 sm:text-xs"
            >
              Join Die-Hard
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <div>
              <div
                className="text-[15px] font-bold text-text-hi sm:text-base lg:text-lg"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {resalePrice !== null ? formatKSh(resalePrice) : formatKSh(featuredPhase.originalFaceValue)}
              </div>
              {resalePrice !== null ? (
                <span className="pill pill-emerald mt-1">
                  Gate est. {formatKSh(gateValue)} · save {savePct}%
                </span>
              ) : null}
            </div>
            <button type="button" onClick={() => onView(event)} className="btn btn-primary px-3.5 py-2 text-xs sm:px-4">
              View
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
