/**
 * Animation timing constants for the Duygu Evreni application
 * Centralized animation values for consistency across components
 */

// Camera Animation
export const CAMERA = {
  /** Minimum camera animation duration in seconds */
  MIN_DURATION: 0.6,
  /** Maximum camera animation duration in seconds */
  MAX_DURATION: 1.8,
  /** Reference distance for duration calculation (units) */
  MAX_DISTANCE_REFERENCE: 30,
  /** Star focus camera distance from star */
  STAR_FOCUS_DISTANCE: 6,
  /** Delay after star focus animation before re-enabling controls (ms) */
  STAR_FOCUS_DELAY: 150,
  /** Delay after planet focus animation before re-enabling controls (ms) */
  PLANET_FOCUS_DELAY: 50,
} as const

// Star Appearance Animation (Big Bang Effect)
export const STAR_APPEAR = {
  /** Total duration of Big Bang explosion effect (ms) */
  DURATION: 1200,
  /** Stagger spread - stars start appearing over this fraction of duration */
  STAGGER_SPREAD: 0.3,
  /** Fraction of animation dedicated to explosion settling */
  EXPLOSION_SETTLE_TIME: 0.7,
} as const

// Vortex Loading Animation
export const VORTEX = {
  /** Minimum time to show the gathering effect (ms) */
  MIN_GATHERING_TIME: 3000,
  /** Number of particles in vortex */
  PARTICLE_COUNT: 50,
  /** Duration of explosion phase (ms) */
  EXPLOSION_DURATION: 800,
  /** Duration to hide vortex after explosion (ms) */
  HIDE_DELAY: 1000,
  /** Starting scale multiplier for glow compression */
  GLOW_START_SCALE: 3.5,
  /** End scale multiplier for glow compression (close to planet) */
  GLOW_END_SCALE: 1.2,
} as const

// Star Click/Selection
export const STAR_INTERACTION = {
  /** Delay before auto-selecting star from URL (ms) */
  URL_STAR_SELECT_DELAY: 800,
  /** Hit detection radius for star raycasting */
  HIT_RADIUS: 0.08,
} as const

// Orbit Animation
export const ORBIT = {
  /** Planet rotation speed (radians per delta) */
  PLANET_ROTATION_SPEED: 0.08,
  /** Planet floating amplitude */
  PLANET_FLOAT_AMPLITUDE: 0.15,
  /** Planet floating frequency */
  PLANET_FLOAT_FREQUENCY: 0.5,
  /** Star orbit speed range min */
  STAR_SPEED_MIN: 0.015,
  /** Star orbit speed range max offset */
  STAR_SPEED_RANGE: 0.025,
  /** Star float speed min */
  STAR_FLOAT_SPEED_MIN: 0.15,
  /** Star float amplitude range */
  STAR_FLOAT_AMPLITUDE_RANGE: 0.05,
} as const

// Fresnel Glow Shader
export const FRESNEL = {
  /** Power value for fresnel effect */
  POWER: 2.5,
  /** Default intensity for fresnel glow */
  DEFAULT_INTENSITY: 0.6,
  /** Scale multiplier for glow sphere */
  SCALE_MULTIPLIER: 1.08,
} as const

// UI Animation (Framer Motion / React Spring)
export const UI_ANIMATION = {
  /** Default spring mass */
  SPRING_MASS: 1,
  /** Default spring tension */
  SPRING_TENSION: 200,
  /** Default spring friction */
  SPRING_FRICTION: 20,
  /** Fade duration (ms) */
  FADE_DURATION: 400,
} as const

// OrbitControls
export const ORBIT_CONTROLS = {
  /** Auto rotate speed in universe view */
  UNIVERSE_AUTO_ROTATE: 0.1,
  /** Auto rotate speed in planet view */
  PLANET_AUTO_ROTATE: 0.15,
  /** Damping factor */
  DAMPING_FACTOR: 0.05,
  /** Rotate speed */
  ROTATE_SPEED: 0.5,
} as const
