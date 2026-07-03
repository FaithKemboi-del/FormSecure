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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
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
        className="relative w-full max-w-lg animate-[slideUp_0.3s_ease-out] rounded-t-3xl border border-slate-800 bg-slate-900/95 p-6 pb-8 shadow-2xl backdrop-blur-md"
      >
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-700" />

        <h2 id="escrow-sheet-title" className="text-lg font-semibold text-slate-50">
          Secure Escrow Checkout
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {event.title} · {phase.name}
        </p>

        <div className="mt-5 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Ticket tier</span>
            <span className="font-medium text-slate-50">{phase.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Escrow-verified price</span>
            <span className="font-bold text-slate-50">{formatKSh(resalePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Est. gate value</span>
            <span className="text-violet-300">{formatKSh(phase.estimatedGateValue)}</span>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Funds are held in escrow until your ticket is verified and transferred. You are
          protected if the listing is invalid.
        </p>

        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-95"
        >
          Confirm Escrow Purchase · {formatKSh(resalePrice)}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:border-slate-600 hover:text-slate-300 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
