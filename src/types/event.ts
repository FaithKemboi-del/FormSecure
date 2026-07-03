export type PhaseStatus = 'AVAILABLE' | 'SOLD OUT'

export type PhaseFilter = 'all' | 'phase-1' | 'phase-2' | 'die-hard'

export type NavTab = 'home' | 'search' | 'saved' | 'wallet' | 'profile'

export interface Seller {
  id: string
  initials: string
  price: number
  savingsVsGate: number
}

export interface TicketPhase {
  id: string
  name: string
  tabLabel: string
  filterKey: Exclude<PhaseFilter, 'all'>
  originalFaceValue: number
  currentResalePrice: number | null
  estimatedGateValue: number
  status: PhaseStatus
  sellers: Seller[]
}

export interface Event {
  id: string
  title: string
  shortTitle: string
  venue: string
  date: string
  dateShort: string
  time?: string
  location: string
  gradientFrom: string
  gradientTo: string
  sellerCount: number
  soldOut: boolean
  waitlistPhaseLabel?: string
  phases: TicketPhase[]
}

export interface PhaseContext {
  event: Event
  phase: TicketPhase
}
