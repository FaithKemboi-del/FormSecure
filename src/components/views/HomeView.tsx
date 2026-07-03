import { EventCard } from '../events/EventCard'
import { Icon } from '../icons/Icon'
import { eventMatchesPhaseFilter, mockEvents } from '../../data/mockEvents'
import type { Event, PhaseFilter } from '../../types/event'

const phaseFilters: { id: PhaseFilter; label: string }[] = [
  { id: 'all', label: 'All phases' },
  { id: 'phase-1', label: 'Phase 1' },
  { id: 'phase-2', label: 'Phase 2' },
  { id: 'die-hard', label: 'Die-Hard / VIP' },
]

interface HomeViewProps {
  phaseFilter: PhaseFilter
  onPhaseFilterChange: (filter: PhaseFilter) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  isSaved: (eventId: string) => boolean
  animatingId: string | null
  onToggleWishlist: (eventId: string) => void
  onViewEvent: (event: Event) => void
  onJoinWaitlist: (event: Event) => void
}

export function HomeView({
  phaseFilter,
  onPhaseFilterChange,
  searchQuery,
  onSearchQueryChange,
  isSaved,
  animatingId,
  onToggleWishlist,
  onViewEvent,
  onJoinWaitlist,
}: HomeViewProps) {
  const filteredEvents = mockEvents.filter((event) => {
    const matchesPhase = eventMatchesPhaseFilter(event, phaseFilter)
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      event.title.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query)
    return matchesPhase && matchesSearch
  })

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase text-text-lo sm:text-xs">NAIROBI · TODAY</p>
          <h1 className="h-title text-lg text-text-hi sm:text-xl lg:text-2xl">Find your ticket</h1>
        </div>
        <button type="button" aria-label="Notifications" className="icon-btn">
          <Icon name="bell" size={18} />
        </button>
      </div>

      <div className="flex gap-2">
        <label className="search-box">
          <Icon name="search" size={15} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search events, artists…"
            className="w-full bg-transparent text-xs text-text-hi outline-none placeholder:text-text-lo sm:text-sm"
          />
        </label>
        <button type="button" aria-label="Filters" className="icon-btn">
          <Icon name="sliders" size={16} />
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {phaseFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onPhaseFilterChange(filter.id)}
            className={`pill shrink-0 transition-all active:scale-95 ${
              phaseFilter === filter.id ? 'pill-on' : ''
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSaved={isSaved(event.id)}
            isAnimating={animatingId === event.id}
            onToggleWishlist={onToggleWishlist}
            onView={onViewEvent}
            onJoinWaitlist={onJoinWaitlist}
          />
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-sm text-text-mid">No events match your filters.</p>
        </div>
      ) : null}
    </div>
  )
}
