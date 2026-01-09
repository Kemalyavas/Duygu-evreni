'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth, usePlanets, useStars, useStarCounts, useDailyLimit, useReadStars } from '@/lib/hooks'
import type { Planet, Star } from '@/types'

// Loading state machine type
type LoadState = 'idle' | 'loading' | 'loaded' | 'visible'

interface UsePageStateReturn {
  // Auth
  user: { id: string; email?: string } | null
  authLoading: boolean
  signOut: () => Promise<void>

  // Planets
  planets: Planet[]
  planetsLoading: boolean
  planetsError: string | null
  focusedPlanet: Planet | null
  focusedPlanetId: string | null
  setFocusedPlanetId: (id: string | null) => void

  // Stars
  stars: Star[]
  starsLoading: boolean
  selectedStar: Star | null
  setSelectedStar: (star: Star | null) => void
  starCounts: Record<string, number>
  readStarIds: Set<string>
  markAsRead: (id: string) => void
  remainingStars: number

  // Loading states
  loadState: LoadState
  starsVisuallyReady: boolean
  setStarsVisuallyReady: (ready: boolean) => void

  // UI state
  hasClickedStar: boolean
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  isInPlanetMode: boolean

  // Actions
  handlePlanetClick: (planet: Planet) => void
  handleBackToUniverse: () => void
  handleStarClick: (star: Star) => void
  handleClosePanel: () => void
  handleStarCreated: (newStar: Star) => void
  handleLogout: () => Promise<void>
  handleStarsReady: () => void
}

/**
 * Main state management hook for the home page
 * Consolidates all page state into a single hook
 */
export function usePageState(planetIdFromUrl: string | null): UsePageStateReturn {
  // Auth
  const { user, isLoading: authLoading, signOut } = useAuth()

  // Planets
  const { planets, loading: planetsLoading, error: planetsError } = usePlanets()

  // Stars
  const { stars, loading: starsLoading, fetchAllStars, fetchStarsByPlanet } = useStars()
  const { starCounts, refetchCounts } = useStarCounts()
  const { remainingStars } = useDailyLimit()
  const { readStarIds, markAsRead } = useReadStars()

  // Local state
  const [focusedPlanetId, setFocusedPlanetId] = useState<string | null>(planetIdFromUrl)
  const [selectedStar, setSelectedStar] = useState<Star | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Lazy initialize from localStorage
  const [hasClickedStar, setHasClickedStar] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('duygu-evreni-star-clicked') === 'true'
  })

  // Loading state machine
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [starsVisuallyReady, setStarsVisuallyReady] = useState(false)

  // Get focused planet object
  const focusedPlanet = useMemo(
    () => planets.find(p => p.id === focusedPlanetId) || null,
    [planets, focusedPlanetId]
  )

  // Reset loading states when planet changes
  useEffect(() => {
    setLoadState('idle')
    setStarsVisuallyReady(false)
  }, [focusedPlanetId])

  // Track loading state transitions
  useEffect(() => {
    if (starsLoading && focusedPlanetId && loadState === 'idle') {
      setLoadState('loading')
    } else if (!starsLoading && loadState === 'loading') {
      setLoadState('loaded')
    }
  }, [starsLoading, focusedPlanetId, loadState])

  // Mark as visible when stars are ready
  useEffect(() => {
    if (starsVisuallyReady && loadState === 'loaded') {
      setLoadState('visible')
    }
  }, [starsVisuallyReady, loadState])

  // Fetch stars based on mode
  useEffect(() => {
    if (focusedPlanetId) {
      fetchStarsByPlanet(focusedPlanetId)
    } else {
      fetchAllStars()
    }
  }, [focusedPlanetId, fetchStarsByPlanet, fetchAllStars])

  // Derived state
  const isInPlanetMode = !!focusedPlanetId

  // Callback when stars become visible (after vortex animation)
  const handleStarsReady = useCallback(() => {
    setStarsVisuallyReady(true)
  }, [])

  // Planet click - update URL with shallow routing
  const handlePlanetClick = useCallback((planet: Planet) => {
    setFocusedPlanetId(planet.id)
    window.history.pushState(null, '', `?planet=${planet.id}`)
  }, [])

  // Back to universe - clear focused planet
  const handleBackToUniverse = useCallback(() => {
    setFocusedPlanetId(null)
    setSelectedStar(null)
    window.history.pushState(null, '', '/')
  }, [])

  // Star click
  const handleStarClick = useCallback((star: Star) => {
    setSelectedStar(star)
    markAsRead(star.id)
    // Mark that user has clicked a star (hides the hint prompt)
    if (!hasClickedStar) {
      setHasClickedStar(true)
      localStorage.setItem('duygu-evreni-star-clicked', 'true')
    }
  }, [markAsRead, hasClickedStar])

  const handleClosePanel = useCallback(() => {
    setSelectedStar(null)
  }, [])

  const handleStarCreated = useCallback((newStar: Star) => {
    if (focusedPlanetId) {
      fetchStarsByPlanet(focusedPlanetId)
    }
    // Refetch star counts to update universe view tooltips
    refetchCounts()
    // Focus camera on the newly created star
    setSelectedStar(newStar)
    markAsRead(newStar.id)
  }, [focusedPlanetId, fetchStarsByPlanet, refetchCounts, markAsRead])

  const handleLogout = useCallback(async () => {
    await signOut()
    window.location.href = '/'
  }, [signOut])

  return {
    // Auth
    user,
    authLoading,
    signOut,

    // Planets
    planets,
    planetsLoading,
    planetsError,
    focusedPlanet,
    focusedPlanetId,
    setFocusedPlanetId,

    // Stars
    stars,
    starsLoading,
    selectedStar,
    setSelectedStar,
    starCounts,
    readStarIds,
    markAsRead,
    remainingStars,

    // Loading states
    loadState,
    starsVisuallyReady,
    setStarsVisuallyReady,

    // UI state
    hasClickedStar,
    isModalOpen,
    setIsModalOpen,
    isInPlanetMode,

    // Actions
    handlePlanetClick,
    handleBackToUniverse,
    handleStarClick,
    handleClosePanel,
    handleStarCreated,
    handleLogout,
    handleStarsReady,
  }
}
