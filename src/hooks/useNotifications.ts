import { useCallback, useEffect, useState } from 'react'
import { getAccessToken } from '../api/client'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../api/notifications'

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enabled || !getAccessToken()) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    try {
      const response = await fetchNotifications()
      setNotifications(response.items)
      setUnreadCount(response.unread_count)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const markRead = useCallback(
    async (notificationId: string) => {
      await markNotificationRead(notificationId)
      await reload()
    },
    [reload],
  )

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    await reload()
  }, [reload])

  return {
    notifications,
    unreadCount,
    loading,
    reload,
    markRead,
    markAllRead,
  }
}
