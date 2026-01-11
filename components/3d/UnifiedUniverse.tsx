'use client'

import { Suspense, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useProgress } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// Components
import { StarField } from './StarField'
import { OrbitingStars } from './OrbitingStar'
import { Planet3D } from './PlanetRenderer'
import { LoadingVortex } from './LoadingVortex'
import { CameraAnimator } from './UniverseCamera'

// Hooks & Utils
import { useSceneState, type ViewMode } from './hooks/useSceneState'

// Constants
import { ORBIT_CONTROLS } from '@/lib/constants/animation'
import {
  DEFAULT_CAMERA,
  STAR_FIELD,
  LARGE_STAR_COUNT,
  BLOOM,
  LIGHTING,
} from '@/lib/constants/ui'

// Types
import type { Planet as PlanetType, Star } from '@/types'

// Loading overlay component - shows while 3D assets are loading
function LoadingOverlay() {
  const { progress, active } = useProgress()

  // Hide when loading is complete
  if (!active && progress >= 100) return null

  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <div className="fixed inset-0 bg-gradient-to-b from-[#0A0E27] to-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"
              style={{ animationDuration: '1s' }}
            />
            {/* Progress text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/80 text-lg font-medium">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <p className="text-white/60 text-lg animate-pulse">Evren yükleniyor...</p>
        </div>
      </div>
    </Html>
  )
}

// ============================================
// Types
// ============================================

interface UnifiedUniverseProps {
  planets: PlanetType[]
  stars: Star[]
  focusedPlanetId: string | null
  onPlanetClick?: (planet: PlanetType) => void
  onStarClick?: (star: Star) => void
  onBackToUniverse?: () => void
  selectedStarId?: string
  readStarIds?: Set<string>
  starCounts?: Record<string, number>
  starsLoading?: boolean
  onStarsReady?: () => void
  isMobile?: boolean
}

interface SceneProps {
  planets: PlanetType[]
  focusedPlanetId: string | null
  onPlanetClick?: (planet: PlanetType) => void
  onStarClick?: (star: Star) => void
  selectedStarId?: string
  readStarIds?: Set<string>
  starCounts?: Record<string, number>
  starsLoading?: boolean
  viewMode: ViewMode
  animationTrigger: number
  targetCameraPosition: [number, number, number] | null
  targetLookAt: [number, number, number] | null
  onTransitionComplete: () => void
  starsByPlanet: Record<string, Star[]>
  isTransitioning: boolean
  orbitSettings: {
    minDistance: number
    maxDistance: number
    autoRotateSpeed: number
  }
  onSelectedStarPosition?: (position: [number, number, number]) => void
  isFocusedOnStar?: boolean
  onStarsReady?: () => void
  isMobile?: boolean
  activeMobileTooltipId: string | null
  setActiveMobileTooltipId: (id: string | null) => void
}

// ============================================
// Scene Component
// ============================================

function Scene({
  planets,
  focusedPlanetId,
  onPlanetClick,
  onStarClick,
  selectedStarId,
  readStarIds,
  starCounts,
  starsLoading,
  viewMode,
  animationTrigger,
  targetCameraPosition,
  targetLookAt,
  onTransitionComplete,
  starsByPlanet,
  isTransitioning,
  orbitSettings,
  onSelectedStarPosition,
  isFocusedOnStar,
  onStarsReady,
  isMobile,
  activeMobileTooltipId,
  setActiveMobileTooltipId,
}: SceneProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitControlsRef = useRef<any>(null)

  // Track loading progress for 3D assets
  const { progress, active } = useProgress()

  // Track when planets are ready to show
  const [planetsReady, setPlanetsReady] = useState(false)

  // Show planets when loading is complete (progress = 100) or after timeout
  useEffect(() => {
    // If loading is complete, show planets immediately
    if (!active && progress === 100) {
      setPlanetsReady(true)
      return
    }

    // Fallback: show planets after 500ms even if still loading
    const timer = setTimeout(() => {
      setPlanetsReady(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [progress, active])

  // Track which planets have completed vortex animation
  const [starsReadyToShow, setStarsReadyToShow] = useState<Record<string, boolean>>({})
  const starsReadyCalledRef = useRef<string | null>(null)

  // Reset when changing planets
  useEffect(() => {
    if (focusedPlanetId) {
      setStarsReadyToShow(prev => ({ ...prev, [focusedPlanetId]: false }))
      starsReadyCalledRef.current = null
    }
  }, [focusedPlanetId])

  // Call onStarsReady when stars become visible
  useEffect(() => {
    if (!focusedPlanetId || viewMode !== 'planet' || starsReadyCalledRef.current === focusedPlanetId) return

    const planet = planets.find(p => p.id === focusedPlanetId)
    if (!planet) return

    const planetStars = starsByPlanet[planet.id] || []
    const actualStarCount = starCounts?.[planet.id] ?? planetStars.length

    if (actualStarCount >= LARGE_STAR_COUNT.VORTEX_THRESHOLD) {
      if (starsReadyToShow[focusedPlanetId] && !starsLoading) {
        starsReadyCalledRef.current = focusedPlanetId
        onStarsReady?.()
      }
    } else {
      if (!starsLoading && planetStars.length > 0) {
        starsReadyCalledRef.current = focusedPlanetId
        onStarsReady?.()
      }
    }
  }, [focusedPlanetId, viewMode, starsReadyToShow, starsLoading, planets, starsByPlanet, starCounts, onStarsReady])

  // Hope planet for main light
  const hopePlanet = useMemo(
    () => planets.find(p => p.name === 'Hope'),
    [planets]
  )

  return (
    <>
      {/* Loading overlay - shows progress while assets load */}
      <LoadingOverlay />

      <PerspectiveCamera
        makeDefault
        position={DEFAULT_CAMERA.POSITION}
        fov={DEFAULT_CAMERA.FOV}
        near={DEFAULT_CAMERA.NEAR}
        far={DEFAULT_CAMERA.FAR}
      />

      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        enableRotate={!isTransitioning}
        enableZoom={!isTransitioning}
        minDistance={orbitSettings.minDistance}
        maxDistance={orbitSettings.maxDistance}
        autoRotate={!isTransitioning && !isFocusedOnStar}
        autoRotateSpeed={orbitSettings.autoRotateSpeed}
        dampingFactor={ORBIT_CONTROLS.DAMPING_FACTOR}
        enableDamping={!isFocusedOnStar}
        rotateSpeed={ORBIT_CONTROLS.ROTATE_SPEED}
      />

      <CameraAnimator
        animationTrigger={animationTrigger}
        targetCameraPosition={targetCameraPosition}
        targetLookAt={targetLookAt}
        onTransitionComplete={onTransitionComplete}
        orbitControlsRef={orbitControlsRef}
      />

      {/* Lighting - increased ambient on mobile since Bloom is disabled */}
      <ambientLight color="#ffffff" intensity={isMobile ? 0.7 : LIGHTING.AMBIENT_INTENSITY} />
      <hemisphereLight
        color="#b0c4de"
        groundColor="#2a1a4a"
        intensity={isMobile ? 0.6 : LIGHTING.HEMISPHERE_INTENSITY}
      />

      {/* Hope as main light source */}
      {hopePlanet && (
        <pointLight
          color="#FFFACD"
          intensity={LIGHTING.HOPE_INTENSITY}
          distance={LIGHTING.HOPE_DISTANCE}
          decay={LIGHTING.HOPE_DECAY}
          position={[hopePlanet.position_x, hopePlanet.position_y, hopePlanet.position_z]}
        />
      )}

      {/* Fill and rim lights */}
      <directionalLight
        color="#4a6080"
        intensity={isMobile ? 0.5 : LIGHTING.FILL_INTENSITY}
        position={[-15, 5, -20]}
      />
      <directionalLight
        color="#4a0080"
        intensity={isMobile ? 0.4 : LIGHTING.RIM_INTENSITY}
        position={[-20, -10, -30]}
      />

      {/* Extra fill light for mobile - illuminates dark sides of planets */}
      {isMobile && (
        <directionalLight
          color="#6080a0"
          intensity={0.4}
          position={[20, -5, 25]}
        />
      )}

      {/* Background stars - universe mode only, reduced count but brighter on mobile */}
      {viewMode === 'universe' && (
        <StarField
          count={isMobile ? 800 : STAR_FIELD.COUNT}
          brightness={isMobile ? 1.8 : 1.0}
        />
      )}

      {/* Planets - only render when ready to prevent one-by-one loading appearance */}
      {planetsReady && planets.map((planet) => {
        const isHope = planet.name === 'Hope'
        const isDepression = planet.name === 'Depression'
        const isFocused = planet.id === focusedPlanetId
        const isVisible = viewMode === 'universe' || isFocused
        const planetStars = starsByPlanet[planet.id] || []
        const actualStarCount = starCounts?.[planet.id] ?? planetStars.length

        return (
          <group key={planet.id}>
            <Planet3D
              planet={planet}
              starCount={actualStarCount}
              isHope={isHope}
              isDepression={isDepression}
              isFocused={isFocused}
              isVisible={isVisible}
              onClick={() => onPlanetClick?.(planet)}
              showMobileTooltip={activeMobileTooltipId === planet.id}
              onMobileTooltipChange={(show) => {
                setActiveMobileTooltipId(show ? planet.id : null)
              }}
            />

            {/* Stars - only in planet mode */}
            {viewMode === 'planet' && isFocused && (
              actualStarCount >= LARGE_STAR_COUNT.VORTEX_THRESHOLD
                ? (starsReadyToShow[planet.id] && !starsLoading)
                : true
            ) && (
              <OrbitingStars
                stars={planetStars}
                planetPosition={[planet.position_x, planet.position_y, planet.position_z]}
                planetColor={planet.color}
                onStarClick={onStarClick}
                selectedStarId={selectedStarId}
                readStarIds={readStarIds}
                animateIn={actualStarCount >= LARGE_STAR_COUNT.VORTEX_THRESHOLD}
                onSelectedStarPosition={onSelectedStarPosition}
              />
            )}

            {/* Vortex loading - only for large star counts */}
            {viewMode === 'planet' && isFocused && actualStarCount >= LARGE_STAR_COUNT.VORTEX_THRESHOLD && (
              <LoadingVortex
                position={[planet.position_x, planet.position_y, planet.position_z]}
                color={planet.color}
                isLoading={starsLoading ?? false}
                onExplosionStart={() => {
                  setStarsReadyToShow(prev => ({ ...prev, [planet.id]: true }))
                }}
                planetScale={planet.scale || 1}
              />
            )}
          </group>
        )
      })}

      {/* Bloom effect - disabled on mobile for performance */}
      {!isMobile && (
        <EffectComposer>
          <Bloom
            intensity={BLOOM.INTENSITY}
            luminanceThreshold={BLOOM.LUMINANCE_THRESHOLD}
            luminanceSmoothing={BLOOM.LUMINANCE_SMOOTHING}
            mipmapBlur
            radius={BLOOM.RADIUS}
          />
        </EffectComposer>
      )}
    </>
  )
}

