import { useCallback, useEffect, useState } from 'react'

interface ToastState {
  id: number
  message: string
}

export function useToast(durationMs = 2400) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback(
    (message: string) => {
      setToast({ id: Date.now(), message })
    },
    [],
  )

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), durationMs)
    return () => window.clearTimeout(timer)
  }, [toast, durationMs])

  return { toast, showToast }
}
