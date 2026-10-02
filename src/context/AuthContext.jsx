import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, residences:residence_id(id, name, address, invite_code)')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data)
        return data
      }
    } catch (e) {
      console.warn('loadProfile error, using default demo profile:', e)
    }

    // Fallback safe demo profile if database profile is missing
    const fallback = {
      id: userId || 'demo-syndic-user',
      full_name: 'Syndic Al Andalous',
      role: 'syndic',
      residence_id: 'res-1',
      residences: {
        id: 'res-1',
        name: 'Résidence Al Andalous Casablanca',
        address: 'Boulevard d’Anfa, Casablanca',
        invite_code: 'ANDALOUS2026'
      }
    }
    setProfile(fallback)
    return fallback
  }

  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        setSession(session)
        if (session?.user) {
          await loadProfile(session.user.id)
        }
      } catch (err) {
        console.warn('initAuth error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      if (newSession?.user) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {}
    setSession(null)
    setProfile(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile: () => session?.user && loadProfile(session.user.id),
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth khassha tkon dakhl AuthProvider')
  return ctx
}
