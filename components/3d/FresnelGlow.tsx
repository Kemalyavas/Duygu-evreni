'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { fresnelVertexShader, fresnelFragmentShader } from '@/lib/utils/shaders'
import { FRESNEL } from '@/lib/constants/animation'

interface FresnelGlowProps {
  /** Color of the glow effect */
  color: string
  /** Scale of the glow sphere */
  scale: number
  /** Intensity of the glow (0-1) */
  intensity?: number
}

/**
 * Fresnel glow component for planets
 * Creates a rim lighting effect that glows at the edges
 */
export function FresnelGlow({
  color,
  scale,
  intensity = FRESNEL.DEFAULT_INTENSITY,
}: FresnelGlowProps) {
  const glowColor = useMemo(() => new THREE.Color(color), [color])

  const uniforms = useMemo(
    () => ({
      glowColor: { value: glowColor },
      fresnelPower: { value: FRESNEL.POWER },
      glowIntensity: { value: intensity },
    }),
    [glowColor, intensity]
  )

  return (
    <mesh scale={scale * FRESNEL.SCALE_MULTIPLIER}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        vertexShader={fresnelVertexShader}
        fragmentShader={fresnelFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
