import { useState, useEffect, useCallback, useRef } from 'react'
import { onAuthChange, saveApiKey, getApiKey, deleteApiKey, getAllApiKeys, type User } from './firebase'

// ─── Auth state ───────────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(u => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  return { user, authLoading }
}

// ─── Per-modal key hook ───────────────────────────────────────────────────────
export function useApiKey(user: User | null, apiName: string) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const cache = useRef<Record<string, string>>({})

  // Load key when user or apiName changes
  useEffect(() => {
    if (!user) { setKey(''); return }
    // Check in-memory cache first
    if (cache.current[apiName] !== undefined) {
      setKey(cache.current[apiName])
      return
    }
    setLoading(true)
    getApiKey(user.uid, apiName).then(k => {
      cache.current[apiName] = k
      setKey(k)
      setLoading(false)
    })
  }, [user, apiName])

  const save = useCallback(async (newKey: string) => {
    if (!user) return
    setLoading(true)
    await saveApiKey(user.uid, apiName, newKey)
    cache.current[apiName] = newKey
    setKey(newKey)
    setLoading(false)
  }, [user, apiName])

  const remove = useCallback(async () => {
    if (!user) return
    setLoading(true)
    await deleteApiKey(user.uid, apiName)
    cache.current[apiName] = ''
    setKey('')
    setLoading(false)
  }, [user, apiName])

  return { key, loading, save, remove }
}

// ─── Preload all keys for a user (call once on login) ────────────────────────
export async function preloadAllKeys(uid: string): Promise<Record<string, string>> {
  return getAllApiKeys(uid)
}
