import type { Event } from '../types/event'

export const mockEvents: Event[] = [
  {
    id: 'evt-watendawili-nairobi',
    title: 'Watendawili Live Performance',
    venue: 'KICC Amphitheatre',
    date: 'Sat, 19 Jul 2026',
    location: 'Nairobi, Kenya',
    imageUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop',
    phases: [
      {
        id: 'phase-1-early-bird',
        name: 'Phase 1 (Early Bird)',
        tabLabel: 'Phase 1',
        originalFaceValue: 1500,
        currentResalePrice: 1800,
        estimatedGateValue: 2500,
        status: 'AVAILABLE',
      },
      {
        id: 'phase-2-main-wave',
        name: 'Phase 2 (Main Wave)',
        tabLabel: 'Phase 2',
        originalFaceValue: 2500,
        currentResalePrice: 2800,
        estimatedGateValue: 3500,
        status: 'AVAILABLE',
      },
      {
        id: 'phase-die-hard-vip',
        name: 'Die-Hard (Final / VIP)',
        tabLabel: 'Die Hard',
        originalFaceValue: 4000,
        currentResalePrice: null,
        estimatedGateValue: 5500,
        status: 'SOLD OUT',
      },
    ],
  },
]
