export type PhaseStatus = 'AVAILABLE' | 'SOLD OUT'

export interface TicketPhase {
  id: string
  name: string
  tabLabel: string
  originalFaceValue: number
  currentResalePrice: number | null
  estimatedGateValue: number
  status: PhaseStatus
}

export interface Event {
  id: string
  title: string
  venue: string
  date: string
  location: string
  imageUrl: string
  phases: TicketPhase[]
}

export interface PhaseContext {
  event: Event
  phase: TicketPhase
}
