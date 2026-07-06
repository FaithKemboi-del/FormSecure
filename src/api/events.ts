import { apiFetch } from './client'

export interface ApiPhaseSummary {
  id: string
  name: string
  slug: string
  face_value: string
  estimated_gate_value: string
  status: string
  active_listing_count: number
}

export interface ApiEventSummary {
  id: string
  title: string
  venue: string
  location: string
  event_date: string
  image_url: string | null
  lowest_active_price: string | null
  active_listing_count: number
  phases: ApiPhaseSummary[]
}

export interface ApiSellerSummary {
  id: string
  display_name: string
  rating: number | null
}

export interface ApiListingPublic {
  id: string
  asking_price: string
  savings_vs_gate: string
  estimated_gate_value: string
  seller: ApiSellerSummary
  status: string
}

export interface ApiPhaseWithListings extends ApiPhaseSummary {
  listings: ApiListingPublic[]
}

export interface ApiEventDetail {
  id: string
  title: string
  venue: string
  location: string
  event_date: string
  image_url: string | null
  phases: ApiPhaseWithListings[]
}

export interface EventListParams {
  location?: string
  phase_slug?: string
  phase_available?: boolean
  min_price?: number
  max_price?: number
}

export async function fetchEvents(params: EventListParams = {}): Promise<{
  items: ApiEventSummary[]
  total: number
}> {
  const search = new URLSearchParams()
  if (params.location) search.set('location', params.location)
  if (params.phase_slug) search.set('phase_slug', params.phase_slug)
  if (params.phase_available !== undefined) {
    search.set('phase_available', String(params.phase_available))
  }
  if (params.min_price !== undefined) search.set('min_price', String(params.min_price))
  if (params.max_price !== undefined) search.set('max_price', String(params.max_price))

  const query = search.toString()
  return apiFetch(`/api/events${query ? `?${query}` : ''}`)
}

export async function fetchEventDetail(eventId: string): Promise<ApiEventDetail> {
  return apiFetch(`/api/events/${eventId}`)
}
