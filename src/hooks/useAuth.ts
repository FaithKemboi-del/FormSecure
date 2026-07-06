import { useCallback, useEffect, useState } from 'react'
import { clearTokens, getAccessToken } from '../api/client'
import { fetchMe, type UserProfile } from '../api/auth'

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const profile = await fetchMe()
      setUser(profile)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const onLoginSuccess = useCallback(async () => {
    setLoading(true)
    await loadUser()
  }, [loadUser])

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    logout,
    onLoginSuccess,
    refreshUser: loadUser,
  }
}
