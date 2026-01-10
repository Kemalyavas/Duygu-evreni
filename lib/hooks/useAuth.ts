'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { supabaseFetch } from '@/lib/supabase/fetch'
import { useStore } from '@/lib/store/useStore'
import type { Profile } from '@/types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Global flag to track if auth has been checked
let authChecked = false

export function useAuth() {
  const { user, profile, setUser, setProfile } = useStore()
  const [isLoading, setIsLoading] = useState(!authChecked)
  const supabaseRef = useRef(createClient())

  // Fetch user session on mount
  useEffect(() => {
    if (authChecked) {
      setIsLoading(false)
      return
    }

    let timeoutId: NodeJS.Timeout
    let isMounted = true
    const supabase = supabaseRef.current

    const getSession = async () => {
      // Set a timeout to prevent hanging forever
      timeoutId = setTimeout(() => {
        console.warn('[Auth] Session check timed out')
        if (isMounted) {
          authChecked = true
          setIsLoading(false)
        }
      }, 5000)

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        clearTimeout(timeoutId)

        if (error) {
          // Handle fetch errors gracefully (network issues, etc.)
          console.warn('[Auth] Could not fetch session:', error.message)
          if (isMounted) {
            authChecked = true
            setIsLoading(false)
          }
          return
        }

        if (session?.user && isMounted) {
          setUser({ id: session.user.id, email: session.user.email || '' })

          // Fetch profile using fetch API with access token for RLS
          try {
            const { data: profileData } = await supabaseFetch<Profile>('profiles', {
              filter: `id=eq.${session.user.id}`,
              single: true,
              accessToken: session.access_token,
            })

            if (profileData && isMounted) {
              setProfile(profileData)
            }
          } catch {
            console.warn('[Auth] Could not fetch profile')
          }
        }
      } catch (err) {
        // Silently handle network errors
        console.warn('[Auth] Network error:', err instanceof Error ? err.message : 'Unknown error')
        clearTimeout(timeoutId)
      } finally {
        if (isMounted) {
          authChecked = true
          setIsLoading(false)
        }
      }
    }

    getSession()

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null

    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!isMounted) return

          if (event === 'SIGNED_IN' && session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' })

            // Fetch profile using fetch API with access token for RLS
            try {
              const { data: profileData } = await supabaseFetch<Profile>('profiles', {
                filter: `id=eq.${session.user.id}`,
                single: true,
                accessToken: session.access_token,
              })

              if (profileData && isMounted) {
                setProfile(profileData)
              }
            } catch {
              console.warn('[Auth] Could not fetch profile on sign in')
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setProfile(null)
          }
        }
      )
      subscription = data.subscription
    } catch (err) {
      console.warn('[Auth] Could not setup auth listener:', err)
    }

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [setUser, setProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabaseRef.current.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Manually update state immediately after successful login
      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email || '' })

        // Fetch and set profile
        try {
          const { data: profileData } = await supabaseFetch<Profile>('profiles', {
            filter: `id=eq.${data.session.user.id}`,
            single: true,
            accessToken: data.session.access_token,
          })

          if (profileData) {
            setProfile(profileData)
          }
        } catch {
          console.warn('[Auth] Could not fetch profile on sign in')
        }
      }

      return data
    },
    [setUser, setProfile]
  )

  const signUp = useCallback(
    async (email: string, password: string, username?: string) => {
      const { data, error } = await supabaseRef.current.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      // If username is provided and signup was successful, update the profile
      if (username && data.user) {
        const { error: profileError } = await supabaseRef.current
          .from('profiles')
          .update({ username })
          .eq('id', data.user.id)

        if (profileError) {
          console.warn('[Auth] Could not save username:', profileError.message)
        }
      }

      return data
    },
    []
  )

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut()
    setUser(null)
    setProfile(null)
    authChecked = false
  }, [setUser, setProfile])

  return {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    isLoading,
  }
}
