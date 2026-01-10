'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabaseFetch, supabaseInsert } from '@/lib/supabase/fetch'
import { createClient } from '@/lib/supabase/client'
import type { Star, StarCreateInput } from '@/types'

// Hook to fetch actual star counts per planet from database
export function useStarCounts() {
  const [starCounts, setStarCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const isMountedRef = useRef(true)

  const fetchStarCounts = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // First get all planet IDs
      const { data: planets, error: planetsError } = await supabase
        .from('planets')
        .select('id')

      if (planetsError || !planets) {
        console.error('Error fetching planets:', planetsError)
        return {}
      }

      // Check if still mounted before proceeding
      if (!isMountedRef.current) return {}

      // Get count for each planet using exact count
      const counts: Record<string, number> = {}

      await Promise.all(
        planets.map(async (planet: { id: string }) => {
          const { count, error } = await supabase
            .from('stars')
            .select('*', { count: 'exact', head: true })
            .eq('planet_id', planet.id)

          if (!error && count !== null && isMountedRef.current) {
            counts[planet.id] = count
          }
        })
      )

      // Only update state if still mounted
      if (isMountedRef.current) {
        setStarCounts(counts)
      }
      return counts
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Fetch counts on mount
  useEffect(() => {
    isMountedRef.current = true
    fetchStarCounts()

    return () => {
      isMountedRef.current = false
    }
  }, []) // Empty dependency - only run on mount

  return {
    starCounts,
    loading,
    refetchCounts: fetchStarCounts,
  }
}

// Generate random orbit position around planet center
export function generateOrbitPosition(planetScale: number): [number, number, number] {
  const orbitRadius = planetScale * 2 + Math.random() * 1.5
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)

  return [
    orbitRadius * Math.sin(phi) * Math.cos(theta),
    orbitRadius * Math.sin(phi) * Math.sin(theta),
    orbitRadius * Math.cos(phi),
  ]
}

export function useStars() {
  const [stars, setStars] = useState<Star[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchStarsByPlanet = useCallback(async (planetId: string, limit = 15000) => {
    try {
      setLoading(true)
      setError(null)

      // Supabase has 1000 row limit per request, so we need pagination
      const pageSize = 1000
      const allStars: Star[] = []
      let offset = 0
      let hasMore = true

      while (hasMore && allStars.length < limit) {
        // Check if still mounted before each request
        if (!isMountedRef.current) return allStars

        const { data, error: fetchError } = await supabaseFetch<Star[]>('stars', {
          filter: `planet_id=eq.${planetId}`,
          order: 'created_at.desc',
          limit: Math.min(pageSize, limit - allStars.length),
          offset,
        })

        if (fetchError) {
          if (isMountedRef.current) {
            setError(fetchError)
          }
          return allStars
        }

        if (data && data.length > 0) {
          allStars.push(...data)
          offset += data.length
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }

      if (isMountedRef.current) {
        setStars(allStars)
      }
      return allStars
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const fetchAllStars = useCallback(async (limit = 500) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabaseFetch<Star[]>('stars', {
        order: 'created_at.desc',
        limit,
      })

      if (fetchError) {
        if (isMountedRef.current) {
          setError(fetchError)
        }
        return []
      }

      if (isMountedRef.current) {
        setStars(data || [])
      }
      return data || []
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const createStar = useCallback(async (input: StarCreateInput) => {
    try {
      setLoading(true)
      setError(null)

      // Get current user and session (need access token for RLS)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        throw new Error('Giriş yapmanız gerekiyor')
      }

      const { data, error: insertError } = await supabaseInsert<Star>(
        'stars',
        {
          user_id: session.user.id,
          planet_id: input.planet_id,
          content: input.content,
          position_x: input.position_x,
          position_y: input.position_y,
          position_z: input.position_z,
        },
        session.access_token // Pass access token for RLS
      )

      if (insertError) {
        throw new Error(insertError)
      }

      if (data && isMountedRef.current) {
        setStars((prev) => [data, ...prev])
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Yıldız oluşturulamadı'
      if (isMountedRef.current) {
        setError(message)
      }
      throw new Error(message)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  return {
    stars,
    loading,
    error,
    fetchStarsByPlanet,
    fetchAllStars,
    createStar,
  }
}
