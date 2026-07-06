import type { Event, TicketPhase } from '../types/event'

export function getWaitlistPhase(event: Event): TicketPhase {
  const soldOutPhase = event.phases.find((phase) => phase.status === 'SOLD OUT')
  if (soldOutPhase) return soldOutPhase

  const dieHard = event.phases.find((phase) => phase.filterKey === 'die-hard')
  if (dieHard) return dieHard

  return event.phases[event.phases.length - 1]
}
