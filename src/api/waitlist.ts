import { apiFetch } from './client'

export interface WaitlistEntry {
  id: string
  event_id: string
  event_title: string
  phase_id: string
  phase_name: string
  max_budget: string
  email: string | null
  notify_via_email: boolean
  created_at: string
}

export interface JoinWaitlistPayload {
  event_id: string
  phase_id: string
  max_budget: number
  email?: string
  notify_via_email?: boolean
}

export async function joinWaitlist(payload: JoinWaitlistPayload): Promise<WaitlistEntry> {
  return apiFetch('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchMyWaitlist(): Promise<{ items: WaitlistEntry[] }> {
  return apiFetch('/api/waitlist/mine')
}

export async function leaveWaitlist(entryId: string): Promise<void> {
  return apiFetch(`/api/waitlist/${entryId}`, { method: 'DELETE' })
}
