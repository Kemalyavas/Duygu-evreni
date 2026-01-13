'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VORTEX } from '@/lib/constants/animation'

interface LoadingVortexProps {
  /** Position of the vortex center */
  position: [number, number, number]
  /** Color of the vortex particles */
  color: string
  /** Whether data is currently loading */
  isLoading: boolean
  /** Scale of the planet (affects vortex size) */
  planetScale: number
  /** Callback when explosion animation starts */
  onExplosionStart?: () => void
}

type VortexPhase = 'idle' | 'loading' | 'exploding'

/**
 * Vortex loading effect component
 * Particles spiral into planet center, then explode outward when loading completes
 */
export function LoadingVortex({
  position,
  color,
  isLoading,
  planetScale,
  onExplosionStart,
}: LoadingVortexProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const vortexParticlesRef = useRef<THREE.Points>(null)

  const [phase, setPhase] = useState<VortexPhase>('idle')
  const [isVisible, setIsVisible] = useState(false)
  const explosionStartTime = useRef(0)
  const loadingStartTime = useRef(0)
  const wasLoading = useRef(false)
  const dataLoadedTime = useRef<number | null>(null)

  const baseColor = useMemo(() => new THREE.Color(color), [color])

  // Timer refs for cleanup
  const gatheringTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Brighter version of planet color
  const brightColor = useMemo(() => {
    const c = baseColor.clone()
    c.lerp(new THREE.Color('#ffffff'), 0.35)
    return c
  }, [baseColor])

  // Warm accent for explosion flash
  const explosionFlashColor = useMemo(() => {
    const c = baseColor.clone()
    c.lerp(new THREE.Color('#ffcc66'), 0.2)
    c.lerp(new THREE.Color('#ffffff'), 0.4)
    return c
  }, [baseColor])

  // Vortex particles data
  const vortexData = useMemo(() => {
    const positions = new Float32Array(VORTEX.PARTICLE_COUNT * 3)
    const initialAngles = new Float32Array(VORTEX.PARTICLE_COUNT)
    const initialRadii = new Float32Array(VORTEX.PARTICLE_COUNT)
    const speeds = new Float32Array(VORTEX.PARTICLE_COUNT)
    const heights = new Float32Array(VORTEX.PARTICLE_COUNT)

    for (let i = 0; i < VORTEX.PARTICLE_COUNT; i++) {
      // Golden ratio spiral distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const theta = i * goldenAngle
      const radius = 3 + (i / VORTEX.PARTICLE_COUNT) * 4
      const phi = Math.acos(1 - 2 * (i + 0.5) / VORTEX.PARTICLE_COUNT)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      initialAngles[i] = theta
      initialRadii[i] = radius
      speeds[i] = 0.6 + (i % 10) * 0.1
      // Use deterministic pseudo-random based on index for purity
      heights[i] = (Math.sin(i * 12.9898) * 0.5) * 1.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    return { geometry, initialAngles, initialRadii, speeds, heights }
  }, [])

  // Handle loading state changes
  useEffect(() => {
    if (isLoading && !wasLoading.current) {
      // Started loading
      setIsVisible(true)
      setPhase('loading')
      loadingStartTime.current = performance.now()
      dataLoadedTime.current = null
    } else if (!isLoading && wasLoading.current) {
      // Data finished loading - wait for minimum gathering time
      dataLoadedTime.current = performance.now()
      const elapsedTime = dataLoadedTime.current - loadingStartTime.current
      const remainingTime = Math.max(0, VORTEX.MIN_GATHERING_TIME - elapsedTime)

      gatheringTimerRef.current = setTimeout(() => {
        setPhase('exploding')
        explosionStartTime.current = performance.now()
        onExplosionStart?.()

        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false)
          setPhase('idle')
        }, VORTEX.HIDE_DELAY)
      }, remainingTime)
    }
    wasLoading.current = isLoading
  }, [isLoading, onExplosionStart])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (gatheringTimerRef.current) {
        clearTimeout(gatheringTimerRef.current)
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  useFrame(({ clock }) => {
    if (!isVisible) return

    const time = clock.elapsedTime

    if (phase === 'loading') {
      const loadingDuration = (performance.now() - loadingStartTime.current) / 1000
      const gatherProgress = Math.min(loadingDuration / (VORTEX.MIN_GATHERING_TIME / 1000), 1)

      // Animate vortex particles
      if (vortexParticlesRef.current) {
        const positions = vortexParticlesRef.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < VORTEX.PARTICLE_COUNT; i++) {
          const angle = vortexData.initialAngles[i] + time * vortexData.speeds[i] * (1 + gatherProgress)
          const easeIn = gatherProgress * gatherProgress
          const targetRadius = 0.2
          const radius = vortexData.initialRadii[i] * (1 - easeIn) + targetRadius * easeIn
          const wobble = (1 - gatherProgress) * 0.15

          positions[i * 3] = Math.cos(angle) * radius * planetScale * (1 + Math.sin(time * 2 + i) * wobble)
          positions[i * 3 + 1] = vortexData.heights[i] * radius * 0.3 * planetScale * (1 - gatherProgress * 0.8) + Math.sin(time * 3 + i * 0.1) * 0.1 * (1 - gatherProgress)
          positions[i * 3 + 2] = Math.sin(angle) * radius * planetScale * (1 + Math.cos(time * 2 + i) * wobble)
        }
        vortexParticlesRef.current.geometry.attributes.position.needsUpdate = true
      }

      // Glow compression effect
      if (glowRef.current) {
        const compressionProgress = Math.min(loadingDuration / (VORTEX.MIN_GATHERING_TIME / 1000), 1)
        const easedCompression = 1 - Math.pow(1 - compressionProgress, 2)
        const baseScale = VORTEX.GLOW_START_SCALE - (VORTEX.GLOW_START_SCALE - VORTEX.GLOW_END_SCALE) * easedCompression
        const pulse = 1 + Math.sin(time * 3) * 0.08 * (1 - compressionProgress * 0.5)
        const vibration = 1 + Math.sin(time * 12) * 0.02 * compressionProgress
        const scale = planetScale * baseScale * pulse * vibration

        glowRef.current.scale.setScalar(scale)
        glowRef.current.rotation.y = time * 0.5
        glowRef.current.rotation.z = Math.sin(time * 0.3) * 0.2

        const mat = glowRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.2 + compressionProgress * 0.4
      }
    } else if (phase === 'exploding') {
      const explosionProgress = Math.min((performance.now() - explosionStartTime.current) / VORTEX.EXPLOSION_DURATION, 1)
      const easeOut = 1 - Math.pow(1 - explosionProgress, 3)

      // Glow explosion
      if (glowRef.current) {
        const scale = planetScale * VORTEX.GLOW_END_SCALE * (1 + easeOut * 10)
        glowRef.current.scale.setScalar(scale)
        glowRef.current.rotation.y += 0.05

        const mat = glowRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = 0.9 * (1 - easeOut)
      }

      // Hide particles during explosion
      if (vortexParticlesRef.current) {
        const mat = vortexParticlesRef.current.material as THREE.PointsMaterial
        mat.opacity = 1 - easeOut
      }
    }
  })

  if (!isVisible) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Central glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={explosionFlashColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Vortex particles */}
      {(phase === 'loading' || phase === 'exploding') && (
        <points ref={vortexParticlesRef} geometry={vortexData.geometry}>
          <pointsMaterial
            color={brightColor}
            size={0.08}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  )
}
