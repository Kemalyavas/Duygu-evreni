'use client'

import { useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Star } from '@/types'
import { STAR_INTERACTION } from '@/lib/constants/animation'

interface UseURLSyncProps {
  focusedPlanetId: string | null
  setFocusedPlanetId: (id: string | null) => void
  stars: Star[]
  starsVisuallyReady: boolean
  markAsRead: (id: string) => void
  setSelectedStar: (star: Star | null) => void
}

/**
 * Hook to sync URL with page state
 * Handles:
 * - Reading planet/star IDs from URL
 * - Browser back/forward navigation
 * - Auto-selecting star from URL after visual ready
 */
export function useURLSync({
  focusedPlanetId,
  setFocusedPlanetId,
  stars,
  starsVisuallyReady,
  markAsRead,
  setSelectedStar,
}: UseURLSyncProps) {
  const searchParams = useSearchParams()
  const planetIdFromUrl = searchParams.get('planet')
  const starIdFromUrl = searchParams.get('star')

  // Sync URL planet param with state
  useEffect(() => {
    const urlPlanetId = searchParams.get('planet')
    if (urlPlanetId !== focusedPlanetId) {
      setFocusedPlanetId(urlPlanetId)
    }
  }, [searchParams, focusedPlanetId, setFocusedPlanetId])

  // Handle star from URL - wait for stars to be visually ready, then delay before selecting
  useEffect(() => {
    if (starIdFromUrl && stars.length > 0 && starsVisuallyReady) {
      const timer = setTimeout(() => {
        const star = stars.find((s) => s.id === starIdFromUrl)
        if (star) {
          setSelectedStar(star)
          markAsRead(star.id)
        }
      }, STAR_INTERACTION.URL_STAR_SELECT_DELAY)

      return () => clearTimeout(timer)
    }
  }, [starIdFromUrl, stars, starsVisuallyReady, markAsRead, setSelectedStar])

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const planetId = params.get('planet')
      setFocusedPlanetId(planetId)
      if (!planetId) {
        setSelectedStar(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setFocusedPlanetId, setSelectedStar])

  // URL update helpers
  const updateURLForPlanet = useCallback((planetId: string) => {
    window.history.pushState(null, '', `?planet=${planetId}`)
  }, [])

  const clearURL = useCallback(() => {
    window.history.pushState(null, '', '/')
  }, [])

  return {
    planetIdFromUrl,
    starIdFromUrl,
    updateURLForPlanet,
    clearURL,
  }
}
