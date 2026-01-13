'use client'

import { useRef, useMemo, useState, Suspense, useEffect, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Planet as PlanetType } from '@/types'
import { PLANET_MODELS } from '@/lib/planetModels'

interface PlanetProps {
  planet: PlanetType
  starCount?: number
  onClick?: () => void
  isSelected?: boolean
}

// Fresnel shader for rim glow effect
const fresnelVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fresnelFragmentShader = `
uniform vec3 glowColor;
uniform float fresnelPower;
uniform float glowIntensity;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDirection = normalize(-vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), fresnelPower);
  gl_FragColor = vec4(glowColor, fresnel * glowIntensity);
}
`

// Fresnel glow component for planets
export function FresnelGlow({ color, scale, intensity = 0.6 }: { color: string; scale: number; intensity?: number }) {
  const glowColor = useMemo(() => new THREE.Color(color), [color])

  const uniforms = useMemo(() => ({
    glowColor: { value: glowColor },
    fresnelPower: { value: 2.5 },
    glowIntensity: { value: intensity }
  }), [glowColor, intensity])

  return (
    <mesh scale={scale * 1.08}>
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

// Custom 3D Model Planet
function CustomPlanetModel({
  modelPath,
  scale,
  planetColor,
  isHope = false,
  isDepression = false,
  floatOffset = 0
}: {
  modelPath: string
  scale: number
  planetColor: string
  isHope?: boolean
  isDepression?: boolean
  floatOffset?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)
  const initialY = useRef<number | null>(null)
  const createdMaterials = useRef<THREE.Material[]>([])

  // Clone scene - keep original materials
  const clonedScene = useMemo(() => {
    // Clear previously created materials
    createdMaterials.current = []
    return scene.clone()
  }, [scene])

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      createdMaterials.current.forEach(mat => mat.dispose())
      createdMaterials.current = []
    }
  }, [])

  // Rotation + Floating
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Store initial Y position
      if (initialY.current === null) {
        initialY.current = groupRef.current.position.y
      }

      // Slow rotation
      groupRef.current.rotation.y += delta * 0.08

      // Gentle floating (sine wave)
      const floatY = Math.sin(state.clock.elapsedTime * 0.5 + floatOffset) * 0.15
      groupRef.current.position.y = initialY.current + floatY
    }
  })

  // Depression - Unaffected by Hope's light (uses MeshBasicMaterial with original textures)
  if (isDepression) {
    // Convert to MeshBasicMaterial but keep original color and textures
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const oldMat = child.material as THREE.MeshStandardMaterial
        const newMat = new THREE.MeshBasicMaterial({
          color: oldMat.color || '#ffffff',
          map: oldMat.map || null,
          alphaMap: oldMat.alphaMap || null,
          transparent: oldMat.transparent || false,
          opacity: oldMat.opacity || 1,
        })
        child.material = newMat
        createdMaterials.current.push(newMat)
      }
    })

    return (
      <group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
      </group>
    )
  }

  // Hope - The Divine Sun (always bright, unaffected by shadows)
  if (isHope) {
    // Override all materials to MeshBasicMaterial for constant brightness
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const oldMat = child.material as THREE.MeshStandardMaterial
        const newMat = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.95,
          map: oldMat.map || null,
        })
        child.material = newMat
        createdMaterials.current.push(newMat)
      }
    })

    return (
      <group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
        {/* Divine golden-turquoise light */}
        <pointLight color="#FFE4B5" intensity={8} distance={50} decay={1.5} />
      </group>
    )
  }

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
      {/* Extra lighting to make model pop */}
      <pointLight color="#ffffff" intensity={2} distance={5} decay={2} />
      <pointLight color={planetColor} intensity={1.5} distance={4} decay={2} position={[0, 1, 2]} />
    </group>
  )
}

