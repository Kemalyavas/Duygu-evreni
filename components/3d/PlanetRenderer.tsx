'use client'

import { Suspense, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import type { Planet as PlanetType } from '@/types'
import { PLANET_MODELS } from '@/lib/planetModels'
import { ORBIT, UI_ANIMATION } from '@/lib/constants/animation'

interface Planet3DProps {
  planet: PlanetType
  starCount: number
  isHope: boolean
  isDepression: boolean
  isFocused: boolean
  isVisible: boolean
  onClick: () => void
}

/**
 * Planet component with 3D model or fallback sphere
 */
export function Planet3D({
  planet,
  starCount,
  isHope,
  isDepression,
  isFocused,
  isVisible,
  onClick,
}: Planet3DProps) {
  const [hovered, setHovered] = useState(false)
  const modelPath = PLANET_MODELS[planet.name]
  const hasCustomModel = !!modelPath

  const baseColor = useMemo(() => new THREE.Color(planet.color), [planet.color])

  // Spring animation for hover
  const { scale } = useSpring({
    scale: hovered ? 1.08 : isFocused ? 1.04 : 1,
    config: {
      mass: UI_ANIMATION.SPRING_MASS,
      tension: UI_ANIMATION.SPRING_TENSION,
      friction: UI_ANIMATION.SPRING_FRICTION,
    },
  })

  // Visibility spring
  const { opacity } = useSpring({
    opacity: isVisible ? 1 : 0,
    config: { duration: UI_ANIMATION.FADE_DURATION },
  })

  // Unique float offset based on planet id
  const floatOffset = useMemo(() => {
    let hash = 0
    for (let i = 0; i < planet.id.length; i++) {
      hash = ((hash << 5) - hash) + planet.id.charCodeAt(i)
      hash |= 0
    }
    return (hash % 628) / 100
  }, [planet.id])

  const position: [number, number, number] = [
    planet.position_x,
    planet.position_y,
    planet.position_z,
  ]

  if (!isVisible) return null

  return (
    <group position={position}>
      <animated.group
        scale={scale}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
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
        {/* Invisible click sphere */}
        <mesh visible={false}>
          <sphereGeometry args={[(planet.scale || 1) * 1.2, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Planet visual */}
        {hasCustomModel ? (
          <Suspense fallback={null}>
            <CustomPlanetModel
              modelPath={modelPath}
              scale={(planet.scale || 1) * 3.2}
              planetColor={planet.color}
              isHope={isHope}
              isDepression={isDepression}
              floatOffset={floatOffset}
            />
          </Suspense>
        ) : (
          <DefaultPlanetMesh
            color={baseColor}
            scale={planet.scale || 1}
            hovered={hovered}
            floatOffset={floatOffset}
          />
        )}
      </animated.group>

      {/* Point light - Depression absorbs light */}
      {!isDepression && !isHope && (
        <pointLight
          color={baseColor}
          intensity={hovered ? 2.5 : 1.5}
          distance={(planet.scale || 1) * 10}
          decay={2}
        />
      )}

      {/* Hover tooltip */}
      {hovered && (
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
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Custom 3D Model Planet component
 */
function CustomPlanetModel({
  modelPath,
  scale,
  planetColor,
  isHope = false,
  isDepression = false,
  floatOffset = 0,
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

  const clonedScene = useMemo(() => scene.clone(), [scene])

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (initialY.current === null) {
        initialY.current = groupRef.current.position.y
      }

      // Slow rotation
      groupRef.current.rotation.y += delta * ORBIT.PLANET_ROTATION_SPEED

      // Gentle floating
      const floatY = Math.sin(state.clock.elapsedTime * ORBIT.PLANET_FLOAT_FREQUENCY + floatOffset) * ORBIT.PLANET_FLOAT_AMPLITUDE
      groupRef.current.position.y = initialY.current + floatY
    }
  })

  // Depression - unaffected by Hope's light
  if (isDepression) {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const oldMat = child.material as THREE.MeshStandardMaterial
        child.material = new THREE.MeshBasicMaterial({
          color: oldMat.color || '#ffffff',
          map: oldMat.map || null,
          alphaMap: oldMat.alphaMap || null,
          transparent: oldMat.transparent || false,
          opacity: oldMat.opacity || 1,
        })
      }
    })

    return (
      <group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
      </group>
    )
  }

  // Hope - The Divine Sun
  if (isHope) {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const oldMat = child.material as THREE.MeshStandardMaterial
        child.material = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.95,
          map: oldMat.map || null,
        })
      }
    })

    return (
      <group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
        <pointLight color="#FFE4B5" intensity={8} distance={50} decay={1.5} />
      </group>
    )
  }

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
      <pointLight color="#ffffff" intensity={2} distance={5} decay={2} />
      <pointLight color={planetColor} intensity={1.5} distance={4} decay={2} position={[0, 1, 2]} />
    </group>
  )
}

/**
 * Default sphere planet (fallback)
 */
function DefaultPlanetMesh({
  color,
  scale,
  hovered,
  floatOffset = 0,
}: {
  color: THREE.Color
  scale: number
  hovered: boolean
  floatOffset?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const initialY = useRef<number | null>(null)

  const lighterColor = useMemo(() => {
    const c = color.clone()
    c.lerp(new THREE.Color('#ffffff'), 0.3)
    return c
  }, [color])

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * ORBIT.PLANET_ROTATION_SPEED
    }
    if (groupRef.current) {
      if (initialY.current === null) {
        initialY.current = groupRef.current.position.y
      }
      const floatY = Math.sin(state.clock.elapsedTime * ORBIT.PLANET_FLOAT_FREQUENCY + floatOffset) * ORBIT.PLANET_FLOAT_AMPLITUDE
      groupRef.current.position.y = initialY.current + floatY
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      {/* Main sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
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
        <sphereGeometry args={[1.15, 32, 32]} />
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
