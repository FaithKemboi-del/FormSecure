import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchEventDetail, fetchEvents } from './api/events'
import { LoginSheet } from './components/auth/LoginSheet'
import { NotificationsSheet } from './components/notifications/NotificationsSheet'
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
import { useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
import { useToast } from './hooks/useToast'
import { useWishlist } from './hooks/useWishlist'
import { mapEventDetail, mapEventSummary } from './utils/eventMapper'
import type { Event, NavTab, PhaseFilter, Seller, TicketPhase } from './types/event'

export default function App() {
  const { toast, showToast } = useToast()
  const { user, loading: authLoading, logout, onLoginSuccess, refreshUser } = useAuth()
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    reload: reloadNotifications,
    markRead,
    markAllRead,
  } = useNotifications(Boolean(user))
  const { isSaved, toggleWishlist, animatingId, savedIds, savedCount } = useWishlist({
    onToggle: showToast,
  })

  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [waitlistEvent, setWaitlistEvent] = useState<Event | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [savedEvents, setSavedEvents] = useState<Event[]>([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [checkoutContext, setCheckoutContext] = useState<{
    event: Event
    phase: TicketPhase
    seller: Seller
  } | null>(null)

  const showBottomNav = selectedEvent === null

  const loadSavedEvents = useCallback(async () => {
    if (savedIds.size === 0) {
      setSavedEvents([])
      return
    }

    setSavedLoading(true)
    try {
      const response = await fetchEvents()
      const events = response.items
        .map(mapEventSummary)
        .filter((event) => savedIds.has(event.id))
      setSavedEvents(events)
    } catch {
      setSavedEvents([])
    } finally {
      setSavedLoading(false)
    }
  }, [savedIds])

  useEffect(() => {
    if (activeTab === 'saved') {
      void loadSavedEvents()
    }
  }, [activeTab, loadSavedEvents])

  const handleViewEvent = useCallback(
    async (summary: Event) => {
      setSelectedEvent(summary)
      setDetailLoading(true)
      try {
        const detail = await fetchEventDetail(summary.id)
        setSelectedEvent(mapEventDetail(detail))
      } catch {
        showToast('Could not load event details')
      } finally {
        setDetailLoading(false)
      }
    },
    [showToast],
  )

  const handleJoinWaitlist = useCallback(
    (event: Event) => {
      if (!user) {
        setLoginOpen(true)
        return
      }
      setWaitlistEvent(event)
    },
    [user],
  )

  const handleOpenNotifications = useCallback(() => {
    if (!user) {
      setLoginOpen(true)
      return
    }
    setNotificationsOpen(true)
  }, [user])

  const content = useMemo(() => {
    if (selectedEvent) {
      return (
        <>
          {detailLoading ? (
            <div className="card py-6 text-center">
              <p className="text-sm text-text-mid">Loading listings…</p>
            </div>
          ) : null}
          <EventDetail
            event={selectedEvent}
            isSaved={isSaved(selectedEvent.id)}
            isAnimating={animatingId === selectedEvent.id}
            onBack={() => setSelectedEvent(null)}
            onToggleWishlist={toggleWishlist}
            onEscrowBuy={(event, phase, seller) => {
              if (!user) {
                setLoginOpen(true)
                return
              }
              setCheckoutContext({ event, phase, seller })
            }}
          />
        </>
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
            onViewEvent={(event) => void handleViewEvent(event)}
            onJoinWaitlist={handleJoinWaitlist}
            unreadCount={unreadCount}
            onOpenNotifications={handleOpenNotifications}
          />
        )
      case 'search':
        return <SearchView />
      case 'saved':
        return (
          <SavedView
            savedEvents={savedEvents}
            loading={savedLoading}
            animatingId={animatingId}
            onToggleWishlist={toggleWishlist}
            onViewEvent={(event) => void handleViewEvent(event)}
            onJoinWaitlist={handleJoinWaitlist}
          />
        )
      case 'wallet':
        return <WalletView />
      case 'profile':
        return (
          <ProfileView
            user={user}
            loading={authLoading}
            onOpenSaved={() => setActiveTab('saved')}
            onLogin={() => setLoginOpen(true)}
            onLogout={logout}
            onProfileUpdated={() => void refreshUser()}
          />
        )
      default:
        return null
    }
  }, [
    activeTab,
    animatingId,
    authLoading,
    detailLoading,
    handleJoinWaitlist,
    handleOpenNotifications,
    handleViewEvent,
    isSaved,
    logout,
    phaseFilter,
    savedEvents,
    savedLoading,
    searchQuery,
    selectedEvent,
    toggleWishlist,
    unreadCount,
    user,
    refreshUser,
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
      <WaitlistSheet
        event={waitlistEvent}
        user={user}
        onClose={() => setWaitlistEvent(null)}
        onLoginRequired={() => {
          setWaitlistEvent(null)
          setLoginOpen(true)
        }}
        onSuccess={(message) => {
          showToast(message)
          void reloadNotifications()
        }}
      />
      <NotificationsSheet
        open={notificationsOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notificationsLoading}
        onClose={() => setNotificationsOpen(false)}
        onMarkRead={(notificationId) => void markRead(notificationId)}
        onMarkAllRead={() => void markAllRead()}
      />
      <EscrowCheckout context={checkoutContext} onClose={() => setCheckoutContext(null)} />
      <LoginSheet
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          void onLoginSuccess()
          void reloadNotifications()
        }}
      />
    </div>
  )
}
