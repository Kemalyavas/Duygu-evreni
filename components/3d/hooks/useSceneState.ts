'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { Planet, Star } from '@/types'
import { getOrbitRadius, getCameraDistance, calculatePlanetCameraPosition, calculateStarCameraPosition } from '@/lib/utils/orbit'
import { CAMERA, ORBIT_CONTROLS } from '@/lib/constants/animation'
import { DEFAULT_CAMERA, CONTROLS_LIMITS, CAMERA_DISTANCE } from '@/lib/constants/ui'

export type ViewMode = 'universe' | 'planet'

interface UseSceneStateProps {
  planets: Planet[]
  stars: Star[]
  focusedPlanetId: string | null
  selectedStarId?: string
}

interface UseSceneStateReturn {
  viewMode: ViewMode
  animationTrigger: number
  targetCameraPosition: [number, number, number] | null
  targetLookAt: [number, number, number] | null
  isTransitioning: boolean
  isFocusedOnStar: boolean
  starsByPlanet: Record<string, Star[]>
  orbitSettings: {
    minDistance: number
    maxDistance: number
    autoRotateSpeed: number
  }
  handleTransitionComplete: () => void
  handleSelectedStarPosition: (position: [number, number, number]) => void
}

/**
 * Hook to manage 3D scene state including camera transitions
 */
