const API_BASE = '/api/wishlist'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function addToWishlist(eventId: string): Promise<void> {
  await delay(180)
  const response = await fetch(`${API_BASE}/${eventId}`, {
    method: 'POST',
  }).catch(() => null)

  if (response && !response.ok) {
    throw new Error('Failed to add to wishlist')
  }
}

export async function removeFromWishlist(eventId: string): Promise<void> {
  await delay(180)
  const response = await fetch(`${API_BASE}/${eventId}`, {
    method: 'DELETE',
  }).catch(() => null)

  if (response && !response.ok) {
    throw new Error('Failed to remove from wishlist')
  }
}
