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

  // Check and reset if new day
  const checkAndResetDaily = useCallback(async () => {
    if (!profile) return

    const today = getLocalDateString()

    // Compare dates - handle both string formats and null
    const lastReset = profile.last_reset_date ? profile.last_reset_date.split('T')[0] : null

    if (lastReset !== today) {
      try {
        // Get session for access token (required for RLS)
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
          setProfile(freshProfile)
        }
      } catch {
        // Silent fail
      }
    }
  }, [profile, setProfile])

  // Run check when profile is available
  useEffect(() => {
    if (profile && !hasChecked.current) {
      hasChecked.current = true
      checkAndResetDaily()
    }
  }, [profile, checkAndResetDaily])

  // Reset the check flag when profile changes (e.g., different user)
  useEffect(() => {
    return () => {
      hasChecked.current = false
    }
  }, [])

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

  const incrementStarCount = useCallback(async () => {
    // Admins don't need to track star count
    if (isAdmin) {
      return profile
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
        setProfile(data)
      }
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Limit güncellenemedi'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [setProfile, isAdmin, profile])

  // Increment view count (for statistics only, no limit)
  const incrementViewCount = useCallback(async () => {
    if (!profile) return

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) return

      const currentViews = profile.daily_views_used ?? 0

      const { data } = await supabaseUpdate<Profile>(
        'profiles',
        `id=eq.${session.user.id}`,
        { daily_views_used: currentViews + 1 },
        session.access_token
      )

      if (data) {
        setProfile(data)
      }
    } catch {
      // Silent fail - stats are not critical
    }
  }, [profile, setProfile])

  return {
    loading,
    error,
    profileLoaded,
    isAdmin,
    canShareStar: canShareStar(),
    remainingStars: getRemainingStars(),
    maxStars: MAX_DAILY_STARS,
    incrementStarCount,
    incrementViewCount,
  }
}
