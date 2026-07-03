import { useEffect } from 'react'
import { Icon } from '../icons/Icon'
import type { Event } from '../../types/event'

interface WaitlistSheetProps {
  event: Event | null
  onClose: () => void
}

export function WaitlistSheet({ event, onClose }: WaitlistSheetProps) {
  const isOpen = event !== null

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

  if (!event) return null

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
          <h2 className="h-title text-[14.5px] sm:text-base">Join the Die-Hard waitlist</h2>
        </div>

        <p className="mb-3.5 text-[11.5px] leading-relaxed text-text-mid sm:text-sm">
          You are entering the waitlist exclusively for{' '}
          <span className="text-text-hi">{event.title}</span> tickets. We&apos;ll ping your WhatsApp
          the second a matching ticket drops.
        </p>

        <div className="space-y-2.5">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] text-text-lo">WHATSAPP NUMBER</span>
            <div className="search-box justify-start text-sm">
              <Icon name="chat" size={14} />
              +254 7•• ••• •••
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] text-text-lo">MAX BUDGET</span>
            <div className="search-box justify-start text-sm">KSh 3,000</div>
          </label>
        </div>

        <button type="button" className="btn btn-primary mt-4 w-full">
          Notify me <Icon name="bell" size={14} />
        </button>
      </div>
    </div>
  )
}
