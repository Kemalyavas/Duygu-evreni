/**
 * UI constants for the Duygu Evreni application
 * Centralized UI values for consistency across components
 */

// Star Content
export const STAR_CONTENT = {
  /** Maximum characters allowed in star content */
  MAX_LENGTH: 280,
  /** Warning threshold for character count */
  WARNING_THRESHOLD: 30,
} as const

// Daily Limits
// NOTE: The enforced limit lives in lib/hooks/useDailyLimit.ts (MAX_DAILY_STARS) and the
// `check_daily_star_limit` DB trigger (Europe/Istanbul). Keep this value in sync — it is 3/day.
export const DAILY_LIMITS = {
  /** Maximum stars a user can create per day */
  MAX_STARS_PER_DAY: 3,
} as const

// Star Visual
export const STAR_VISUAL = {
  /** Base scale for normal stars */
  BASE_SCALE: 0.07,
  /** Scale for selected star */
  SELECTED_SCALE: 0.14,
  /** Highlight glow scale */
  HIGHLIGHT_SCALE: 0.3,
  /** Pulse amplitude */
  PULSE_AMPLITUDE: 0.15,
  /** Pulse frequency */
  PULSE_FREQUENCY: 1.5,
  /** Highlight pulse amplitude */
  HIGHLIGHT_PULSE_AMPLITUDE: 0.2,
  /** Highlight pulse frequency */
  HIGHLIGHT_PULSE_FREQUENCY: 3,
  /** Geometry outer radius */
  GEOMETRY_OUTER_RADIUS: 1,
  /** Geometry inner radius */
  GEOMETRY_INNER_RADIUS: 0.35,
  /** Geometry points (4-pointed star) */
  GEOMETRY_POINTS: 4,
} as const

// Star Layers (distribution percentages)
export const STAR_LAYERS = {
  /** Inner layer percentage (0-30%) */
  INNER_THRESHOLD: 30,
  /** Middle layer percentage (30-65%) */
  MIDDLE_THRESHOLD: 65,
  /** Inner layer multiplier */
  INNER_MULTIPLIER: 1.0,
  /** Middle layer multiplier */
  MIDDLE_MULTIPLIER: 1.6,
  /** Outer layer multiplier */
  OUTER_MULTIPLIER: 2.3,
} as const

// Orbit Radius Thresholds
export const ORBIT_RADIUS = {
  /** Base radius for orbit calculations */
  BASE: 3,
  /** Minimum orbit radius (keep stars outside planet) */
  MIN_ORBIT: 2.5,
  /** Star count thresholds and their multipliers */
  THRESHOLDS: [
    { count: 10, multiplier: 1.2 },
    { count: 30, multiplier: 1.5 },
    { count: 100, multiplier: 2.0 },
    { count: 300, multiplier: 2.5 },
    { count: 500, multiplier: 3.0 },
    { count: 1000, multiplier: 3.8 },
    { count: 2000, multiplier: 4.5 },
    { count: 5000, multiplier: 5.5 },
    { count: 10000, multiplier: 6.5 },
  ],
  /** Multiplier for counts above max threshold */
  MAX_MULTIPLIER: 6.5,
  /** Logarithmic scale factor for very large counts */
  LOG_SCALE_FACTOR: 2,
} as const

// Camera Distance
export const CAMERA_DISTANCE = {
  /** Multiplier for orbit radius to camera distance */
  ORBIT_MULTIPLIER: 2.5 * 1.6,
  /** Base offset added to camera distance */
  BASE_OFFSET: 5,
  /** Height offset multiplier for camera position */
  HEIGHT_OFFSET: 0.25,
  /** Max distance multiplier in planet view */
  MAX_DISTANCE_MULTIPLIER: 1.6,
} as const

// OrbitControls Limits
export const CONTROLS_LIMITS = {
  /** Universe view min distance */
  UNIVERSE_MIN: 10,
  /** Universe view max distance */
  UNIVERSE_MAX: 80,
  /** Planet view min distance */
  PLANET_MIN: 4,
  /** Planet view default max (scaled by star count) */
  PLANET_MAX_DEFAULT: 25,
  /** Transition min distance (permissive) */
  TRANSITION_MIN: 2,
  /** Transition max distance (permissive) */
  TRANSITION_MAX: 150,
} as const

// Default Camera Position
export const DEFAULT_CAMERA = {
  /** Default position in universe view */
  POSITION: [0, 8, 35] as [number, number, number],
  /** Default look-at target */
  LOOK_AT: [0, 0, 0] as [number, number, number],
  /** Field of view */
  FOV: 60,
  /** Near clipping plane */
  NEAR: 0.1,
  /** Far clipping plane */
  FAR: 500,
} as const

// Star Field (background stars)
export const STAR_FIELD = {
  /** Number of background stars */
  COUNT: 2500,
} as const

// Large Star Count Threshold
export const LARGE_STAR_COUNT = {
  /** Threshold for enabling vortex animation */
  VORTEX_THRESHOLD: 100,
} as const

// Material Properties
export const MATERIALS = {
  /** Normal star opacity */
  NORMAL_OPACITY: 0.95,
  /** Read star opacity */
  READ_OPACITY: 0.5,
  /** Normal star emissive intensity */
  NORMAL_EMISSIVE: 3,
  /** Read star emissive intensity */
  READ_EMISSIVE: 1.5,
  /** Read star dim blend factor (toward gray) */
  READ_DIM_FACTOR: 0.7,
  /** Bright color blend factor (toward white) */
  BRIGHT_BLEND_FACTOR: 0.3,
  /** Highlight opacity */
  HIGHLIGHT_OPACITY: 0.35,
} as const

// Bloom Effect
export const BLOOM = {
  /** Bloom intensity */
  INTENSITY: 1.2,
  /** Luminance threshold */
  LUMINANCE_THRESHOLD: 0.1,
  /** Luminance smoothing */
  LUMINANCE_SMOOTHING: 0.4,
  /** Bloom radius */
  RADIUS: 0.4,
} as const

// Lighting
export const LIGHTING = {
  /** Ambient light intensity */
  AMBIENT_INTENSITY: 0.45,
  /** Hemisphere light intensity */
  HEMISPHERE_INTENSITY: 0.4,
  /** Hope (sun) light intensity */
  HOPE_INTENSITY: 200,
  /** Hope light distance */
  HOPE_DISTANCE: 200,
  /** Hope light decay */
  HOPE_DECAY: 1.8,
  /** Fill light intensity */
  FILL_INTENSITY: 0.3,
  /** Rim light intensity */
  RIM_INTENSITY: 0.2,
} as const
