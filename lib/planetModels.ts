// Central configuration for planet 3D models
// Add planet models here as you create them

export const PLANET_MODELS: Record<string, string> = {
  'Joy': '/models/planets/joy.glb',
  'Love': '/models/planets/love.glb',
  'Anger': '/models/planets/anger.glb',
  'Sadness': '/models/planets/sadness.glb',
  'Fear': '/models/planets/fear.glb',
  'Longing': '/models/planets/longing.glb',
  'Regret': '/models/planets/regret.glb',
  'Hope': '/models/planets/hope.glb',
  'Peace': '/models/planets/peace.glb',
  'Depression': '/models/planets/depression.glb',
}

// Check if a planet has a custom model
export function hasCustomModel(planetName: string): boolean {
  return !!PLANET_MODELS[planetName]
}

// Get model path for a planet
export function getModelPath(planetName: string): string | null {
  return PLANET_MODELS[planetName] || null
}