export function useSceneState({
  planets,
  stars,
  focusedPlanetId,
  selectedStarId,
}: UseSceneStateProps): UseSceneStateReturn {
  // Derive viewMode from focusedPlanetId
  const viewMode: ViewMode = focusedPlanetId ? 'planet' : 'universe'

  // Animation state
  const [animationTrigger, setAnimationTrigger] = useState(0)
  const [targetCameraPosition, setTargetCameraPosition] = useState<[number, number, number] | null>(null)
  const [targetLookAt, setTargetLookAt] = useState<[number, number, number] | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isFocusedOnStar, setIsFocusedOnStar] = useState(false)

  // Track previous values
  const prevFocusedPlanetId = useRef<string | null>(null)
  const prevSelectedStarId = useRef<string | undefined>(undefined)

  // Pending star position (when star is selected during planet transition)
  const pendingStarPosition = useRef<[number, number, number] | null>(null)

  // Group stars by planet
  const starsByPlanet = useMemo(() => {
    const grouped: Record<string, Star[]> = {}
    planets.forEach((p) => { grouped[p.id] = [] })
    stars.forEach((star) => {
      if (grouped[star.planet_id]) {
        grouped[star.planet_id].push(star)
      }
    })
    return grouped
  }, [stars, planets])

  // Calculate focused planet star count
  const focusedPlanetStarCount = useMemo(() => {
    if (!focusedPlanetId) return 0
    return (starsByPlanet[focusedPlanetId] || []).length
  }, [focusedPlanetId, starsByPlanet])

  // Orbit settings based on view mode and transition state
  const orbitSettings = useMemo(() => {
    if (isTransitioning) {
      return {
        minDistance: CONTROLS_LIMITS.TRANSITION_MIN,
        maxDistance: CONTROLS_LIMITS.TRANSITION_MAX,
        autoRotateSpeed: 0,
      }
    }
    if (viewMode === 'planet') {
      const orbitRadius = getOrbitRadius(focusedPlanetStarCount, 3)
      const maxDist = getCameraDistance(orbitRadius) * CAMERA_DISTANCE.MAX_DISTANCE_MULTIPLIER
      return {
        minDistance: CONTROLS_LIMITS.PLANET_MIN,
        maxDistance: Math.max(CONTROLS_LIMITS.PLANET_MAX_DEFAULT, maxDist),
        autoRotateSpeed: ORBIT_CONTROLS.PLANET_AUTO_ROTATE,
      }
    }
    return {
      minDistance: CONTROLS_LIMITS.UNIVERSE_MIN,
      maxDistance: CONTROLS_LIMITS.UNIVERSE_MAX,
      autoRotateSpeed: ORBIT_CONTROLS.UNIVERSE_AUTO_ROTATE,
    }
  }, [viewMode, isTransitioning, focusedPlanetStarCount])

  // Handle planet focus changes
  useEffect(() => {
    if (focusedPlanetId !== prevFocusedPlanetId.current) {
      prevFocusedPlanetId.current = focusedPlanetId
      setIsFocusedOnStar(false)

      if (focusedPlanetId) {
        const planet = planets.find(p => p.id === focusedPlanetId)
        if (planet) {
          const planetStars = starsByPlanet[planet.id] || []
          const cameraPos = calculatePlanetCameraPosition(planet, planetStars.length)

          setTargetCameraPosition(cameraPos)
          setTargetLookAt([planet.position_x, planet.position_y, planet.position_z])
          setAnimationTrigger(prev => prev + 1)
          setIsTransitioning(true)
        }
      } else {
        // Back to universe view
        setTargetCameraPosition(DEFAULT_CAMERA.POSITION)
        setTargetLookAt(DEFAULT_CAMERA.LOOK_AT)
        setAnimationTrigger(prev => prev + 1)
        setIsTransitioning(true)
      }
    }
  }, [focusedPlanetId, planets, starsByPlanet])

  // Handle star deselection - return camera to planet
  // Note: Removed !isTransitioning check to allow canceling star zoom animation
  useEffect(() => {
    if (prevSelectedStarId.current && !selectedStarId && focusedPlanetId) {
      const planet = planets.find(p => p.id === focusedPlanetId)
      if (planet) {
        const planetStars = starsByPlanet[planet.id] || []
        const cameraPos = calculatePlanetCameraPosition(planet, planetStars.length)

        setTargetCameraPosition(cameraPos)
        setTargetLookAt([planet.position_x, planet.position_y, planet.position_z])
        setAnimationTrigger(prev => prev + 1)
        setIsTransitioning(true)
        setIsFocusedOnStar(false)
      }
    }
    prevSelectedStarId.current = selectedStarId
  }, [selectedStarId, focusedPlanetId, planets, starsByPlanet])

  // Transition complete handler
  const handleTransitionComplete = useCallback(() => {
    const delay = isFocusedOnStar ? CAMERA.STAR_FOCUS_DELAY : CAMERA.PLANET_FOCUS_DELAY
    setTimeout(() => {
      setIsTransitioning(false)

      // Check for pending star animation (from profile navigation)
      if (pendingStarPosition.current && focusedPlanetId) {
        const planet = planets.find(p => p.id === focusedPlanetId)
        if (planet) {
          const position = pendingStarPosition.current
          pendingStarPosition.current = null

          const cameraPos = calculateStarCameraPosition(
            position,
            [planet.position_x, planet.position_y, planet.position_z],
            CAMERA.STAR_FOCUS_DISTANCE
          )

          // Small delay before starting star animation
          setTimeout(() => {
            setTargetCameraPosition(cameraPos)
            setTargetLookAt(position)
            setAnimationTrigger(prev => prev + 1)
            setIsTransitioning(true)
            setIsFocusedOnStar(true)
          }, 100)
        }
      }
    }, delay)
  }, [isFocusedOnStar, focusedPlanetId, planets])

  // Handle selected star position - animate camera towards it
  const handleSelectedStarPosition = useCallback((position: [number, number, number]) => {
    // If transitioning (e.g., planet zoom), store for later
    if (isTransitioning) {
      pendingStarPosition.current = position
      return
    }

    const planet = planets.find(p => p.id === focusedPlanetId)
    if (!planet) return

    const cameraPos = calculateStarCameraPosition(
      position,
      [planet.position_x, planet.position_y, planet.position_z],
      CAMERA.STAR_FOCUS_DISTANCE
    )

    setTargetCameraPosition(cameraPos)
    setTargetLookAt(position)
    setAnimationTrigger(prev => prev + 1)
    setIsTransitioning(true)
    setIsFocusedOnStar(true)
  }, [isTransitioning, planets, focusedPlanetId])

  return {
    viewMode,
    animationTrigger,
    targetCameraPosition,
    targetLookAt,
    isTransitioning,
    isFocusedOnStar,
    starsByPlanet,
    orbitSettings,
    handleTransitionComplete,
    handleSelectedStarPosition,
  }
}
