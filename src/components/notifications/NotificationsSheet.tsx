import { useEffect } from 'react'
import type { AppNotification } from '../../api/notifications'
import { Icon } from '../icons/Icon'

interface NotificationsSheetProps {
  open: boolean
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  onClose: () => void
  onMarkRead: (notificationId: string) => void
  onMarkAllRead: () => void
}

export function NotificationsSheet({
  open,
  notifications,
  unreadCount,
  loading,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: NotificationsSheetProps) {
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-start sm:justify-end sm:p-4">
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="animate-slide-up relative flex max-h-[75dvh] w-full max-w-lg flex-col rounded-t-[22px] border border-white/8 bg-panel shadow-[0_-20px_40px_rgba(0,0,0,0.4)] sm:max-h-[80dvh] sm:rounded-[22px]"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-[18px] py-4">
          <div>
            <h2 className="h-title text-base">Notifications</h2>
            <p className="text-xs text-text-lo">
              {unreadCount} unread
            </p>
          </div>
          {unreadCount > 0 ? (
            <button type="button" onClick={onMarkAllRead} className="pill pill-on">
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="overflow-y-auto px-[18px] py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-mid">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-dim">
                <Icon name="bell" size={20} className="text-violet" />
              </div>
              <p className="text-sm text-text-mid">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.read_at) onMarkRead(notification.id)
                  }}
                  className={`card w-full text-left ${
                    notification.read_at ? 'opacity-70' : 'border-emerald/20'
                  }`}
                >
                  <div className="text-sm font-semibold text-text-hi">{notification.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-text-mid">{notification.body}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
