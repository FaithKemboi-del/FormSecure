import { useState } from 'react'
import { EventCard } from './components/events/EventCard'
import { EscrowSheet } from './components/escrow/EscrowSheet'
import { WaitlistModal } from './components/waitlist/WaitlistModal'
import { mockEvents } from './data/mockEvents'
import type { Event, PhaseContext, TicketPhase } from './types/event'

export default function App() {
  const [escrowContext, setEscrowContext] = useState<PhaseContext | null>(null)
  const [waitlistContext, setWaitlistContext] = useState<PhaseContext | null>(null)

  const handleBuy = (event: Event, phase: TicketPhase) => {
    setWaitlistContext(null)
    setEscrowContext({ event, phase })
  }

  const handleJoinWaitlist = (event: Event, phase: TicketPhase) => {
    setEscrowContext(null)
    setWaitlistContext({ event, phase })
  }

  return (
    <div className="min-h-dvh bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-violet-400 sm:text-xs">
              FormSecure
            </p>
            <h1 className="truncate text-base font-semibold text-slate-50 sm:text-lg">
              Verified Resale Market
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-400 sm:text-xs">
            Nairobi
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-5 sm:mb-8">
          <h2 className="text-sm font-medium text-slate-50 sm:text-base">Live Events</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Browse ticket phases, compare resale prices, and lock in escrow-verified deals across
            Nairobi&apos;s hottest shows.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {mockEvents.length} events · swipe phases on mobile · grid view on tablet &amp; desktop
          </p>
        </section>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mockEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onBuy={handleBuy}
              onJoinWaitlist={handleJoinWaitlist}
            />
          ))}
        </div>
      </main>

      <EscrowSheet context={escrowContext} onClose={() => setEscrowContext(null)} />
      <WaitlistModal context={waitlistContext} onClose={() => setWaitlistContext(null)} />
    </div>
  )
}
