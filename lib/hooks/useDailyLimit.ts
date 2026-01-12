'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabaseUpdate, supabaseFetch, createClient } from '@/lib/supabase/fetch'
import { useStore } from '@/lib/store/useStore'
import type { Profile } from '@/types'

const MAX_DAILY_STARS = 3

// Get local date in YYYY-MM-DD format
function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useDailyLimit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)
  const { profile, setProfile, user } = useStore()
  const hasChecked = useRef(false)

  // Use refs to avoid stale closures and infinite loops
  const profileRef = useRef(profile)
  const setProfileRef = useRef(setProfile)
  const isAdminRef = useRef(isAdmin)

  // Keep refs in sync
  useEffect(() => {
    profileRef.current = profile
    setProfileRef.current = setProfile
    isAdminRef.current = isAdmin
  }, [profile, setProfile, isAdmin])

  // Profile loaded state
  const profileLoaded = !!profile

  // Check admin status from server-side API (secure)
  useEffect(() => {
    if (!user || adminChecked) return

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin === true)
        }
      } catch {
        // Silent fail - default to non-admin
        setIsAdmin(false)
      } finally {
        setAdminChecked(true)
      }
    }

    checkAdminStatus()
  }, [user, adminChecked])

  // Reset admin check when user changes
  useEffect(() => {
    setAdminChecked(false)
    setIsAdmin(false)
  }, [user?.id])

  // Check and reset if new day - only runs once per profile load
  useEffect(() => {
    // Skip if already checked or no profile
    if (hasChecked.current || !profile?.id) return

    const today = getLocalDateString()
    const lastReset = profile.last_reset_date ? profile.last_reset_date.split('T')[0] : null

    // Skip if already reset today
    if (lastReset === today) {
      hasChecked.current = true
      return
    }

    // Mark as checked before async operation to prevent double execution
    hasChecked.current = true

    const resetDaily = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) return

        // Reset daily counters
        await supabaseUpdate<Profile>(
          'profiles',
          `id=eq.${profile.id}`,
          {
            daily_stars_added: 0,
            daily_views_used: 0,
            last_reset_date: today,
          },
          session.access_token
        )

        // Fetch fresh profile to ensure we have the latest data
        const { data: freshProfile } = await supabaseFetch<Profile>('profiles', {
          filter: `id=eq.${profile.id}`,
          single: true,
          accessToken: session.access_token,
        })

        if (freshProfile) {
          setProfileRef.current(freshProfile)
        }
      } catch {
        // Silent fail - will retry on next page load
      }
    }

    resetDaily()
  }, [profile?.id, profile?.last_reset_date]) // Only depend on specific fields

  // Reset the check flag when user changes
  useEffect(() => {
    return () => {
      hasChecked.current = false
    }
  }, [user?.id])

  const canShareStar = useCallback(() => {
    // Admins have unlimited stars
    if (isAdmin) return true
    if (!profile) return true // Allow while loading (will be checked server-side anyway)
    const added = profile.daily_stars_added ?? 0
    return added < MAX_DAILY_STARS
  }, [profile, isAdmin])

  const getRemainingStars = useCallback(() => {
    // Admins have unlimited stars
    if (isAdmin) return Infinity
    if (!profile) return MAX_DAILY_STARS // Return max while loading
    const added = profile.daily_stars_added ?? 0
    return Math.max(0, MAX_DAILY_STARS - added)
  }, [profile, isAdmin])

  // Check real limit from database before creating star
  const checkRealLimit = useCallback(async (): Promise<boolean> => {
    // Admins have unlimited stars
    if (isAdminRef.current) return true

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return false

      const { data: currentProfile } = await supabaseFetch<Profile>('profiles', {
        filter: `id=eq.${session.user.id}`,
        single: true,
        accessToken: session.access_token,
      })

      if (!currentProfile) return false

      const currentCount = currentProfile.daily_stars_added ?? 0
      return currentCount < MAX_DAILY_STARS
    } catch {
      return false
    }
  }, [])

  const incrementStarCount = useCallback(async () => {
    // Admins don't need to track star count (use ref for latest value)
    if (isAdminRef.current) {
      return profileRef.current
    }

    try {
      setLoading(true)
      setError(null)

      // Get session for access token and user ID (required for RLS)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        throw new Error('Oturum bulunamadı')
      }

      // First fetch current profile to get accurate count
      const { data: currentProfile } = await supabaseFetch<Profile>('profiles', {
        filter: `id=eq.${session.user.id}`,
        single: true,
        accessToken: session.access_token,
      })

      if (!currentProfile) {
        throw new Error('Profil bulunamadı')
      }

      const currentCount = currentProfile.daily_stars_added ?? 0

      if (currentCount >= MAX_DAILY_STARS) {
        throw new Error('Günlük limitinize ulaştınız')
      }

      const { data, error: updateError } = await supabaseUpdate<Profile>(
        'profiles',
        `id=eq.${session.user.id}`,
        {
          daily_stars_added: currentCount + 1,
        },
        session.access_token
      )

      if (updateError) {
        throw new Error(updateError)
      }

      if (data) {
        setProfileRef.current(data)
      }
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Limit güncellenemedi'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, []) // No dependencies - uses refs for latest values

  // Increment view count (for statistics only, no limit)
  const incrementViewCount = useCallback(async () => {
    const currentProfile = profileRef.current
    if (!currentProfile) return

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return

      const currentViews = currentProfile.daily_views_used ?? 0

      const { data } = await supabaseUpdate<Profile>(
        'profiles',
        `id=eq.${session.user.id}`,
        { daily_views_used: currentViews + 1 },
        session.access_token
      )

      if (data) {
        setProfileRef.current(data)
      }
    } catch {
      // Silent fail - stats are not critical
    }
  }, []) // No dependencies - uses refs for latest values

  return {
    loading,
    error,
    profileLoaded,
    isAdmin,
    canShareStar: canShareStar(),
    remainingStars: getRemainingStars(),
    maxStars: MAX_DAILY_STARS,
    checkRealLimit,
    incrementStarCount,
    incrementViewCount,
  }
}
