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
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20 backdrop-blur-md">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden sm:aspect-[2/1]">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
            {event.location}
          </p>
          <h2 className="mt-1 text-base font-semibold leading-snug text-slate-50 sm:text-lg lg:text-xl">
            {event.title}
          </h2>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            {event.venue} · {event.date}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-4 sm:p-5">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
            Select Ticket Phase
          </p>
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
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
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-all active:scale-95 sm:px-4 sm:text-sm ${
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

        <div className="flex-1 space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start justify-between gap-3 sm:block">
              <div>
                <p className="text-[11px] text-slate-400 sm:text-xs">Original Face Value</p>
                <p className="mt-0.5 text-sm text-slate-400">
                  {formatKSh(activePhase.originalFaceValue)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:mt-2 sm:inline-block ${
                  activePhase.status === 'AVAILABLE'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                {activePhase.status === 'AVAILABLE' ? 'Available' : 'Sold Out'}
              </span>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 sm:text-xs">Current Resale Price</p>
              {activePhase.currentResalePrice !== null ? (
                <p className="mt-0.5 text-lg font-bold text-slate-50 sm:text-xl">
                  {formatKSh(activePhase.currentResalePrice)}
                </p>
              ) : (
                <p className="mt-0.5 text-lg font-bold text-rose-400/90 sm:text-xl">None Left</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                Lowest escrow-verified listing on FormSecure
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2.5 sm:px-4">
            <p className="text-xs leading-snug text-violet-200 sm:text-sm">
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

        <div className="mt-auto pt-1">
          {activePhase.status === 'AVAILABLE' ? (
            <button
              type="button"
              onClick={() => onBuy(event, activePhase)}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:bg-violet-500 active:scale-95 sm:py-3.5"
            >
              <span className="hidden sm:inline">Buy {activePhase.name} Ticket</span>
              <span className="sm:hidden">Buy {activePhase.tabLabel} Ticket</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onJoinWaitlist(event, activePhase)}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-rose-500 active:scale-95 sm:py-3.5"
            >
              <span className="hidden sm:inline">Join {activePhase.name} Die-Hard Waitlist</span>
              <span className="sm:hidden">Join {activePhase.tabLabel} Waitlist</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
