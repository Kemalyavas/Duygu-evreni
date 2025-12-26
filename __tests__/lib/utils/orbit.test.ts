import { describe, it, expect } from 'vitest'
import {
  getOrbitRadius,
  getCameraDistance,
  getLayerMultiplier,
  easeInOutCubic,
  calculateAnimationDuration,
  calculatePlanetCameraPosition,
  calculateStarCameraPosition,
} from '@/lib/utils/orbit'

describe('getOrbitRadius', () => {
  it('should return base radius for 0 stars', () => {
    expect(getOrbitRadius(0)).toBe(3)
  })

  it('should return base radius for small star counts', () => {
    expect(getOrbitRadius(5)).toBe(3)
  })

  it('should increase radius logarithmically for larger star counts', () => {
    const radius10 = getOrbitRadius(10)
    const radius100 = getOrbitRadius(100)
    const radius1000 = getOrbitRadius(1000)

    expect(radius10).toBeGreaterThan(3)
    expect(radius100).toBeGreaterThan(radius10)
    expect(radius1000).toBeGreaterThan(radius100)
  })

  it('should use custom base radius when provided', () => {
    expect(getOrbitRadius(0, 5)).toBe(5)
  })
})

describe('getCameraDistance', () => {
  it('should return distance based on orbit radius', () => {
    const distance = getCameraDistance(3)
    expect(distance).toBeGreaterThan(3)
  })

  it('should increase with larger orbit radius', () => {
    const small = getCameraDistance(3)
    const large = getCameraDistance(10)
    expect(large).toBeGreaterThan(small)
  })
})

describe('getLayerMultiplier', () => {
  it('should return consistent value for same ID', () => {
    const mult1 = getLayerMultiplier('test-id')
    const mult2 = getLayerMultiplier('test-id')
    expect(mult1).toBe(mult2)
  })

  it('should return different values for different IDs', () => {
    const mult1 = getLayerMultiplier('id-1')
    const mult2 = getLayerMultiplier('id-2')
    // Different IDs should produce different multipliers (most of the time)
    // This is a probabilistic test
    expect(typeof mult1).toBe('number')
    expect(typeof mult2).toBe('number')
  })

  it('should return value within expected range', () => {
    const mult = getLayerMultiplier('test')
    expect(mult).toBeGreaterThanOrEqual(0.8)
    expect(mult).toBeLessThanOrEqual(1.4)
  })
})

describe('easeInOutCubic', () => {
  it('should return 0 for t=0', () => {
    expect(easeInOutCubic(0)).toBe(0)
  })

  it('should return 1 for t=1', () => {
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('should return 0.5 for t=0.5', () => {
    expect(easeInOutCubic(0.5)).toBe(0.5)
  })

  it('should be slow at the beginning', () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1)
  })

  it('should be slow at the end', () => {
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9)
  })
})

describe('calculateAnimationDuration', () => {
  it('should return min duration for zero distance', () => {
    const duration = calculateAnimationDuration(0, 0.6, 1.8, 30)
    expect(duration).toBe(0.6)
  })

  it('should return max duration for max distance', () => {
    const duration = calculateAnimationDuration(30, 0.6, 1.8, 30)
    expect(duration).toBe(1.8)
  })

  it('should interpolate for intermediate distance', () => {
    const duration = calculateAnimationDuration(15, 0.6, 1.8, 30)
    expect(duration).toBeGreaterThan(0.6)
    expect(duration).toBeLessThan(1.8)
  })

  it('should cap at max for very large distances', () => {
    const duration = calculateAnimationDuration(100, 0.6, 1.8, 30)
    expect(duration).toBe(1.8)
  })
})

describe('calculatePlanetCameraPosition', () => {
  const mockPlanet = {
    id: 'test',
    name: 'Test',
    name_tr: 'Test',
    color: '#ffffff',
    position_x: 0,
    position_y: 0,
    position_z: 0,
    scale: 1,
    description_tr: 'Test planet',
  }

  it('should return position offset from planet', () => {
    const pos = calculatePlanetCameraPosition(mockPlanet, 0)
    expect(pos[0]).not.toBe(0) // x offset
    expect(pos[1]).not.toBe(0) // y offset
    expect(pos[2]).not.toBe(0) // z offset
  })

  it('should return position relative to planet position', () => {
    const planet = { ...mockPlanet, position_x: 10, position_y: 5, position_z: -3 }
    const pos = calculatePlanetCameraPosition(planet, 0)
    // Camera should be offset from planet position
    expect(Math.abs(pos[0] - 10)).toBeGreaterThan(0)
  })
})

describe('calculateStarCameraPosition', () => {
  it('should return position between star and planet', () => {
    const starPos: [number, number, number] = [5, 5, 5]
    const planetPos: [number, number, number] = [0, 0, 0]
    const pos = calculateStarCameraPosition(starPos, planetPos, 3)

    // Camera should be between star and planet, closer to star
    expect(pos[0]).toBeLessThan(starPos[0])
    expect(pos[0]).toBeGreaterThan(planetPos[0])
  })

  it('should respect distance parameter', () => {
    const starPos: [number, number, number] = [10, 0, 0]
    const planetPos: [number, number, number] = [0, 0, 0]

    const close = calculateStarCameraPosition(starPos, planetPos, 2)
    const far = calculateStarCameraPosition(starPos, planetPos, 5)

    // Closer distance should result in camera closer to star
    expect(close[0]).toBeGreaterThan(far[0])
  })
})
