'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Star } from '@/types'

// Utils & Constants
import { getOrbitRadius, getCameraDistance, getLayerMultiplier } from '@/lib/utils/orbit'
import { STAR_VISUAL } from '@/lib/constants/ui'

// Re-export for backward compatibility
export { getOrbitRadius, getCameraDistance }

interface OrbitingStarsProps {
  stars: Star[]
  planetPosition: [number, number, number]
  planetColor: string
  onStarClick?: (star: Star) => void
  selectedStarId?: string
  readStarIds?: Set<string>
  animateIn?: boolean
  onSelectedStarPosition?: (position: [number, number, number]) => void
}

// Create a 4-pointed star shape geometry (shared across all instances)
const starGeometry = (() => {
  const shape = new THREE.Shape()

  for (let i = 0; i < STAR_VISUAL.GEOMETRY_POINTS * 2; i++) {
    const radius = i % 2 === 0 ? STAR_VISUAL.GEOMETRY_OUTER_RADIUS : STAR_VISUAL.GEOMETRY_INNER_RADIUS
    const angle = (i * Math.PI) / STAR_VISUAL.GEOMETRY_POINTS - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) {
      shape.moveTo(x, y)
    } else {
      shape.lineTo(x, y)
    }
  }
  shape.closePath()

  return new THREE.ShapeGeometry(shape)
})()

// Pre-calculated data for each star (computed once)
interface StarInstanceData {
  speed: number
  phase: number
  floatSpeed: number
  floatAmplitude: number
  initialPos: [number, number, number]
  distanceFromCenter: number  // For staggered appear animation
  appearDelay: number         // 0-1, normalized delay based on distance
}

