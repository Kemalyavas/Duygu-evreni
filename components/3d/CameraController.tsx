'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraControllerProps {
  targetPosition: [number, number, number] | null
  isAnimating: boolean
  onAnimationComplete: () => void
  onProgress?: (progress: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orbitControlsRef: React.RefObject<any>
}

export function CameraController({
  targetPosition,
  isAnimating,
  onAnimationComplete,
  onProgress,
  orbitControlsRef,
}: CameraControllerProps) {
  const { camera } = useThree()
  const startPosition = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const progress = useRef(0)
  const animationStarted = useRef(false)
  const targetPosRef = useRef<[number, number, number] | null>(null)

  // Store target position and initialize animation when isAnimating becomes true
  useEffect(() => {
    if (isAnimating && targetPosition) {
      // Store starting camera position
      startPosition.current.copy(camera.position)
      if (orbitControlsRef.current) {
        startTarget.current.copy(orbitControlsRef.current.target)
      }
      // Store target
      targetPosRef.current = targetPosition
      // Reset progress
      progress.current = 0
      animationStarted.current = true
    } else {
      animationStarted.current = false
      targetPosRef.current = null
    }
  }, [isAnimating, targetPosition, camera, orbitControlsRef])

  useFrame((_, delta) => {
    // Only animate if we have started and have a target
    if (!animationStarted.current || !targetPosRef.current) return

    // Disable orbit controls during animation
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
    }

    // Calculate target camera position - fly INTO the planet
    const planetPos = new THREE.Vector3(...targetPosRef.current)
    const cameraOffset = new THREE.Vector3(0, 0.3, 1.5) // Very close, almost inside
    const finalCameraPos = planetPos.clone().add(cameraOffset)

    // Smooth easing function (ease-in-out cubic)
    progress.current += delta * 1.0
    const t = Math.min(progress.current, 1)
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2

    // Report progress for fade effect
    onProgress?.(eased)

    // Lerp camera position
    camera.position.lerpVectors(startPosition.current, finalCameraPos, eased)

    // Lerp orbit controls target (where camera looks)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.lerpVectors(startTarget.current, planetPos, eased)
      orbitControlsRef.current.update()
    }

    // Check if animation is complete
    if (t >= 1) {
      animationStarted.current = false
      // Re-enable orbit controls
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true
      }
      onAnimationComplete()
    }
  })

  return null
}
