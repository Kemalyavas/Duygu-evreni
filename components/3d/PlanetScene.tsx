'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { OrbitingStars } from './OrbitingStar'
import { useMobile } from '@/lib/hooks/useMobile'
import * as THREE from 'three'
import type { Planet as PlanetType, Star } from '@/types'
import { PLANET_MODELS } from '@/lib/planetModels'

interface PlanetSceneProps {
  planet: PlanetType
  stars: Star[]
  onStarClick?: (star: Star) => void
  selectedStarId?: string
  readStarIds?: Set<string>
}

interface SceneProps extends PlanetSceneProps {
  isMobile: boolean
}

// Custom 3D Model Planet for detail view
function CustomPlanetModel({
  modelPath,
  planetColor,
  isHope = false,
  isDepression = false
}: {
  modelPath: string
  planetColor: string
  isHope?: boolean
  isDepression?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)

  // Clone scene and apply special materials
  const clonedScene = useMemo(() => {
    const cloned = scene.clone()

    // Depression - Unaffected by light (MeshBasicMaterial with original textures)
    if (isDepression) {
      cloned.traverse((child) => {
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
    }

    // Hope - Always bright (MeshBasicMaterial for constant brightness)
    if (isHope) {
      cloned.traverse((child) => {
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
    }

    return cloned
  }, [scene, isHope, isDepression])

  // Gentle breathing animation
  const { scale } = useSpring({
    from: { scale: 2.8 },
    to: { scale: 2.9 },
    loop: { reverse: true },
    config: { duration: 4000 },
  })

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  // Hope - Divine sun with its own light
  if (isHope) {
    return (
      <animated.group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
        <pointLight color="#FFE4B5" intensity={8} distance={50} decay={1.5} />
      </animated.group>
    )
  }

  // Depression - No extra lights
  if (isDepression) {
    return (
      <animated.group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
      </animated.group>
    )
  }

  return (
    <animated.group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
      {/* Extra lighting to make model pop */}
      <pointLight color="#ffffff" intensity={3} distance={8} decay={2} />
      <pointLight color={planetColor} intensity={2} distance={6} decay={2} position={[0, 1, 3]} />
    </animated.group>
  )
}

// Default sphere planet (fallback)
function DefaultPlanet({ planet }: { planet: PlanetType }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const color = useMemo(() => new THREE.Color(planet.color), [planet.color])
  const lighterColor = useMemo(() => {
    const c = new THREE.Color(planet.color)
    c.lerp(new THREE.Color('#ffffff'), 0.3)
    return c
  }, [planet.color])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
  })

  // Gentle breathing animation
  const { scale } = useSpring({
    from: { scale: 1 },
    to: { scale: 1.02 },
    loop: { reverse: true },
    config: { duration: 4000 },
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Main planet */}
      <animated.mesh ref={meshRef} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          roughness={0.3}
          metalness={0.1}
        />
      </animated.mesh>

      {/* Outer glow */}
      <animated.mesh scale={scale}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color={lighterColor}
          transparent
          opacity={0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </animated.mesh>

      {/* Glow light */}
      <pointLight color={color} intensity={2} distance={20} decay={2} />
    </group>
  )
}

function CenteredPlanet({ planet }: { planet: PlanetType }) {
  const modelPath = PLANET_MODELS[planet.name]
  const hasCustomModel = !!modelPath
  const color = useMemo(() => new THREE.Color(planet.color), [planet.color])
  const isHope = planet.name === 'Hope'
  const isDepression = planet.name === 'Depression'

  return (
    <group position={[0, 0, 0]}>
      {hasCustomModel ? (
        <Suspense fallback={null}>
          <CustomPlanetModel
            modelPath={modelPath}
            planetColor={planet.color}
            isHope={isHope}
            isDepression={isDepression}
          />
        </Suspense>
      ) : (
        <DefaultPlanet planet={planet} />
      )}

      {/* Point light for normal planets (not Hope or Depression) */}
      {!isHope && !isDepression && (
        <pointLight color={color} intensity={2} distance={20} decay={2} />
      )}
    </group>
  )
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white text-lg animate-pulse">Yükleniyor...</div>
    </Html>
  )
}

function Scene({ planet, stars, onStarClick, selectedStarId, readStarIds, isMobile }: SceneProps) {
  const isHope = planet.name === 'Hope'

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 1.5, 6]}
        fov={50}
        near={0.1}
        far={100}
      />

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.2}
        dampingFactor={0.05}
        enableDamping
      />

      {/* Ambient light - matches Universe */}
      <ambientLight color="#ffffff" intensity={0.25} />

      {/* Main directional light - simulates sunlight direction */}
      <directionalLight
        color={isHope ? "#FFFACD" : "#ffffff"}
        intensity={isHope ? 0.3 : 0.8}
        position={[5, 10, 5]}
      />

      {/* Back rim light for depth */}
      <directionalLight
        color="#4a0080"
        intensity={0.15}
        position={[-5, -5, -10]}
      />

      <CenteredPlanet planet={planet} />

      <OrbitingStars
        stars={stars}
        planetPosition={[0, 0, 0]}
        planetColor={planet.color}
        onStarClick={onStarClick}
        selectedStarId={selectedStarId}
        readStarIds={readStarIds}
      />

      {/* Bloom effect - disabled on mobile for performance */}
      {!isMobile && (
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.4}
            mipmapBlur
            radius={0.4}
          />
        </EffectComposer>
      )}
    </>
  )
}

export function PlanetScene(props: PlanetSceneProps) {
  const isMobile = useMobile()

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0a15] to-[#000000]">
      <Canvas
        dpr={isMobile ? 1 : [1, 2]}
        gl={{
          antialias: !isMobile,
          powerPreference: 'high-performance',
          alpha: false,
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene {...props} isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}
