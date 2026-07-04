import { useEffect, useState } from 'react'
import { requestOtp, verifyOtp } from '../../api/auth'
import { Icon } from '../icons/Icon'

type LoginStep = 'phone' | 'otp'

interface LoginSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LoginSheet({ open, onClose, onSuccess }: LoginSheetProps) {
  const [step, setStep] = useState<LoginStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setStep('phone')
      setPhoneNumber('')
      setOtp('')
      setFullName('')
      setError(null)
      setLoading(false)
    }
  }, [open])

  if (!open) return null

  async function handleRequestOtp() {
    setLoading(true)
    setError(null)
    try {
      await requestOtp(phoneNumber.trim())
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    setLoading(true)
    setError(null)
    try {
      await verifyOtp(
        phoneNumber.trim(),
        otp.trim(),
        fullName.trim() || undefined,
      )
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close login sheet"
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
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-emerald-dim">
            <Icon name="shield" size={16} className="text-emerald" />
          </div>
          <h2 className="h-title text-[14.5px] sm:text-base">
            {step === 'phone' ? 'Log in with your phone' : 'Enter verification code'}
          </h2>
        </div>

        <p className="mb-3.5 text-[11.5px] leading-relaxed text-text-mid sm:text-sm">
          {step === 'phone'
            ? 'We send a 6-digit code via SMS. In development, check the backend terminal for the OTP.'
            : `Code sent to ${phoneNumber}. First time? Add your name below.`}
        </p>

        {error ? (
          <div className="mb-3 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        ) : null}

        {step === 'phone' ? (
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
        ) : null}

        {step === 'otp' ? (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] text-text-lo">6-DIGIT CODE</span>
              <div className="search-box justify-start text-sm">
                <Icon name="shield" size={15} className="text-text-lo" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-transparent font-mono tracking-[0.2em] text-text-hi outline-none placeholder:text-text-lo"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] text-text-lo">YOUR NAME (NEW ACCOUNTS)</span>
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
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          {step !== 'phone' ? (
            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep('phone')
              }}
              className="btn btn-ghost flex-1"
            >
              Back
            </button>
          ) : null}

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (step === 'phone') void handleRequestOtp()
              else void handleVerifyOtp()
            }}
            className="btn btn-emerald flex-1 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : step === 'phone' ? 'Send code' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  )
}
