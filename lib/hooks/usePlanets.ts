'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabaseFetch } from '@/lib/supabase/fetch'
import type { Planet } from '@/types'

export function usePlanets() {
  const [planets, setPlanets] = useState<Planet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchPlanets = async () => {
      const { data, error: fetchError } = await supabaseFetch<Planet[]>('planets', {
        order: 'created_at.asc',
      })

      if (!isMounted) return

      if (fetchError) {
        setError(fetchError)
      } else {
        setPlanets(data || [])
      }
      setLoading(false)
    }

    fetchPlanets()

    return () => {
      isMounted = false
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabaseFetch<Planet[]>('planets', {
      order: 'created_at.asc',
    })

    if (fetchError) {
      setError(fetchError)
    } else {
      setPlanets(data || [])
    }
    setLoading(false)
  }, [])

  const getPlanetById = useCallback(
    (id: string) => {
      return planets.find((planet) => planet.id === id)
    },
    [planets]
  )

  return {
    planets,
    loading,
    error,
    refetch,
    getPlanetById,
  }
}
