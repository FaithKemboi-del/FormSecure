import { useEffect, useState } from 'react'
import type { UserProfile } from '../../api/auth'
import { joinWaitlist } from '../../api/waitlist'
import type { Event } from '../../types/event'
import { getWaitlistPhase } from '../../utils/waitlist'
import { Icon } from '../icons/Icon'

interface WaitlistSheetProps {
  event: Event | null
  user: UserProfile | null
  onClose: () => void
  onLoginRequired: () => void
  onSuccess: (message: string) => void
}

export function WaitlistSheet({
  event,
  user,
  onClose,
  onLoginRequired,
  onSuccess,
}: WaitlistSheetProps) {
  const isOpen = event !== null
  const [email, setEmail] = useState('')
  const [maxBudget, setMaxBudget] = useState('3000')
  const [notifyViaEmail, setNotifyViaEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setLoading(false)
      return
    }
    setEmail(user?.email ?? '')
    const phase = event ? getWaitlistPhase(event) : null
    setMaxBudget(String(phase?.estimatedGateValue ?? phase?.originalFaceValue ?? 3000))
  }, [isOpen, user?.email, event])

  if (!event) return null

  const waitlistEvent = event
  const phase = getWaitlistPhase(waitlistEvent)

  async function handleSubmit() {
    if (!user) {
      onLoginRequired()
      return
    }

    const budget = Number.parseFloat(maxBudget)
    if (!Number.isFinite(budget) || budget <= 0) {
      setError('Enter a valid max budget.')
      return
    }
    if (notifyViaEmail && !email.trim()) {
      setError('Email is required for email alerts.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await joinWaitlist({
        event_id: waitlistEvent.id,
        phase_id: phase.id,
        max_budget: budget,
        email: email.trim() || undefined,
        notify_via_email: notifyViaEmail,
      })
      onSuccess(
        notifyViaEmail
          ? 'You will be notified in the app and by email when a ticket drops.'
          : 'You will be notified in the app when a ticket drops.',
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join waitlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close waitlist sheet"
        onClick={onClose}
        className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="animate-slide-up relative w-full max-w-lg rounded-t-[22px] border border-white/8 bg-panel px-[18px] pb-[max(22px,env(safe-area-inset-bottom))] pt-[18px] shadow-[0_-20px_40px_rgba(0,0,0,0.4)] sm:mx-4 sm:mb-4 sm:rounded-[22px] lg:max-w-xl"
      >
        <div className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-white/8" />

        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-violet-dim">
            <Icon name="bell" size={16} className="text-violet" />
          </div>
          <h2 className="h-title text-[14.5px] sm:text-base">Join the {phase.tabLabel} waitlist</h2>
        </div>

        <p className="mb-3.5 text-[11.5px] leading-relaxed text-text-mid sm:text-sm">
          Get alerted in the app{notifyViaEmail ? ' and by email' : ''} when a{' '}
          <span className="text-text-hi">{waitlistEvent.title}</span> ticket drops within your budget.
        </p>

        {error ? (
          <div className="mb-3 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        ) : null}

        <div className="space-y-2.5">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] text-text-lo">PHONE</span>
            <div className="search-box justify-start text-sm text-text-mid">
              <Icon name="chat" size={14} />
              {user?.phone_number ?? 'Log in to continue'}
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] text-text-lo">EMAIL FOR ALERTS</span>
            <div className="search-box justify-start text-sm">
              <Icon name="user" size={14} className="text-text-lo" />
              <input
                type="email"
                value={email}
                onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                placeholder="you@email.com"
                className="w-full bg-transparent text-text-hi outline-none placeholder:text-text-lo"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] text-text-lo">MAX BUDGET (KSH)</span>
            <div className="search-box justify-start text-sm">
              <Icon name="ticket" size={14} className="text-text-lo" />
              <input
                type="number"
                min={1}
                value={maxBudget}
                onChange={(inputEvent) => setMaxBudget(inputEvent.target.value)}
                className="w-full bg-transparent text-text-hi outline-none"
              />
            </div>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-mid">
            <input
              type="checkbox"
              checked={notifyViaEmail}
              onChange={(inputEvent) => setNotifyViaEmail(inputEvent.target.checked)}
              className="accent-emerald"
            />
            Also send email alerts
          </label>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSubmit()}
          className="btn btn-primary mt-4 w-full disabled:opacity-60"
        >
          Notify me <Icon name="bell" size={14} />
        </button>
      </div>
    </div>
  )
}
