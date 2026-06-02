'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabaseFetch } from '@/lib/supabase/fetch'
import { createClient } from '@/lib/supabase/client'
import type { Star } from '@/types'

// Hook to fetch actual star counts per planet from database
export function useStarCounts() {
  const [starCounts, setStarCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const isMountedRef = useRef(true)

  const fetchStarCounts = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fast path: one grouped query via RPC (single round-trip, single scan).
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_planet_star_counts')
      if (!rpcError && Array.isArray(rpcData)) {
        const counts: Record<string, number> = {}
        for (const row of rpcData as { planet_id: string; count: number }[]) {
          counts[row.planet_id] = Number(row.count)
        }
        if (isMountedRef.current) setStarCounts(counts)
        return counts
      }

      // Fallback (e.g. before the RPC migration is applied): per-planet count.
      const { data: planets, error: planetsError } = await supabase
        .from('planets')
        .select('id')

      if (planetsError || !planets) {
        console.error('Error fetching planets:', planetsError)
        return {}
      }
      if (!isMountedRef.current) return {}

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

  return {
    stars,
    loading,
    error,
    fetchStarsByPlanet,
    fetchAllStars,
  }
}
