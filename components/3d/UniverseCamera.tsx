'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '@/lib/constants/animation'
import { easeInOutCubic, calculateAnimationDuration } from '@/lib/utils/orbit'

interface CameraAnimatorProps {
  /** Trigger value - increments each time animation should start */
  animationTrigger: number
  /** Target camera position [x, y, z] */
  targetCameraPosition: [number, number, number] | null
  /** Target look-at position [x, y, z] */
  targetLookAt: [number, number, number] | null
  /** Callback when transition animation completes */
  onTransitionComplete: () => void
  /** Reference to OrbitControls */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orbitControlsRef: React.RefObject<any>
}

/**
 * Camera animation controller component
 * Handles smooth camera transitions between positions
 */
export function CameraAnimator({
  animationTrigger,
  targetCameraPosition,
  targetLookAt,
  onTransitionComplete,
  orbitControlsRef,
}: CameraAnimatorProps) {
  const { camera } = useThree()

  // Animation state refs
  const isAnimating = useRef(false)
  const animationStartTime = useRef(0)
  const animationDuration = useRef<number>(CAMERA.MAX_DURATION)
  const startCameraPos = useRef(new THREE.Vector3())
  const startTargetPos = useRef(new THREE.Vector3())
  const endCameraPos = useRef(new THREE.Vector3())
  const endTargetPos = useRef(new THREE.Vector3())
  const lastTrigger = useRef(0)

  useFrame(() => {
    const currentTime = performance.now() / 1000

    // Check if new animation should start
    if (animationTrigger !== lastTrigger.current && targetCameraPosition && targetLookAt) {
      lastTrigger.current = animationTrigger

      // Capture current camera position
      startCameraPos.current.copy(camera.position)
      if (orbitControlsRef.current) {
        startTargetPos.current.copy(orbitControlsRef.current.target)
      } else {
        startTargetPos.current.set(0, 0, 0)
      }

      // Set target positions
      endCameraPos.current.set(...targetCameraPosition)
      endTargetPos.current.set(...targetLookAt)

      // Calculate dynamic duration based on distance
      const distance = startCameraPos.current.distanceTo(endCameraPos.current)
      animationDuration.current = calculateAnimationDuration(
        distance,
        CAMERA.MIN_DURATION,
        CAMERA.MAX_DURATION,
        CAMERA.MAX_DISTANCE_REFERENCE
      )

      // Start animation
      animationStartTime.current = currentTime
      isAnimating.current = true
    }

    // Run animation
    if (isAnimating.current) {
      const elapsed = currentTime - animationStartTime.current
      const rawProgress = Math.min(elapsed / animationDuration.current, 1)
      const easedProgress = easeInOutCubic(rawProgress)

      // Interpolate camera position
      camera.position.lerpVectors(
        startCameraPos.current,
        endCameraPos.current,
        easedProgress
      )

      // Interpolate look-at target
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.lerpVectors(
          startTargetPos.current,
          endTargetPos.current,
          easedProgress
        )
        orbitControlsRef.current.update()
      }

      // Animation complete
      if (rawProgress >= 1) {
        isAnimating.current = false
        onTransitionComplete()
      }
    }
  })

  return null
}