// ============================================
// Loading Fallback
// ============================================

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white text-lg animate-pulse">
        Evren yükleniyor...
      </div>
    </Html>
  )
}

// ============================================
// Main Export
// ============================================

export function UnifiedUniverse({
  planets,
  stars,
  focusedPlanetId,
  onPlanetClick,
  onStarClick,
  onBackToUniverse: _onBackToUniverse,
  selectedStarId,
  readStarIds,
  starCounts,
  starsLoading,
  onStarsReady,
  isMobile = false,
}: UnifiedUniverseProps) {
  // Track which planet's mobile tooltip is showing (only one at a time)
  const [activeMobileTooltipId, setActiveMobileTooltipId] = useState<string | null>(null)

  // Use scene state hook for camera and transitions
  const {
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
  } = useSceneState({
    planets,
    stars,
    focusedPlanetId,
    selectedStarId,
  })

  // Close mobile tooltip when clicking empty space
  const handlePointerMissed = useCallback(() => {
    if (activeMobileTooltipId) {
      setActiveMobileTooltipId(null)
    }
  }, [activeMobileTooltipId])

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0a15] to-[#000000] relative">
      <Canvas
        dpr={isMobile ? 1 : [1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onPointerMissed={handlePointerMissed}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene
            planets={planets}
            focusedPlanetId={focusedPlanetId}
            onPlanetClick={onPlanetClick}
            onStarClick={onStarClick}
            selectedStarId={selectedStarId}
            readStarIds={readStarIds}
            starCounts={starCounts}
            starsLoading={starsLoading}
            viewMode={viewMode}
            animationTrigger={animationTrigger}
            targetCameraPosition={targetCameraPosition}
            targetLookAt={targetLookAt}
            onTransitionComplete={handleTransitionComplete}
            starsByPlanet={starsByPlanet}
            isTransitioning={isTransitioning}
            orbitSettings={orbitSettings}
            onSelectedStarPosition={handleSelectedStarPosition}
            isFocusedOnStar={isFocusedOnStar}
            onStarsReady={onStarsReady}
            isMobile={isMobile}
            activeMobileTooltipId={activeMobileTooltipId}
            setActiveMobileTooltipId={setActiveMobileTooltipId}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Re-export types for external use
export type { ViewMode }