// Default sphere planet (fallback)
function DefaultPlanet({
  color,
  scale,
  hovered,
  floatOffset = 0,
  isMobile = false
}: {
  color: THREE.Color
  scale: number
  hovered: boolean
  floatOffset?: number
  isMobile?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const initialY = useRef<number | null>(null)
  const lighterColor = useMemo(() => {
    const c = color.clone()
    c.lerp(new THREE.Color('#ffffff'), 0.3)
    return c
  }, [color])

  // Reduce polygon count on mobile for better performance
  const sphereSegments = isMobile ? 32 : 64
  const glowSegments = isMobile ? 16 : 32

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.08
    }
    if (groupRef.current) {
      if (initialY.current === null) {
        initialY.current = groupRef.current.position.y
      }
      const floatY = Math.sin(state.clock.elapsedTime * 0.5 + floatOffset) * 0.15
      groupRef.current.position.y = initialY.current + floatY
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      {/* Main sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.0 : 0.7}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Glow */}
      <mesh>
        <sphereGeometry args={[1.15, glowSegments, glowSegments]} />
        <meshBasicMaterial
          color={lighterColor}
          transparent
          opacity={hovered ? 0.4 : 0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function Planet({ planet, starCount = 0, onClick, isSelected = false }: PlanetProps) {
  const [hovered, setHovered] = useState(false)
  const [showMobileTooltip, setShowMobileTooltip] = useState(false)
  const mobileTooltipTimeout = useRef<NodeJS.Timeout | null>(null)

  const baseColor = useMemo(() => new THREE.Color(planet.color), [planet.color])
  const modelPath = PLANET_MODELS[planet.name]
  const hasCustomModel = !!modelPath
  const isHope = planet.name === 'Hope'
  const isDepression = planet.name === 'Depression'

  // Detect mobile device
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.matchMedia('(pointer: coarse)').matches
  }, [])

  // Generate unique float offset based on planet id for varied floating phases
  const floatOffset = useMemo(() => {
    let hash = 0
    for (let i = 0; i < planet.id.length; i++) {
      hash = ((hash << 5) - hash) + planet.id.charCodeAt(i)
      hash |= 0
    }
    return (hash % 628) / 100 // 0 to ~6.28 (2π)
  }, [planet.id])

  // Handle click - on mobile: first tap shows tooltip, second tap enters
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    if (isMobile) {
      if (showMobileTooltip) {
        // Second tap - enter planet
        setShowMobileTooltip(false)
        if (mobileTooltipTimeout.current) {
          clearTimeout(mobileTooltipTimeout.current)
        }
        onClick?.()
      } else {
        // First tap - show tooltip
        setShowMobileTooltip(true)
        // Auto-hide tooltip after 3 seconds
        mobileTooltipTimeout.current = setTimeout(() => {
          setShowMobileTooltip(false)
        }, 3000)
      }
    } else {
      // Desktop - direct click
      onClick?.()
    }
  }, [isMobile, showMobileTooltip, onClick])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mobileTooltipTimeout.current) {
        clearTimeout(mobileTooltipTimeout.current)
      }
    }
  }, [])

  // Show tooltip if hovered (desktop) or showMobileTooltip (mobile)
  const shouldShowTooltip = hovered || showMobileTooltip

  // Spring animation
  const { scale } = useSpring({
    scale: hovered || showMobileTooltip ? 1.08 : isSelected ? 1.04 : 1,
    config: { mass: 1, tension: 200, friction: 20 },
  })

  const position: [number, number, number] = [
    planet.position_x,
    planet.position_y,
    planet.position_z,
  ]

  return (
    <group position={position}>
      {/* Clickable area */}
      <animated.group
        scale={scale}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {/* Invisible click sphere - visible but fully transparent for raycasting */}
        <mesh>
          <sphereGeometry args={[planet.scale * 1.2, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>

        {/* Planet visual */}
        {hasCustomModel ? (
          <Suspense fallback={null}>
            <CustomPlanetModel
              modelPath={modelPath}
              scale={planet.scale * 3.2}
              planetColor={planet.color}
              isHope={isHope}
              isDepression={isDepression}
              floatOffset={floatOffset}
            />
          </Suspense>
        ) : (
          <DefaultPlanet color={baseColor} scale={planet.scale} hovered={hovered} floatOffset={floatOffset} isMobile={isMobile} />
        )}
      </animated.group>

      {/* Point light - Depression absorbs light, Hope handled in CustomPlanetModel */}
      {!isDepression && !isHope && (
        <pointLight
          color={baseColor}
          intensity={shouldShowTooltip ? 2.5 : 1.5}
          distance={planet.scale * 10}
          decay={2}
        />
      )}

      {/* Hover/Tap tooltip */}
      {shouldShowTooltip && (
        <Html
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            transform: 'translateY(-80px)',
          }}
        >
          <div className="glass-tooltip">
            <p className="text-white font-bold text-xl">{planet.name_tr}</p>
            <p className="text-white/70 text-base">{starCount} yıldız</p>
            {showMobileTooltip && (
              <p className="text-cyan-400/80 text-xs mt-1">Girmek için tekrar dokun</p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
