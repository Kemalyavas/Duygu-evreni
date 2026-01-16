'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { supabaseFetch } from '@/lib/supabase/fetch'
import { useStore } from '@/lib/store/useStore'
import { resetDailyLimitCache } from './useDailyLimit'
import type { Profile } from '@/types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Global flag to track if auth has been checked
let authChecked = false
// Global flag to prevent duplicate IP tracking
let ipTracked = false

// Track IP in background (non-blocking) - only once per session
async function trackUserIP(accessToken: string) {
  if (ipTracked) return // Already tracked this session
  ipTracked = true

  try {
    await fetch('/api/ip/track', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  } catch {
    // Silently fail - IP tracking is not critical
    ipTracked = false // Reset on error so it can retry
  }
}

// Check if IP is banned
async function checkIPBan(): Promise<{ banned: boolean; reason?: string }> {
  try {
    const response = await fetch('/api/ip/check')
    return await response.json()
  } catch {
    return { banned: false }
  }
}

export function useAuth() {
  const { user, profile, setUser, setProfile } = useStore()
  const [isLoading, setIsLoading] = useState(!authChecked)
  const supabaseRef = useRef(createClient())

  const handleBannedProfile = useCallback(async (reason?: string | null, shouldThrow = false) => {
    try {
      await supabaseRef.current.auth.signOut()
    } catch {
      // ignore
    }
    setUser(null)
    setProfile(null)
    authChecked = true
    setIsLoading(false)
    if (shouldThrow) {
      throw new Error(reason || 'Hesabınız banlanmış')
    }
  }, [setProfile, setUser])

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

          // If refresh token is invalid, clear the session
          const errorCode = (error as { code?: string }).code
          if (error.message?.includes('Refresh Token') || errorCode === 'refresh_token_not_found') {
            try {
              await supabase.auth.signOut()
            } catch {
              // Ignore signOut errors
            }
          }

          if (isMounted) {
            authChecked = true
            setIsLoading(false)
          }
          return
        }

        if (session?.user && isMounted) {
          setUser({ id: session.user.id, email: session.user.email || '' })

          // Track IP in background
          trackUserIP(session.access_token)

          // Fetch profile using fetch API with access token for RLS
          try {
            const { data: profileData } = await supabaseFetch<Profile>('profiles', {
              filter: `id=eq.${session.user.id}`,
              single: true,
              accessToken: session.access_token,
            })

            if (profileData && isMounted) {
              setProfile(profileData)
              if (profileData.is_banned) {
                await handleBannedProfile(profileData.banned_reason, false)
              }
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

            // Track IP in background
            trackUserIP(session.access_token)

            // Fetch profile using fetch API with access token for RLS
            try {
              const { data: profileData } = await supabaseFetch<Profile>('profiles', {
                filter: `id=eq.${session.user.id}`,
                single: true,
                accessToken: session.access_token,
              })

              if (profileData && isMounted) {
                setProfile(profileData)
                if (profileData.is_banned) {
                  await handleBannedProfile(profileData.banned_reason, false)
                }
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
      // Check if IP is banned before allowing login
      const ipCheck = await checkIPBan()
      if (ipCheck.banned) {
        throw new Error(ipCheck.reason || 'Bu IP adresi engellenmiş')
      }

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

        // Track IP in background
        trackUserIP(data.session.access_token)

        // Fetch and set profile
        try {
          const { data: profileData } = await supabaseFetch<Profile>('profiles', {
            filter: `id=eq.${data.session.user.id}`,
            single: true,
            accessToken: data.session.access_token,
          })

          if (profileData) {
            setProfile(profileData)
            if (profileData.is_banned) {
              await handleBannedProfile(profileData.banned_reason, true)
            }
          }
        } catch {
          console.warn('[Auth] Could not fetch profile on sign in')
        }
      }

      return data
    },
    [handleBannedProfile, setUser, setProfile]
  )

  const signUp = useCallback(
    async (email: string, password: string, username?: string) => {
      // Check if IP is banned before allowing signup
      const ipCheck = await checkIPBan()
      if (ipCheck.banned) {
        throw new Error(ipCheck.reason || 'Bu IP adresi engellenmiş')
      }

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
          // Check for unique constraint violation
          if (profileError.message.includes('unique') || profileError.code === '23505') {
            throw new Error('Bu kullanıcı adı zaten alınmış')
          }
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
    ipTracked = false // Reset IP tracking on sign out
    resetDailyLimitCache() // Reset admin cache on sign out
  }, [setUser, setProfile])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabaseRef.current.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  return {
    user,
    profile,
    setProfile,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    checkIPBan,
    isAuthenticated: !!user,
    isLoading,
  }
}
