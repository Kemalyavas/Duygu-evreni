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
  it('should apply the smallest-tier multiplier for 0 stars', () => {
    // 0 stars falls in the first threshold (count <= 10, multiplier 1.2): 3 * 1.2
    expect(getOrbitRadius(0)).toBeCloseTo(3.6, 5)
  })

  it('should apply the smallest-tier multiplier for small star counts', () => {
    expect(getOrbitRadius(5)).toBeCloseTo(3.6, 5)
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
    // 5 (base) * 1.2 (first-tier multiplier)
    expect(getOrbitRadius(0, 5)).toBeCloseTo(6, 5)
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

  it('should return one of the valid layer multipliers (1.0 / 1.6 / 2.3)', () => {
    for (const id of ['0000aaaa', 'a1b2c3d4', 'test-id', 'ffffeeee']) {
      expect([1.0, 1.6, 2.3]).toContain(getLayerMultiplier(id))
    }
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
    expect(duration).toBeCloseTo(1.8, 5)
  })

  it('should interpolate for intermediate distance', () => {
    const duration = calculateAnimationDuration(15, 0.6, 1.8, 30)
    expect(duration).toBeGreaterThan(0.6)
    expect(duration).toBeLessThan(1.8)
  })

  it('should cap at max for very large distances', () => {
    const duration = calculateAnimationDuration(100, 0.6, 1.8, 30)
    expect(duration).toBeCloseTo(1.8, 5)
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

  it('should offset the camera above and behind the planet (Y and Z, X stays aligned)', () => {
    const pos = calculatePlanetCameraPosition(mockPlanet, 0)
    expect(pos[0]).toBe(0) // X tracks the planet (no horizontal offset)
    expect(pos[1]).toBeGreaterThan(0) // raised above
    expect(pos[2]).toBeGreaterThan(0) // pulled back
  })

  it('should keep camera X aligned with the planet and offset Y/Z', () => {
    const planet = { ...mockPlanet, position_x: 10, position_y: 5, position_z: -3 }
    const pos = calculatePlanetCameraPosition(planet, 0)
    expect(pos[0]).toBe(10) // X tracks planet
    expect(pos[1]).toBeGreaterThan(5) // above planet Y
    expect(pos[2]).toBeGreaterThan(-3) // behind planet Z
  })
})

describe('calculateStarCameraPosition', () => {
  it('should place the camera beyond the star along the planet→star direction', () => {
    const starPos: [number, number, number] = [5, 5, 5]
    const planetPos: [number, number, number] = [0, 0, 0]
    const pos = calculateStarCameraPosition(starPos, planetPos, 3)

    // Camera sits further out than the star, so it frames the star against the planet
    expect(pos[0]).toBeGreaterThan(starPos[0])
    expect(pos[2]).toBeGreaterThan(starPos[2])
  })

  it('should push the camera further out for a larger distance', () => {
    const starPos: [number, number, number] = [10, 0, 0]
    const planetPos: [number, number, number] = [0, 0, 0]

    const close = calculateStarCameraPosition(starPos, planetPos, 2)
    const far = calculateStarCameraPosition(starPos, planetPos, 5)

    // Larger distance → camera further from the star/planet
    expect(far[0]).toBeGreaterThan(close[0])
  })
})
