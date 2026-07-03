import { useEffect } from 'react'
import type { PhaseContext } from '../../types/event'
import { formatKSh } from '../../utils/currency'

interface WaitlistModalProps {
  context: PhaseContext | null
  onClose: () => void
}

export function WaitlistModal({ context, onClose }: WaitlistModalProps) {
  const isOpen = context !== null

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!context) return null

  const { event, phase } = context

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close waitlist modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-modal-title"
        className="relative w-full max-w-lg animate-[slideUp_0.3s_ease-out] rounded-t-3xl border border-slate-800 bg-slate-900/95 p-6 pb-8 shadow-2xl backdrop-blur-md sm:rounded-3xl"
      >
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-700 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="waitlist-modal-title" className="text-lg font-semibold text-slate-50">
              Die-Hard Waitlist
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              You are entering the waitlist exclusively for{' '}
              <span className="text-slate-50">{event.title}</span>{' '}
              <span className="font-medium text-violet-300">{phase.name}</span> tickets.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-rose-500/20 bg-gradient-to-br from-violet-500/10 to-rose-500/10 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Predictive gate estimate
          </p>
          <p className="mt-1 text-lg font-bold text-slate-50">
            ~{formatKSh(phase.estimatedGateValue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            We will notify you when verified resale listings appear for this tier.
          </p>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-slate-400">Mobile number</span>
          <input
            type="tel"
            placeholder="+254 7XX XXX XXX"
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </label>

        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-rose-500 active:scale-95"
        >
          Join {phase.tabLabel} Waitlist
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:border-slate-600 hover:text-slate-300 active:scale-95"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
