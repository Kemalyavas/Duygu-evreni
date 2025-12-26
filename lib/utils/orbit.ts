/**
 * Orbit and position calculation utilities
 * Extracted from OrbitingStar.tsx for reusability and testing
 */

import { ORBIT_RADIUS, CAMERA_DISTANCE, STAR_LAYERS } from '@/lib/constants/ui'

/**
 * Calculate scalable orbit radius based on star count
 * More stars = larger orbit to prevent overcrowding
 *
 * @param starCount - Number of stars in orbit
 * @param baseRadius - Base radius multiplier (default: 3)
 * @returns Calculated orbit radius
 */
export function getOrbitRadius(starCount: number, baseRadius: number = ORBIT_RADIUS.BASE): number {
  // Find the appropriate threshold
  for (const { count, multiplier } of ORBIT_RADIUS.THRESHOLDS) {
    if (starCount <= count) {
      return baseRadius * multiplier
    }
  }

  // For very large counts, use logarithmic scaling
  return baseRadius * ORBIT_RADIUS.MAX_MULTIPLIER +
    Math.log10(starCount / 10000) * ORBIT_RADIUS.LOG_SCALE_FACTOR
}

/**
 * Calculate optimal camera distance based on orbit radius
 * Ensures all stars are visible in the viewport
 *
 * @param orbitRadius - The orbit radius of stars
 * @returns Optimal camera distance
 */
export function getCameraDistance(orbitRadius: number): number {
  return orbitRadius * CAMERA_DISTANCE.ORBIT_MULTIPLIER + CAMERA_DISTANCE.BASE_OFFSET
}

/**
 * Calculate layer multiplier for a star based on its ID
 * Distributes stars across inner, middle, and outer layers
 *
 * @param starId - Unique star identifier
 * @returns Layer multiplier (1.0 for inner, 1.6 for middle, 2.3 for outer)
 */
export function getLayerMultiplier(starId: string): number {
  const layerHash = parseInt(starId.slice(0, 4), 16) % 100

  if (layerHash < STAR_LAYERS.INNER_THRESHOLD) {
    return STAR_LAYERS.INNER_MULTIPLIER  // Inner layer (30%)
  }
  if (layerHash < STAR_LAYERS.MIDDLE_THRESHOLD) {
    return STAR_LAYERS.MIDDLE_MULTIPLIER  // Middle layer (35%)
  }
  return STAR_LAYERS.OUTER_MULTIPLIER  // Outer layer (35%)
}

/**
 * Generate random orbit position around planet center
 * Uses spherical coordinates for even distribution
 *
 * @param planetScale - Scale of the planet
 * @returns Position as [x, y, z] tuple
 */
export function generateOrbitPosition(planetScale: number): [number, number, number] {
  const orbitRadius = planetScale * 2 + Math.random() * 1.5
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)

  return [
    orbitRadius * Math.sin(phi) * Math.cos(theta),
    orbitRadius * Math.sin(phi) * Math.sin(theta),
    orbitRadius * Math.cos(phi),
  ]
}

/**
 * Calculate camera position for planet view
 *
 * @param planet - Planet object with position and id
 * @param starCount - Number of stars around the planet
 * @returns Camera position as [x, y, z] tuple
 */
export function calculatePlanetCameraPosition(
  planet: { position_x: number; position_y: number; position_z: number },
  starCount: number
): [number, number, number] {
  const orbitRadius = getOrbitRadius(starCount, ORBIT_RADIUS.BASE)
  const cameraDistance = getCameraDistance(orbitRadius)

  return [
    planet.position_x,
    planet.position_y + cameraDistance * CAMERA_DISTANCE.HEIGHT_OFFSET,
    planet.position_z + cameraDistance,
  ]
}

/**
 * Calculate camera position focused on a star
 *
 * @param starPosition - Star world position [x, y, z]
 * @param planetPosition - Planet world position [x, y, z]
 * @param distance - Distance from star to camera (default: 6)
 * @returns Camera position as [x, y, z] tuple
 */
export function calculateStarCameraPosition(
  starPosition: [number, number, number],
  planetPosition: [number, number, number],
  distance: number = 6
): [number, number, number] {
  const [starX, starY, starZ] = starPosition
  const [planetX, planetY, planetZ] = planetPosition

  // Direction from planet center to star
  const dirX = starX - planetX
  const dirY = starY - planetY
  const dirZ = starZ - planetZ

  // Normalize direction
  const dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
  if (dist < 0.1) {
    // Star too close to center, return default offset
    return [starX, starY + 1, starZ + distance]
  }

  // Camera positioned further out from star, looking at the star
  const camX = starX + (dirX / dist) * distance
  const camY = starY + (dirY / dist) * distance * 0.3 + 0.5 // Slightly above
  const camZ = starZ + (dirZ / dist) * distance

  return [camX, camY, camZ]
}

/**
 * Easing function: ease in-out cubic
 * Used for smooth camera transitions
 *
 * @param t - Progress value (0 to 1)
 * @returns Eased value (0 to 1)
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Calculate animation duration based on distance
 * Longer distances = longer duration, with min/max bounds
 *
 * @param distance - Distance to travel
 * @param minDuration - Minimum duration (default: 0.6s)
 * @param maxDuration - Maximum duration (default: 1.8s)
 * @param maxDistanceRef - Reference distance for max duration (default: 30)
 * @returns Duration in seconds
 */
export function calculateAnimationDuration(
  distance: number,
  minDuration: number = 0.6,
  maxDuration: number = 1.8,
  maxDistanceRef: number = 30
): number {
  const normalizedDist = Math.min(distance / maxDistanceRef, 1)
  return minDuration + (maxDuration - minDuration) * Math.sqrt(normalizedDist)
}
