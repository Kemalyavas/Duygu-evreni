'use client'

import { Suspense, useMemo, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { StarField } from './StarField'
import { Planet } from './Planet'
import { OrbitingStars } from './OrbitingStar'
import { CameraController } from './CameraController'
import type { Planet as PlanetType, Star } from '@/types'

interface UniverseProps {
  planets: PlanetType[]
  stars: Star[]
  onPlanetClick?: (planet: PlanetType) => void
  onStarClick?: (star: Star) => void
  selectedPlanetId?: string
  selectedStarId?: string
  hideStars?: boolean
}

interface SceneProps extends UniverseProps {
  targetPosition: [number, number, number] | null
  isAnimating: boolean
  onAnimationComplete: () => void
  onProgress?: (progress: number) => void
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white text-lg animate-pulse">
        Evren yükleniyor...
      </div>
    </Html>
  )
}

function Scene({
  planets,
  stars,
  onPlanetClick,
  onStarClick,
  selectedPlanetId,
  selectedStarId,
  hideStars = false,
  targetPosition,
  isAnimating,
  onAnimationComplete,
  onProgress,
}: SceneProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orbitControlsRef = useRef<any>(null)

  // Group stars by planet
  const starsByPlanet = useMemo(() => {
    const grouped: Record<string, Star[]> = {}
    planets.forEach((p) => {
      grouped[p.id] = []
    })
    stars.forEach((star) => {
      if (grouped[star.planet_id]) {
        grouped[star.planet_id].push(star)
      }
    })
    return grouped
  }, [stars, planets])

  // Find Hope planet for main light source (The Sun of the Universe)
  const hopePlanet = useMemo(() =>
    planets.find(p => p.name === 'Hope'),
    [planets]
  )

  return (
    <>
      {/* Camera - pulled back for depth */}
      <PerspectiveCamera
        makeDefault
        position={[0, 8, 35]}
        fov={60}
        near={0.1}
        far={500}
      />

      {/* Controls - extended range for depth exploration */}
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        minDistance={10}
        maxDistance={80}
        autoRotate={!isAnimating}
        autoRotateSpeed={0.1}
        dampingFactor={0.05}
        enableDamping
        rotateSpeed={0.5}
      />

      {/* Camera animation controller */}
      <CameraController
        targetPosition={targetPosition}
        isAnimating={isAnimating}
        onAnimationComplete={onAnimationComplete}
        onProgress={onProgress}
        orbitControlsRef={orbitControlsRef}
      />

      {/* Ambient light - softens shadows on planet backsides */}
      <ambientLight color="#ffffff" intensity={0.25} />

      {/* HOPE = THE DIVINE SUN - Main light source */}
      {hopePlanet && (
        <pointLight
          color="#FFFACD"
          intensity={200}
          distance={200}
          decay={1.8}
          position={[hopePlanet.position_x, hopePlanet.position_y, hopePlanet.position_z]}
        />
      )}

      {/* Subtle rim light for depth */}
      <directionalLight
        color="#4a0080"
        intensity={0.15}
        position={[-20, -10, -30]}
      />

      {/* Background star field - balanced */}
      <StarField count={2500} />

      {/* Planets */}
      {planets.map((planet) => (
        <group key={planet.id}>
          <Planet
            planet={planet}
            starCount={(starsByPlanet[planet.id] || []).length}
            onClick={() => onPlanetClick?.(planet)}
            isSelected={planet.id === selectedPlanetId}
          />
          {!hideStars && (
            <OrbitingStars
              stars={starsByPlanet[planet.id] || []}
              planetPosition={[planet.position_x, planet.position_y, planet.position_z]}
              planetColor={planet.color}
              onStarClick={onStarClick}
              selectedStarId={selectedStarId}
            />
          )}
        </group>
      ))}

      {/* Bloom effect - sensitive to catch Hope's glow */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.4}
          mipmapBlur
          radius={0.4}
        />
      </EffectComposer>
    </>
  )
}

export function Universe(props: UniverseProps) {
  const [targetPlanet, setTargetPlanet] = useState<PlanetType | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [fadeProgress, setFadeProgress] = useState(0)

  // Memoize target position to prevent infinite re-renders
  const targetPosition = useMemo<[number, number, number] | null>(() => {
    if (!targetPlanet) return null
    return [targetPlanet.position_x, targetPlanet.position_y, targetPlanet.position_z]
  }, [targetPlanet])

  // Handle planet click - start camera animation
  const handlePlanetClick = useCallback((planet: PlanetType) => {
    setTargetPlanet(planet)
    setIsAnimating(true)
    setFadeProgress(0)
  }, [])

  // Track animation progress for fade effect
  const handleProgress = useCallback((progress: number) => {
    setFadeProgress(progress)
  }, [])

  // When camera animation completes, navigate to planet page
  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    if (targetPlanet && props.onPlanetClick) {
      props.onPlanetClick(targetPlanet)
    }
    setTargetPlanet(null)
    setFadeProgress(0)
  }, [targetPlanet, props.onPlanetClick])

  // Calculate fade opacity - starts fading at 40% progress for smoother transition
  const fadeOpacity = fadeProgress > 0.4 ? (fadeProgress - 0.4) / 0.6 : 0

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0a15] to-[#000000] relative">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene
            {...props}
            onPlanetClick={handlePlanetClick}
            targetPosition={targetPosition}
            isAnimating={isAnimating}
            onAnimationComplete={handleAnimationComplete}
            onProgress={handleProgress}
          />
        </Suspense>
      </Canvas>

      {/* Fade overlay during transition */}
      {isAnimating && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-10 transition-opacity duration-100"
          style={{ opacity: fadeOpacity }}
        />
      )}
    </div>
  )
}
