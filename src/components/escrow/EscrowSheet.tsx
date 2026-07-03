import { useEffect } from 'react'
import type { PhaseContext } from '../../types/event'
import { formatKSh } from '../../utils/currency'

interface EscrowSheetProps {
  context: PhaseContext | null
  onClose: () => void
}

export function EscrowSheet({ context, onClose }: EscrowSheetProps) {
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
  const resalePrice = phase.currentResalePrice ?? phase.originalFaceValue

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close escrow sheet"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="escrow-sheet-title"
        className="relative flex max-h-[92dvh] w-full max-w-lg animate-[slideUp_0.3s_ease-out] flex-col overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900/95 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:max-h-[85dvh] sm:rounded-3xl sm:p-6 sm:pb-6"
      >
        <div className="mx-auto mb-4 h-1 w-12 shrink-0 rounded-full bg-slate-700 sm:hidden" />

        <h2 id="escrow-sheet-title" className="text-lg font-semibold text-slate-50 sm:text-xl">
          Secure Escrow Checkout
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {event.title} · {phase.name}
        </p>

        <div className="mt-5 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="text-xs text-slate-400 sm:text-sm">Ticket tier</span>
            <span className="text-sm font-medium text-slate-50">{phase.name}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="text-xs text-slate-400 sm:text-sm">Escrow-verified price</span>
            <span className="text-base font-bold text-slate-50 sm:text-sm">
              {formatKSh(resalePrice)}
            </span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="text-xs text-slate-400 sm:text-sm">Est. gate value</span>
            <span className="text-base text-violet-300 sm:text-sm">
              {formatKSh(phase.estimatedGateValue)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Funds are held in escrow until your ticket is verified and transferred. You are
          protected if the listing is invalid.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            className="w-full rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-95"
          >
            Confirm Escrow Purchase · {formatKSh(resalePrice)}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:border-slate-600 hover:text-slate-300 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
