import { useEffect } from 'react'
import { Icon } from '../icons/Icon'
import type { Event, Seller, TicketPhase } from '../../types/event'
import { formatKSh } from '../../utils/currency'

interface EscrowCheckoutProps {
  context: { event: Event; phase: TicketPhase; seller: Seller } | null
  onClose: () => void
}

export function EscrowCheckout({ context, onClose }: EscrowCheckoutProps) {
  const isOpen = context !== null
  const serviceFee = 100
  const ticketPrice = context?.seller.price ?? 0
  const total = ticketPrice + serviceFee

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!context) return null

  const { event, phase, seller } = context

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4 lg:p-6">
      <button
        type="button"
        aria-label="Close checkout"
        onClick={onClose}
        className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="animate-slide-up relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-[22px] border border-white/8 bg-panel p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[85dvh] sm:rounded-[22px] sm:p-6"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/8 sm:hidden" />

        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onClose} className="transition-all active:scale-95">
            <Icon name="arrow-left" size={16} />
          </button>
          <h2 className="h-title text-[15px] sm:text-base">Confirm &amp; pay</h2>
        </div>

        <div className="card mt-4 space-y-2 text-[12.5px] sm:text-sm">
          <div className="flex justify-between">
            <span className="text-text-mid">Ticket · {phase.tabLabel}</span>
            <span>{formatKSh(ticketPrice)}</span>
          </div>
          <div className="h-px bg-white/8" />
          <div className="flex justify-between">
            <span className="text-text-mid">Buyer service fee</span>
            <span>{formatKSh(serviceFee)}</span>
          </div>
          <div className="h-px bg-white/8" />
          <div className="flex justify-between pt-1 text-sm font-bold sm:text-base">
            <span>Total due</span>
            <span>{formatKSh(total)}</span>
          </div>
        </div>

        <div className="card mt-4 px-3 py-4 text-center sm:px-4 sm:py-5">
          <span className="pill mx-auto mb-2.5 border-mpesa/35 bg-mpesa/15 text-mpesa">
            M-PESA · Till 400200
          </span>
          <p className="text-xs text-text-mid sm:text-sm">
            STK push sent to <strong className="text-text-hi">07XX•••234</strong>
          </p>
          <div
            className="my-3.5 text-[26px] font-bold text-text-hi sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {formatKSh(total)}
          </div>
          <p className="text-[11px] text-text-lo sm:text-xs">Enter M-Pesa PIN on your phone to confirm</p>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-white/8 bg-panel-glass p-3 text-[11.5px] leading-relaxed text-text-mid sm:text-xs">
          <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-emerald" />
          <p>
            Funds are held in our secure escrow till — not released to {seller.initials} until your
            transfer is verified.
          </p>
        </div>

        <button type="button" className="btn btn-primary mt-5 w-full">
          I&apos;ve entered my PIN
        </button>
        <p className="mt-3 text-center text-[11px] text-violet sm:text-xs">
          {event.title} · Seller {seller.initials}
        </p>
      </div>
    </div>
  )
}
