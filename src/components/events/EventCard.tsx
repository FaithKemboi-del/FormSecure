import { useState } from 'react'
import type { Event, TicketPhase } from '../../types/event'
import { formatKSh } from '../../utils/currency'

interface EventCardProps {
  event: Event
  onBuy: (event: Event, phase: TicketPhase) => void
  onJoinWaitlist: (event: Event, phase: TicketPhase) => void
}

export function EventCard({ event, onBuy, onJoinWaitlist }: EventCardProps) {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const activePhase = event.phases[activePhaseIndex]

  const savings =
    activePhase.status === 'AVAILABLE' && activePhase.currentResalePrice !== null
      ? activePhase.estimatedGateValue - activePhase.currentResalePrice
      : null

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20 backdrop-blur-md">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {event.location}
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-tight text-slate-50">
            {event.title}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {event.venue} · {event.date}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Select Ticket Phase
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Ticket phases"
          >
            {event.phases.map((phase, index) => {
              const isActive = index === activePhaseIndex
              return (
                <button
                  key={phase.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActivePhaseIndex(index)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                    isActive
                      ? 'border-violet-500/60 bg-violet-600/20 text-slate-50'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {phase.tabLabel}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">Original Face Value</p>
              <p className="mt-0.5 text-sm text-slate-400">
                {formatKSh(activePhase.originalFaceValue)}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                activePhase.status === 'AVAILABLE'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {activePhase.status === 'AVAILABLE' ? 'Available' : 'Sold Out'}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-400">Current Resale Price</p>
            {activePhase.currentResalePrice !== null ? (
              <p className="mt-0.5 text-xl font-bold text-slate-50">
                {formatKSh(activePhase.currentResalePrice)}
              </p>
            ) : (
              <p className="mt-0.5 text-xl font-bold text-rose-400/90">None Left</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Lowest escrow-verified listing on FormSecure
            </p>
          </div>

          <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2.5">
            <p className="text-sm leading-snug text-violet-200">
              📈 Expected Gate Value: ~{formatKSh(activePhase.estimatedGateValue)}
              {savings !== null && savings > 0 ? (
                <span className="text-violet-300/90">
                  {' '}
                  (Save {formatKSh(savings)} if you buy now)
                </span>
              ) : activePhase.status === 'SOLD OUT' ? (
                <span className="text-rose-300/90"> — Join waitlist for access</span>
              ) : null}
            </p>
          </div>
        </div>

        {activePhase.status === 'AVAILABLE' ? (
          <button
            type="button"
            onClick={() => onBuy(event, activePhase)}
            className="w-full rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:bg-violet-500 active:scale-95"
          >
            Buy {activePhase.name} Ticket
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onJoinWaitlist(event, activePhase)}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-rose-500 active:scale-95"
          >
            Join {activePhase.name} Die-Hard Waitlist
          </button>
        )}
      </div>
    </article>
  )
}
