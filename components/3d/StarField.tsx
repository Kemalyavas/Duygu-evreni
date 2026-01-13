'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarFieldProps {
  count?: number
  brightness?: number // 1.0 = normal, higher = brighter (for mobile without bloom)
}

// Custom shader for twinkling, colorful stars
const starVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float twinkleSpeed;
  attribute float twinkleOffset;

  varying vec3 vColor;
  varying float vTwinkle;

  uniform float time;

  void main() {
    vColor = customColor;

    // Twinkling effect
    float twinkle = sin(time * twinkleSpeed + twinkleOffset) * 0.3 + 0.7;
    vTwinkle = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * twinkle * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;
  uniform float brightness;

  void main() {
    // Soft circular point
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Soft glow falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vTwinkle;

    // Apply brightness boost (for mobile without bloom)
    vec3 boostedColor = vColor * brightness;
    gl_FragColor = vec4(boostedColor, alpha * 0.9 * min(brightness, 1.5));
  }
`

// Nebula color palette for stars
const nebulaColors = [
  new THREE.Color('#ffffff'),   // White (most common)
  new THREE.Color('#B37DEA'),   // Stardust Lilac
  new THREE.Color('#9A80C6'),   // Celestial Lavender
  new THREE.Color('#8CBDF8'),   // Nimbus Blue
  new THREE.Color('#D99BE7'),   // Soft Pink
  new THREE.Color('#ECCDF3'),   // Cream Mist
  new THREE.Color('#FFE4B5'),   // Moccasin (warm)
]

export function StarField({ count = 2500, brightness = 1.0 }: StarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const _materialRef = useRef<THREE.ShaderMaterial>(null)

  // Create geometry with positions, colors, and twinkle attributes
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const twinkleSpeeds = new Float32Array(count)
    const twinkleOffsets = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Position - balanced depth
      const radius = 60 + Math.random() * 120 // 60-180 units away
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Color - slightly muted but visible
      const colorChoice = Math.random()
      let starColor: THREE.Color
      if (colorChoice < 0.65) {
        // Soft white
        starColor = new THREE.Color('#cccccc')
      } else {
        // Muted colored stars
        const baseColor = nebulaColors[Math.floor(Math.random() * (nebulaColors.length - 1)) + 1]
        starColor = baseColor.clone().lerp(new THREE.Color('#888888'), 0.3)
      }
      colors[i * 3] = starColor.r
      colors[i * 3 + 1] = starColor.g
      colors[i * 3 + 2] = starColor.b

      // Size - balanced
      sizes[i] = 0.4 + Math.random() * 1.0

      // Twinkle parameters
      twinkleSpeeds[i] = 0.4 + Math.random() * 1.5
      twinkleOffsets[i] = Math.random() * Math.PI * 2
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1))
    geo.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1))

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        brightness: { value: brightness },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [count, brightness])

  // Animate rotation and twinkling
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.008
      pointsRef.current.rotation.x += delta * 0.003
    }
    if (material.uniforms) {
      material.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
