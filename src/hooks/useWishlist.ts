import { useCallback, useEffect, useState } from 'react'
import { addToWishlist, removeFromWishlist } from '../api/wishlist'

const WISHLIST_STORAGE_KEY = 'formsecure-wishlist'

function loadWishlistFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

interface UseWishlistOptions {
  onToggle?: (message: string) => void
}

export function useWishlist({ onToggle }: UseWishlistOptions = {}) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(loadWishlistFromStorage()))
  const [animatingId, setAnimatingId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([...savedIds]))
  }, [savedIds])

  const isSaved = useCallback((eventId: string) => savedIds.has(eventId), [savedIds])

  const toggleWishlist = useCallback(
    async (eventId: string) => {
      let wasSaved = false

      setSavedIds((prev) => {
        wasSaved = prev.has(eventId)
        const next = new Set(prev)
        if (wasSaved) next.delete(eventId)
        else next.add(eventId)
        return next
      })

      setAnimatingId(eventId)
      window.setTimeout(() => setAnimatingId(null), 280)

      onToggle?.(wasSaved ? 'Removed from wishlist' : 'Added to wishlist')

      try {
        if (wasSaved) await removeFromWishlist(eventId)
        else await addToWishlist(eventId)
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev)
          if (wasSaved) next.add(eventId)
          else next.delete(eventId)
          return next
        })
        onToggle?.('Could not update wishlist — try again')
      }
    },
    [onToggle],
  )

  return {
    savedIds,
    isSaved,
    toggleWishlist,
    animatingId,
    savedCount: savedIds.size,
  }
}
