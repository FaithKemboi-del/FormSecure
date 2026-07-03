import { Icon } from '../icons/Icon'

interface ToastProps {
  message: string | null
}

export function Toast({ message }: ToastProps) {
  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[70] w-[min(90vw,320px)] -translate-x-1/2"
    >
      <div className="flex items-center gap-2 rounded-full border border-emerald/30 bg-panel/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <Icon name="heart-filled" size={14} className="text-emerald" />
        <span className="text-sm font-medium text-text-hi">{message}</span>
      </div>
    </div>
  )
}
