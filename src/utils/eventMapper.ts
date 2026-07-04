import type {
  ApiEventDetail,
  ApiEventSummary,
  ApiPhaseSummary,
  ApiPhaseWithListings,
} from '../api/events'
import type { Event, PhaseFilter, Seller, TicketPhase } from '../types/event'

const GRADIENTS: [string, string][] = [
  ['#7c3aed', '#1f1147'],
  ['#0ea5a0', '#052e2c'],
  ['#e11d48', '#4c0519'],
  ['#2563eb', '#172554'],
  ['#d97706', '#451a03'],
]

function gradientForId(id: string): [string, string] {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % GRADIENTS.length
  }
  return GRADIENTS[hash] ?? GRADIENTS[0]
}

function parseAmount(value: string | number): number {
  return typeof value === 'number' ? value : Number.parseFloat(value)
}

function formatEventDate(isoDate: string): {
  date: string
  dateShort: string
  time?: string
} {
  const dt = new Date(isoDate)
  const dateShort = dt.toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const time = dt.toLocaleTimeString('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return {
    date: `${dateShort} · ${time}`,
    dateShort,
    time,
  }
}

function tabLabelForSlug(slug: string, name: string): string {
  if (slug === 'die-hard') return 'Die-Hard'
  if (slug === 'phase-1') return 'Phase 1'
  if (slug === 'phase-2') return 'Phase 2'
  return name.split('(')[0]?.trim() || name
}

function initialsFromName(displayName: string): string {
  const parts = displayName.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'S'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}.`.toUpperCase()
}

function mapPhaseSummary(phase: ApiPhaseSummary, sellers: Seller[] = []): TicketPhase {
  const faceValue = parseAmount(phase.face_value)
  const gateValue = parseAmount(phase.estimated_gate_value)
  const lowestPrice =
    sellers.length > 0 ? Math.min(...sellers.map((seller) => seller.price)) : null

  return {
    id: phase.id,
    name: phase.name,
    tabLabel: tabLabelForSlug(phase.slug, phase.name),
    filterKey: phase.slug as TicketPhase['filterKey'],
    originalFaceValue: faceValue,
    currentResalePrice: lowestPrice,
    estimatedGateValue: gateValue,
    status: phase.status === 'sold_out' ? 'SOLD OUT' : 'AVAILABLE',
    sellers,
  }
}

function mapSellers(phase: ApiPhaseWithListings): Seller[] {
  return phase.listings.map((listing) => ({
    id: listing.id,
    initials: initialsFromName(listing.seller.display_name),
    price: parseAmount(listing.asking_price),
    savingsVsGate: parseAmount(listing.savings_vs_gate),
  }))
}

function mapEventBase(
  summary: ApiEventSummary | ApiEventDetail,
  phases: TicketPhase[],
): Event {
  const [gradientFrom, gradientTo] = gradientForId(summary.id)
  const { date, dateShort, time } = formatEventDate(summary.event_date)
  const activeCount =
    'active_listing_count' in summary
      ? summary.active_listing_count
      : phases.reduce((total, phase) => total + phase.sellers.length, 0)
  const allSoldOut =
    phases.length > 0 &&
    phases.every((phase) => phase.status === 'SOLD OUT' || phase.sellers.length === 0) &&
    activeCount === 0

  const waitlistPhase = phases.find((phase) => phase.status === 'SOLD OUT')

  return {
    id: summary.id,
    title: summary.title,
    shortTitle: `${summary.title} — ${summary.venue}`,
    venue: summary.venue,
    date,
    dateShort,
    time,
    location: summary.location,
    gradientFrom,
    gradientTo,
    sellerCount: activeCount,
    soldOut: allSoldOut,
    waitlistPhaseLabel: waitlistPhase?.name,
    phases,
  }
}

export function mapEventSummary(apiEvent: ApiEventSummary): Event {
  const phases = apiEvent.phases.map((phase) => {
    const sellers: Seller[] = []
    return mapPhaseSummary(phase, sellers)
  })

  for (const phase of phases) {
    if (apiEvent.lowest_active_price && phase.status === 'AVAILABLE') {
      phase.currentResalePrice = parseAmount(apiEvent.lowest_active_price)
    }
  }

  return mapEventBase(apiEvent, phases)
}

export function mapEventDetail(apiEvent: ApiEventDetail): Event {
  const phases = apiEvent.phases.map((phase) => mapPhaseSummary(phase, mapSellers(phase)))
  return mapEventBase(apiEvent, phases)
}

export function getFeaturedPhase(event: Event): TicketPhase {
  const available = event.phases.find(
    (phase) => phase.status === 'AVAILABLE' && phase.currentResalePrice !== null,
  )
  return available ?? event.phases[0]
}

export function eventMatchesPhaseFilter(event: Event, filter: PhaseFilter): boolean {
  if (filter === 'all') return true
  return event.phases.some((phase) => phase.filterKey === filter)
}
