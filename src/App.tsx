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
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
              FormSecure
            </p>
            <h1 className="text-base font-semibold text-slate-50">Verified Resale Market</h1>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
            Nairobi
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-50">Live Events</h2>
          <p className="mt-1 text-sm text-slate-400">
            Browse ticket phases, compare resale prices, and lock in escrow-verified deals.
          </p>
        </section>

        <div className="space-y-6">
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
