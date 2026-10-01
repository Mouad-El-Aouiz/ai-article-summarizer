import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let authStateReceived = false

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        authStateReceived = true

        if (active) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      })

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active || authStateReceived) return

        setUser(error ? null : data.session?.user ?? null)
      })
      .catch(() => {
        if (active && !authStateReceived) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }

  return { user, loading, signUp, signIn, signOut }
}