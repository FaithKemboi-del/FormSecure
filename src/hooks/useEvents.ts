import { useCallback, useEffect, useState } from 'react'
import { fetchEvents } from '../api/events'
import { mapEventSummary } from '../utils/eventMapper'
import type { Event, PhaseFilter } from '../types/event'

interface UseEventsOptions {
  phaseFilter: PhaseFilter
  searchQuery: string
}

export function useEvents({ phaseFilter, searchQuery }: UseEventsOptions) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params =
        phaseFilter !== 'all'
          ? { phase_slug: phaseFilter, phase_available: true }
          : {}
      const response = await fetchEvents(params)
      let mapped = response.items.map(mapEventSummary)

      const query = searchQuery.trim().toLowerCase()
      if (query.length > 0) {
        mapped = mapped.filter(
          (event) =>
            event.title.toLowerCase().includes(query) ||
            event.venue.toLowerCase().includes(query) ||
            event.location.toLowerCase().includes(query),
        )
      }

      setEvents(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [phaseFilter, searchQuery])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  return { events, loading, error, reload: loadEvents }
}
