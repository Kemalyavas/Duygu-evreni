'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface PlanetModelProps {
  modelPath: string
  scale?: number
  rotationSpeed?: number
}

export function PlanetModel({ modelPath, scale = 1, rotationSpeed = 0.1 }: PlanetModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)

  // Clone the scene to avoid issues with reusing
  const clonedScene = scene.clone()

  // Slow rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload models for better performance
export function preloadPlanetModel(path: string) {
  useGLTF.preload(path)
}
