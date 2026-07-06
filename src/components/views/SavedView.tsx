import { EventCard } from '../events/EventCard'
import { Icon } from '../icons/Icon'
import type { Event } from '../../types/event'

interface SavedViewProps {
  savedEvents: Event[]
  loading: boolean
  animatingId: string | null
  onToggleWishlist: (eventId: string) => void
  onViewEvent: (event: Event) => void
  onJoinWaitlist: (event: Event) => void
}

export function SavedView({
  savedEvents,
  loading,
  animatingId,
  onToggleWishlist,
  onViewEvent,
  onJoinWaitlist,
}: SavedViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[10.5px] uppercase text-text-lo sm:text-xs">YOUR LIST</p>
        <h1 className="h-title text-lg text-text-hi sm:text-xl lg:text-2xl">Saved events</h1>
        <p className="mt-1 text-sm text-text-mid">
          {savedEvents.length} event{savedEvents.length === 1 ? '' : 's'} in your wishlist
        </p>
      </div>

      {loading ? (
        <div className="card py-8 text-center">
          <p className="text-sm text-text-mid">Loading saved events…</p>
        </div>
      ) : null}

      {!loading && savedEvents.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-dim">
            <Icon name="heart" size={20} className="text-emerald" />
          </div>
          <p className="text-sm text-text-mid">Tap the heart on any event to save it here.</p>
        </div>
      ) : null}

      {!loading && savedEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSaved
              isAnimating={animatingId === event.id}
              onToggleWishlist={onToggleWishlist}
              onView={onViewEvent}
              onJoinWaitlist={onJoinWaitlist}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