// ============================================
// INSTANCED STARS - High performance rendering
// ============================================
export function OrbitingStars({
  stars,
  planetPosition,
  planetColor,
  onStarClick,
  selectedStarId,
  readStarIds,
  animateIn = false,
  onSelectedStarPosition,
}: OrbitingStarsProps) {
  // Refs for instanced meshes
  const normalMeshRef = useRef<THREE.InstancedMesh>(null)
  const readMeshRef = useRef<THREE.InstancedMesh>(null)

  // Store current world positions for raycasting
  const starPositionsRef = useRef<THREE.Vector3[]>([])
  const starScalesRef = useRef<number[]>([])

  // Selected star highlight
  const highlightRef = useRef<THREE.Mesh>(null)

  // Track if we've reported selected star position
  const lastReportedStarId = useRef<string | null>(null)

  // Appear animation state - use ref to avoid re-renders during animation
  const appearProgressRef = useRef(animateIn ? 0 : 1)
  const appearStartTime = useRef<number | null>(null)
  // Total animation duration for Big Bang effect
  const APPEAR_DURATION = 1200 // ms total for explosion + settle effect
  const STAGGER_SPREAD = 0.3 // Stars start appearing over 30% of duration
  const EXPLOSION_SETTLE_TIME = 0.7 // 70% of animation is for explosion settling

  // Refs for material opacity control
  const normalMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const readMaterialRef = useRef<THREE.MeshStandardMaterial>(null)

  // Trigger appear animation on mount when animateIn is true
  useEffect(() => {
    if (animateIn && appearProgressRef.current === 0) {
      appearStartTime.current = performance.now()
    }
  }, [animateIn])

  const { camera, gl } = useThree()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Raycaster for manual hit detection
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const pointer = useMemo(() => new THREE.Vector2(), [])

  // Base color
  const baseColor = useMemo(() => new THREE.Color(planetColor), [planetColor])
  // Dim color for read stars - blend toward gray, always visible
  const dimColor = useMemo(() => {
    const c = baseColor.clone()
    // Blend 70% toward a medium gray - more dimmed for read stars (30% original brightness)
    c.lerp(new THREE.Color('#888888'), 0.7)
    return c
  }, [baseColor])
  const brightColor = useMemo(() => {
    const c = baseColor.clone()
    c.lerp(new THREE.Color('#ffffff'), 0.3)
    return c
  }, [baseColor])

  // Calculate orbit scale based on star count
  const orbitScale = useMemo(() => getOrbitRadius(stars.length, 3) / 3, [stars.length])

  // Pre-calculate orbit data for each star (memoized)
  const starData = useMemo<StarInstanceData[]>(() => {
    // First pass: calculate all data and find max distance
    const dataWithDistances = stars.map(star => {
      const speed = 0.015 + (parseInt(star.id.slice(0, 8), 16) % 100) / 4000
      const phase = (parseInt(star.id.slice(8, 16), 16) % 100) / 100 * Math.PI * 2
      const floatSpeed = 0.15 + (parseInt(star.id.slice(4, 8), 16) % 100) / 600
      const floatAmplitude = 0.03 + (parseInt(star.id.slice(12, 16), 16) % 30) / 600
      const layerMultiplier = getLayerMultiplier(star.id)

      let initialPos: [number, number, number] = [
        star.position_x * orbitScale * layerMultiplier,
        star.position_y * orbitScale * layerMultiplier,
        star.position_z * orbitScale * layerMultiplier
      ]

      // Calculate distance from center
      let distanceFromCenter = Math.sqrt(
        initialPos[0] ** 2 + initialPos[1] ** 2 + initialPos[2] ** 2
      )

      // Minimum orbit radius - keep stars outside the planet (2.5 units from center)
      const minOrbitRadius = 2.5
      if (distanceFromCenter < minOrbitRadius && distanceFromCenter > 0.01) {
        // Push star outward to minimum radius
        const scale = minOrbitRadius / distanceFromCenter
        initialPos = [
          initialPos[0] * scale,
          initialPos[1] * scale,
          initialPos[2] * scale
        ]
        distanceFromCenter = minOrbitRadius
      } else if (distanceFromCenter <= 0.01) {
        // Star at center - give it a random position at minimum radius
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        initialPos = [
          minOrbitRadius * Math.sin(phi) * Math.cos(theta),
          minOrbitRadius * Math.sin(phi) * Math.sin(theta),
          minOrbitRadius * Math.cos(phi)
        ]
        distanceFromCenter = minOrbitRadius
      }

      return { speed, phase, floatSpeed, floatAmplitude, initialPos, distanceFromCenter, appearDelay: 0 }
    })

    // Find max distance for normalization
    const maxDistance = Math.max(...dataWithDistances.map(d => d.distanceFromCenter), 1)

    // Second pass: normalize delays (closer = 0, farther = 1)
    return dataWithDistances.map(data => ({
      ...data,
      appearDelay: data.distanceFromCenter / maxDistance
    }))
  }, [stars, orbitScale])

  // Separate stars into normal and read groups
  const { normalIndices, readIndices, starToInstanceMap } = useMemo(() => {
    const normalIndices: number[] = []
    const readIndices: number[] = []
    const starToInstanceMap = new Map<number, { isRead: boolean; instanceIndex: number }>()

    stars.forEach((star, i) => {
      const isRead = readStarIds?.has(star.id) ?? false
      if (isRead) {
        starToInstanceMap.set(i, { isRead: true, instanceIndex: readIndices.length })
        readIndices.push(i)
      } else {
        starToInstanceMap.set(i, { isRead: false, instanceIndex: normalIndices.length })
        normalIndices.push(i)
      }
    })

    return { normalIndices, readIndices, starToInstanceMap }
  }, [stars, readStarIds])

  // Initialize position storage
  useEffect(() => {
    starPositionsRef.current = stars.map(() => new THREE.Vector3())
    starScalesRef.current = stars.map(() => 0.07)
  }, [stars.length])

  // Reusable objects for matrix calculations (avoid GC)
  const tempMatrix = useMemo(() => new THREE.Matrix4(), [])
  const tempPosition = useMemo(() => new THREE.Vector3(), [])
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const tempScale = useMemo(() => new THREE.Vector3(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  // Update instance matrices and colors every frame
  useFrame(({ clock }) => {
    const normalMesh = normalMeshRef.current
    const readMesh = readMeshRef.current

    const elapsedTime = clock.elapsedTime

    // Update appear animation progress
    if (appearStartTime.current !== null && appearProgressRef.current < 1) {
      const elapsed = performance.now() - appearStartTime.current
      const rawProgress = Math.min(elapsed / APPEAR_DURATION, 1)
      // Ease out cubic for smooth deceleration
      appearProgressRef.current = 1 - Math.pow(1 - rawProgress, 3)
    }

    // Find selected star index
    const selectedIndex = selectedStarId
      ? stars.findIndex(s => s.id === selectedStarId)
      : -1

    // Update all stars
    stars.forEach((star, starIndex) => {
      const data = starData[starIndex]
      const mappingInfo = starToInstanceMap.get(starIndex)
      if (!mappingInfo) return

      // Calculate final orbit position (orbit rotation + float)
      const t = elapsedTime * data.speed + data.phase
      const finalX = data.initialPos[0] * Math.cos(t) - data.initialPos[2] * Math.sin(t)
      const finalZ = data.initialPos[0] * Math.sin(t) + data.initialPos[2] * Math.cos(t)
      const floatY = Math.sin(elapsedTime * data.floatSpeed + data.phase) * data.floatAmplitude
      const finalY = data.initialPos[1] + floatY

      // Calculate per-star explosion progress (for position interpolation)
      let explosionProgress = 1
      if (appearProgressRef.current < 1) {
        const starStartTime = data.appearDelay * STAGGER_SPREAD
        const starLocalProgress = Math.max(0, (appearProgressRef.current - starStartTime) / (1 - STAGGER_SPREAD))
        // Ease out exponential for explosive start, smooth settle
        explosionProgress = 1 - Math.pow(1 - Math.min(1, starLocalProgress / EXPLOSION_SETTLE_TIME), 3)
      }

      // Big Bang effect: stars start from center and explode outward to their orbits
      const x = finalX * explosionProgress
      const y = finalY * explosionProgress
      const z = finalZ * explosionProgress

      const worldX = planetPosition[0] + x
      const worldY = planetPosition[1] + y
      const worldZ = planetPosition[2] + z

      tempPosition.set(worldX, worldY, worldZ)

      // Store position for raycasting
      if (starPositionsRef.current[starIndex]) {
        starPositionsRef.current[starIndex].set(worldX, worldY, worldZ)
      }

      // Billboard rotation (face camera)
      tempQuaternion.copy(camera.quaternion)

      // Scale with pulse effect - only for unread stars
      const isRead = readStarIds?.has(stars[starIndex].id) ?? false
      // Read stars don't pulse - they're "consumed"
      const pulse = isRead ? 1 : (1 + Math.sin(elapsedTime * 1.5 + data.phase) * 0.15)
      const isHovered = starIndex === hoveredIndex
      const isSelected = starIndex === selectedIndex

      // Selected star is bigger, read stars slightly smaller
      const baseScale = isSelected ? 0.14 : (isRead ? 0.055 : 0.07)

      // Scale animation: quick pop at start, then normal
      // explosionProgress is already calculated above for position
      const scaleProgress = Math.min(1, explosionProgress * 1.5) // Scale reaches full faster than position
      const finalScale = baseScale * pulse * scaleProgress

      // Store scale for raycasting
      if (starScalesRef.current) {
        starScalesRef.current[starIndex] = finalScale
      }

      tempScale.setScalar(finalScale)

      // Compose and set matrix for visual mesh
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale)

      if (mappingInfo.isRead && readMesh) {
        readMesh.setMatrixAt(mappingInfo.instanceIndex, tempMatrix)
        tempColor.copy(dimColor)
        readMesh.setColorAt(mappingInfo.instanceIndex, tempColor)
      } else if (!mappingInfo.isRead && normalMesh) {
        normalMesh.setMatrixAt(mappingInfo.instanceIndex, tempMatrix)
        tempColor.copy(isHovered ? brightColor : baseColor)
        normalMesh.setColorAt(mappingInfo.instanceIndex, tempColor)
      }
    })

    // Mark matrices as needing update
    if (normalMesh && normalIndices.length > 0) {
      normalMesh.instanceMatrix.needsUpdate = true
      if (normalMesh.instanceColor) {
        normalMesh.instanceColor.needsUpdate = true
      }
    }

    if (readMesh && readIndices.length > 0) {
      readMesh.instanceMatrix.needsUpdate = true
      if (readMesh.instanceColor) {
        readMesh.instanceColor.needsUpdate = true
      }
    }

    // Update selected star highlight position (subtle glow only)
    if (selectedIndex >= 0 && starPositionsRef.current[selectedIndex]) {
      const selectedPos = starPositionsRef.current[selectedIndex]

      // Report position to parent (only once per selection change)
      if (selectedStarId && lastReportedStarId.current !== selectedStarId && onSelectedStarPosition) {
        lastReportedStarId.current = selectedStarId
        onSelectedStarPosition([selectedPos.x, selectedPos.y, selectedPos.z])
      }

      // Glow sphere
      if (highlightRef.current) {
        highlightRef.current.position.copy(selectedPos)
        highlightRef.current.quaternion.copy(camera.quaternion)
        // Pulsing scale
        const highlightPulse = 1 + Math.sin(elapsedTime * 3) * 0.2
        highlightRef.current.scale.setScalar(0.3 * highlightPulse)
        highlightRef.current.visible = true
      }
    } else {
      // Hide highlight when no star selected
      if (highlightRef.current) highlightRef.current.visible = false
      lastReportedStarId.current = null
    }

    // Update material opacity - always set to ensure correct values after mesh recreation
    if (appearProgressRef.current < 1) {
      // Quick opacity fade-in (reaches full opacity at 40% of animation)
      const opacityProgress = Math.min(1, appearProgressRef.current * 2.5)
      const opacity = opacityProgress * opacityProgress // Ease in

      if (normalMaterialRef.current) {
        normalMaterialRef.current.opacity = opacity * 0.95
      }
      if (readMaterialRef.current) {
        readMaterialRef.current.opacity = opacity * 0.5
      }
    } else {
      // Animation complete - ensure full opacity (fixes mesh recreation bug)
      if (normalMaterialRef.current && normalMaterialRef.current.opacity !== 0.95) {
        normalMaterialRef.current.opacity = 0.95
      }
      if (readMaterialRef.current && readMaterialRef.current.opacity !== 0.5) {
        readMaterialRef.current.opacity = 0.5
      }
    }
  })

  // Find closest star to ray
  const findClosestStar = (mouseX: number, mouseY: number): number | null => {
    pointer.x = (mouseX / gl.domElement.clientWidth) * 2 - 1
    pointer.y = -(mouseY / gl.domElement.clientHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)

    let closestIndex: number | null = null
    let closestDistance = Infinity

    // Check distance to each star
    const ray = raycaster.ray
    const hitRadius = 0.08 // Hit detection radius (tight for precision)

    starPositionsRef.current.forEach((pos, index) => {
      if (!pos) return

      // Distance from ray to point
      const starPos = pos.clone()
      const toStar = starPos.sub(ray.origin)
      const projLength = toStar.dot(ray.direction)

      if (projLength < 0) return // Behind camera

      const projPoint = ray.origin.clone().add(ray.direction.clone().multiplyScalar(projLength))
      const distance = projPoint.distanceTo(starPositionsRef.current[index])

      // Scale-adjusted hit radius (tighter for precision)
      const scale = starScalesRef.current[index] || 0.07
      const adjustedHitRadius = hitRadius + scale * 0.8

      if (distance < adjustedHitRadius && projLength < closestDistance) {
        closestDistance = projLength
        closestIndex = index
      }
    })

    return closestIndex
  }

  // Mouse and touch event handlers
  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const closest = findClosestStar(x, y)

      if (closest !== null) {
        setHoveredIndex(closest)
        canvas.style.cursor = 'pointer'
      } else {
        setHoveredIndex(null)
        canvas.style.cursor = 'auto'
      }
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const closest = findClosestStar(x, y)

      if (closest !== null && stars[closest]) {
        onStarClick?.(stars[closest])
      }
    }

    // Touch event handlers for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const touch = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      const closest = findClosestStar(x, y)

      if (closest !== null) {
        setHoveredIndex(closest)
      } else {
        setHoveredIndex(null)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return
      const touch = e.changedTouches[0]
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      const closest = findClosestStar(x, y)

      if (closest !== null && stars[closest]) {
        onStarClick?.(stars[closest])
      }
      // Reset hover state after touch
      setHoveredIndex(null)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true })
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      // Note: passive option must match when removing event listeners
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      // Reset cursor on cleanup
      canvas.style.cursor = 'auto'
    }
  }, [gl, camera, stars, onStarClick])

  // Initialize instance colors on mount
  useEffect(() => {
    if (normalMeshRef.current && normalIndices.length > 0) {
      normalIndices.forEach((_, instanceIndex) => {
        normalMeshRef.current!.setColorAt(instanceIndex, baseColor)
      })
      if (normalMeshRef.current.instanceColor) {
        normalMeshRef.current.instanceColor.needsUpdate = true
      }
    }

    if (readMeshRef.current && readIndices.length > 0) {
      readIndices.forEach((_, instanceIndex) => {
        readMeshRef.current!.setColorAt(instanceIndex, dimColor)
      })
      if (readMeshRef.current.instanceColor) {
        readMeshRef.current.instanceColor.needsUpdate = true
      }
    }
  }, [normalIndices, readIndices, baseColor, dimColor])

  if (stars.length === 0) return null

  return (
    <group>
      {/* Normal (unread) stars - bright and prominent */}
      {normalIndices.length > 0 && (
        <instancedMesh
          key={`normal-${normalIndices.length}`}
          ref={normalMeshRef}
          args={[starGeometry, undefined, normalIndices.length]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            ref={normalMaterialRef}
            toneMapped={false}
            side={THREE.DoubleSide}
            transparent
            opacity={animateIn ? 0 : 0.95}
            emissive={baseColor}
            emissiveIntensity={3}
            depthWrite={false}
          />
        </instancedMesh>
      )}

      {/* Read stars - dimmer appearance */}
      {readIndices.length > 0 && (
        <instancedMesh
          key={`read-${readIndices.length}`}
          ref={readMeshRef}
          args={[starGeometry, undefined, readIndices.length]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            ref={readMaterialRef}
            toneMapped={false}
            side={THREE.DoubleSide}
            transparent
            opacity={animateIn ? 0 : 0.5}
            emissive={dimColor}
            emissiveIntensity={1.5}
            depthWrite={false}
          />
        </instancedMesh>
      )}

      {/* Selected star highlight - subtle glow */}
      <mesh ref={highlightRef} visible={false}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color={brightColor}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
