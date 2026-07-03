import { useMemo, useState } from 'react'
import { EventDetail } from './components/events/EventDetail'
import { EscrowCheckout } from './components/escrow/EscrowCheckout'
import { BottomNav } from './components/ui/BottomNav'
import { Toast } from './components/ui/Toast'
import { WaitlistSheet } from './components/waitlist/WaitlistSheet'
import { HomeView } from './components/views/HomeView'
import { ProfileView } from './components/views/ProfileView'
import { SavedView } from './components/views/SavedView'
import { SearchView } from './components/views/SearchView'
import { WalletView } from './components/views/WalletView'
import { useToast } from './hooks/useToast'
import { useWishlist } from './hooks/useWishlist'
import type { Event, NavTab, PhaseFilter, Seller, TicketPhase } from './types/event'

export default function App() {
  const { toast, showToast } = useToast()
  const { isSaved, toggleWishlist, animatingId, savedIds, savedCount } = useWishlist({
    onToggle: showToast,
  })

  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [waitlistEvent, setWaitlistEvent] = useState<Event | null>(null)
  const [checkoutContext, setCheckoutContext] = useState<{
    event: Event
    phase: TicketPhase
    seller: Seller
  } | null>(null)

  const showBottomNav = selectedEvent === null

  const content = useMemo(() => {
    if (selectedEvent) {
      return (
        <EventDetail
          event={selectedEvent}
          isSaved={isSaved(selectedEvent.id)}
          isAnimating={animatingId === selectedEvent.id}
          onBack={() => setSelectedEvent(null)}
          onToggleWishlist={toggleWishlist}
          onEscrowBuy={(event, phase, seller) => {
            setCheckoutContext({ event, phase, seller })
          }}
        />
      )
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            phaseFilter={phaseFilter}
            onPhaseFilterChange={setPhaseFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            isSaved={isSaved}
            animatingId={animatingId}
            onToggleWishlist={toggleWishlist}
            onViewEvent={setSelectedEvent}
            onJoinWaitlist={setWaitlistEvent}
          />
        )
      case 'search':
        return <SearchView />
      case 'saved':
        return (
          <SavedView
            savedIds={savedIds}
            animatingId={animatingId}
            onToggleWishlist={toggleWishlist}
            onViewEvent={setSelectedEvent}
            onJoinWaitlist={setWaitlistEvent}
          />
        )
      case 'wallet':
        return <WalletView />
      case 'profile':
        return <ProfileView onOpenSaved={() => setActiveTab('saved')} />
      default:
        return null
    }
  }, [
    activeTab,
    animatingId,
    isSaved,
    phaseFilter,
    savedIds,
    searchQuery,
    selectedEvent,
    toggleWishlist,
  ])

  return (
    <div className="min-h-dvh bg-bg text-text-hi">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
        <main
          className={`mx-auto w-full max-w-5xl flex-1 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 ${
            showBottomNav
              ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]'
              : 'pb-[max(1rem,env(safe-area-inset-bottom))]'
          }`}
        >
          {content}
        </main>
      </div>

      {showBottomNav ? (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          savedCount={savedCount}
        />
      ) : null}

      <Toast message={toast?.message ?? null} />
      <WaitlistSheet event={waitlistEvent} onClose={() => setWaitlistEvent(null)} />
      <EscrowCheckout context={checkoutContext} onClose={() => setCheckoutContext(null)} />
    </div>
  )
}
