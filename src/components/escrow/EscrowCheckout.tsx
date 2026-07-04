import { useEffect, useState } from 'react'
import type { UserProfile } from '../../api/auth'
import {
  confirmEscrowPayment,
  initiatePurchase,
  verifyEscrowTransfer,
  type EscrowTransaction,
} from '../../api/escrow'
import { Icon } from '../icons/Icon'
import type { Event, Seller, TicketPhase } from '../../types/event'
import { formatKSh } from '../../utils/currency'

type CheckoutStep = 'review' | 'paying' | 'verify' | 'done'

interface EscrowCheckoutProps {
  context: { event: Event; phase: TicketPhase; seller: Seller } | null
  user: UserProfile | null
  onClose: () => void
  onComplete: (message: string) => void
  onLoginRequired: () => void
}

export function EscrowCheckout({
  context,
  user,
  onClose,
  onComplete,
  onLoginRequired,
}: EscrowCheckoutProps) {
  const isOpen = context !== null
  const [step, setStep] = useState<CheckoutStep>('review')
  const [transaction, setTransaction] = useState<EscrowTransaction | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!isOpen) {
      setStep('review')
      setTransaction(null)
      setVerifyCode('')
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  if (!context) return null

  const { event, phase, seller } = context

  async function handleStartPayment() {
    if (!user) {
      onLoginRequired()
      return
    }
    if (user.verification_status !== 'verified') {
      setError('Your account is pending manual verification. You can browse but not buy yet.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const txn = await initiatePurchase(seller.id)
      setTransaction(txn)
      setStep('paying')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmPayment() {
    if (!transaction) return
    setLoading(true)
    setError(null)
    try {
      const txn = await confirmEscrowPayment(transaction.id)
      setTransaction(txn)
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment confirmation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyTransfer() {
    if (!transaction) return
    setLoading(true)
    setError(null)
    try {
      await verifyEscrowTransfer(transaction.id, verifyCode.trim())
      setStep('done')
      onComplete('Ticket verified. Funds released to seller.')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

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

        {error ? (
          <div className="mt-3 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        ) : null}

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

        {step === 'review' ? (
          <>
            <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-white/8 bg-panel-glass p-3 text-[11.5px] leading-relaxed text-text-mid sm:text-xs">
              <Icon name="shield" size={15} className="mt-0.5 shrink-0 text-emerald" />
              <p>
                Funds stay in escrow until you confirm ticket receipt. Fraud leads to permanent ban
                and may be reported to authorities.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleStartPayment()}
              className="btn btn-primary mt-5 w-full disabled:opacity-60"
            >
              Pay with M-Pesa
            </button>
          </>
        ) : null}

        {step === 'paying' ? (
          <>
            <div className="card mt-4 px-3 py-4 text-center sm:px-4 sm:py-5">
              <span className="pill mx-auto mb-2.5 border-mpesa/35 bg-mpesa/15 text-mpesa">
                M-PESA · STK Push
              </span>
              <p className="text-xs text-text-mid sm:text-sm">
                STK push sent to{' '}
                <strong className="text-text-hi">{user?.phone_number ?? 'your phone'}</strong>
              </p>
              <div
                className="my-3.5 text-[26px] font-bold text-text-hi sm:text-3xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {formatKSh(total)}
              </div>
              <p className="text-[11px] text-text-lo sm:text-xs">
                Enter M-Pesa PIN on your phone, then confirm below (dev mode simulates payment)
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleConfirmPayment()}
              className="btn btn-primary mt-5 w-full disabled:opacity-60"
            >
              I&apos;ve entered my PIN
            </button>
          </>
        ) : null}

        {step === 'verify' && transaction?.transfer_code ? (
          <>
            <div className="card mt-4 space-y-3 text-center">
              <p className="text-sm text-text-mid">
                Payment secured. After the seller transfers your ticket, enter this code to confirm
                receipt:
              </p>
              <div
                className="text-3xl font-bold tracking-[0.25em] text-emerald"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {transaction.transfer_code}
              </div>
              <label className="block text-left">
                <span className="mb-1.5 block font-mono text-[10px] text-text-lo">
                  ENTER CODE TO CONFIRM
                </span>
                <div className="search-box justify-start text-sm">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={verifyCode}
                    onChange={(inputEvent) => setVerifyCode(inputEvent.target.value.replace(/\D/g, ''))}
                    placeholder="0000"
                    className="w-full bg-transparent font-mono tracking-[0.2em] text-text-hi outline-none"
                  />
                </div>
              </label>
            </div>
            <button
              type="button"
              disabled={loading || verifyCode.length !== 4}
              onClick={() => void handleVerifyTransfer()}
              className="btn btn-emerald mt-5 w-full disabled:opacity-60"
            >
              I received my ticket
            </button>
          </>
        ) : null}

        <p className="mt-3 text-center text-[11px] text-violet sm:text-xs">
          {event.title} · Seller {seller.initials}
        </p>
      </div>
    </div>
  )
}
