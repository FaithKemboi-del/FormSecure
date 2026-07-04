import { apiFetch } from './client'

export interface AppNotification {
  id: string
  notification_type: string
  title: string
  body: string
  event_id: string | null
  listing_id: string | null
  read_at: string | null
  created_at: string
}

export async function fetchNotifications(unreadOnly = false): Promise<{
  items: AppNotification[]
  unread_count: number
}> {
  const query = unreadOnly ? '?unread_only=true' : ''
  return apiFetch(`/api/notifications${query}`)
}

export async function markNotificationRead(notificationId: string): Promise<AppNotification> {
  return apiFetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch('/api/notifications/read-all', { method: 'POST' })
}
