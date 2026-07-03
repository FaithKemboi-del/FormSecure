import type { Event } from '../types/event'

export const mockEvents: Event[] = [
  {
    id: 'evt-watendawili-nairobi',
    title: 'Watendawili Live',
    shortTitle: 'Watendawili Live — KICC Amphitheatre',
    venue: 'KICC Amphitheatre',
    date: 'Sat, 12 Jul 2026 · 7PM',
    dateShort: 'Sat, 12 Jul',
    time: '7PM',
    location: 'Nairobi',
    gradientFrom: '#7c3aed',
    gradientTo: '#1f1147',
    sellerCount: 3,
    soldOut: false,
    phases: [
      {
        id: 'watendawili-phase-1',
        name: 'Phase 1 (Early Bird)',
        tabLabel: 'Phase 1',
        filterKey: 'phase-1',
        originalFaceValue: 1500,
        currentResalePrice: 1800,
        estimatedGateValue: 2500,
        status: 'AVAILABLE',
        sellers: [
          { id: 's1', initials: 'M.K.', price: 2500, savingsVsGate: 1300 },
          { id: 's2', initials: 'A.O.', price: 2700, savingsVsGate: 1100 },
        ],
      },
      {
        id: 'watendawili-phase-2',
        name: 'Phase 2 (Main Wave)',
        tabLabel: 'Phase 2',
        filterKey: 'phase-2',
        originalFaceValue: 2500,
        currentResalePrice: 2800,
        estimatedGateValue: 3800,
        status: 'AVAILABLE',
        sellers: [
          { id: 's3', initials: 'J.N.', price: 2800, savingsVsGate: 1000 },
          { id: 's4', initials: 'P.W.', price: 3000, savingsVsGate: 800 },
        ],
      },
      {
        id: 'watendawili-die-hard',
        name: 'Die-Hard (Final / VIP)',
        tabLabel: 'Die-Hard',
        filterKey: 'die-hard',
        originalFaceValue: 4000,
        currentResalePrice: null,
        estimatedGateValue: 5500,
        status: 'SOLD OUT',
        sellers: [],
      },
    ],
  },
  {
    id: 'evt-blankets-wine',
    title: 'Blankets & Wine',
    shortTitle: 'Blankets & Wine — Ngong Racecourse',
    venue: 'Ngong Racecourse',
    date: 'Sun, 20 Jul 2026 · 12PM',
    dateShort: 'Sun, 20 Jul',
    time: '12PM',
    location: 'Nairobi',
    gradientFrom: '#0ea5a0',
    gradientTo: '#052e2c',
    sellerCount: 0,
    soldOut: true,
    waitlistPhaseLabel: 'VIP · Phase 2',
    phases: [
      {
        id: 'blankets-phase-1',
        name: 'Phase 1 (Early Bird)',
        tabLabel: 'Phase 1',
        filterKey: 'phase-1',
        originalFaceValue: 1800,
        currentResalePrice: null,
        estimatedGateValue: 2600,
        status: 'SOLD OUT',
        sellers: [],
      },
      {
        id: 'blankets-phase-2',
        name: 'Phase 2 (Main Wave)',
        tabLabel: 'Phase 2',
        filterKey: 'phase-2',
        originalFaceValue: 2800,
        currentResalePrice: null,
        estimatedGateValue: 4000,
        status: 'SOLD OUT',
        sellers: [],
      },
      {
        id: 'blankets-die-hard',
        name: 'Die-Hard (Final / VIP)',
        tabLabel: 'Die-Hard',
        filterKey: 'die-hard',
        originalFaceValue: 4500,
        currentResalePrice: null,
        estimatedGateValue: 6200,
        status: 'SOLD OUT',
        sellers: [],
      },
    ],
  },
  {
    id: 'evt-sauti-sol-homecoming',
    title: 'Sauti Sol Homecoming',
    shortTitle: 'Sauti Sol Homecoming — Carnivore Grounds',
    venue: 'Carnivore Grounds',
    date: 'Fri, 8 Aug 2026 · 6PM',
    dateShort: 'Fri, 8 Aug',
    time: '6PM',
    location: 'Nairobi',
    gradientFrom: '#db2777',
    gradientTo: '#4a044e',
    sellerCount: 2,
    soldOut: false,
    phases: [
      {
        id: 'sauti-phase-1',
        name: 'Phase 1 (Early Bird)',
        tabLabel: 'Phase 1',
        filterKey: 'phase-1',
        originalFaceValue: 2000,
        currentResalePrice: 2400,
        estimatedGateValue: 3200,
        status: 'AVAILABLE',
        sellers: [
          { id: 's5', initials: 'L.M.', price: 2400, savingsVsGate: 800 },
        ],
      },
      {
        id: 'sauti-phase-2',
        name: 'Phase 2 (Main Wave)',
        tabLabel: 'Phase 2',
        filterKey: 'phase-2',
        originalFaceValue: 3500,
        currentResalePrice: 3900,
        estimatedGateValue: 4800,
        status: 'AVAILABLE',
        sellers: [
          { id: 's6', initials: 'D.K.', price: 3900, savingsVsGate: 900 },
          { id: 's7', initials: 'R.T.', price: 4100, savingsVsGate: 700 },
        ],
      },
      {
        id: 'sauti-die-hard',
        name: 'Die-Hard (Final / VIP)',
        tabLabel: 'Die-Hard',
        filterKey: 'die-hard',
        originalFaceValue: 6000,
        currentResalePrice: 6500,
        estimatedGateValue: 7500,
        status: 'AVAILABLE',
        sellers: [
          { id: 's8', initials: 'N.B.', price: 6500, savingsVsGate: 1000 },
        ],
      },
    ],
  },
]

export function getFeaturedPhase(event: Event) {
  const available = event.phases.find(
    (phase) => phase.status === 'AVAILABLE' && phase.currentResalePrice !== null,
  )
  return available ?? event.phases[0]
}

export function eventMatchesPhaseFilter(
  event: Event,
  filter: import('../types/event').PhaseFilter,
): boolean {
  if (filter === 'all') return true
  return event.phases.some((phase) => phase.filterKey === filter)
}
