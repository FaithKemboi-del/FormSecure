import { useEffect, useState } from 'react'
import { login, signup } from '../../api/auth'
import { Icon } from '../icons/Icon'

type AuthMode = 'signup' | 'login'

interface LoginSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LoginSheet({ open, onClose, onSuccess }: LoginSheetProps) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setMode('signup')
      setPhoneNumber('')
      setFullName('')
      setAcceptTerms(false)
      setError(null)
      setSuccessMessage(null)
      setLoading(false)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit() {
    if (!acceptTerms) {
      setError('You must accept the Terms of Service.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const result =
        mode === 'signup'
          ? await signup(phoneNumber.trim(), fullName.trim(), acceptTerms)
          : await login(phoneNumber.trim(), acceptTerms)

      if (result.verification_status === 'verified') {
        onSuccess()
        onClose()
        return
      }

      setSuccessMessage(
        'Account created. Manual verification usually takes a few hours before you can buy or sell.',
      )
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close auth sheet"
        onClick={onClose}
        className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="animate-slide-up relative w-full max-w-lg rounded-t-[22px] border border-white/8 bg-panel px-[18px] pb-[max(22px,env(safe-area-inset-bottom))] pt-[18px] shadow-[0_-20px_40px_rgba(0,0,0,0.4)] sm:mx-4 sm:mb-4 sm:rounded-[22px] lg:max-w-xl"
      >
        <div className="mx-auto mb-3.5 h-1 w-9 rounded-full bg-white/8" />

        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-emerald-dim">
              <Icon name="shield" size={16} className="text-emerald" />
            </div>
            <h2 className="h-title text-[14.5px] sm:text-base">
              {mode === 'signup' ? 'Create account' : 'Welcome back'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setMode(mode === 'signup' ? 'login' : 'signup')
            }}
            className="pill text-[10px]"
          >
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        </div>

        <p className="mb-3.5 text-[11.5px] leading-relaxed text-text-mid sm:text-sm">
          No SMS code required during early access. We manually verify new accounts before you can
          buy or sell. Fraudulent activity leads to permanent ban and may be reported to authorities.
        </p>

        {error ? (
          <div className="mb-3 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-3 rounded-[12px] border border-emerald/30 bg-emerald-dim px-3 py-2 text-xs text-emerald">
            {successMessage}
          </div>
        ) : null}

        <div className="space-y-3">
          {mode === 'signup' ? (
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] text-text-lo">FULL NAME</span>
              <div className="search-box justify-start text-sm">
                <Icon name="user" size={15} className="text-text-lo" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Faith K."
                  className="w-full bg-transparent text-text-hi outline-none placeholder:text-text-lo"
                />
              </div>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] text-text-lo">PHONE NUMBER</span>
            <div className="search-box justify-start text-sm">
              <Icon name="chat" size={15} className="text-text-lo" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="0712 345 678"
                className="w-full bg-transparent text-text-hi outline-none placeholder:text-text-lo"
              />
            </div>
          </label>

          <label className="flex items-start gap-2 text-xs leading-relaxed text-text-mid">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              className="mt-0.5 accent-emerald"
            />
            I agree to the Terms of Service and understand that fraud results in permanent ban and
            may be reported to law enforcement.
          </label>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSubmit()}
          className="btn btn-emerald mt-4 w-full disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </div>
    </div>
  )
}
