export interface Planet {
  id: string
  name: string
  name_tr: string
  color: string
  description_tr: string
  position_x: number
  position_y: number
  position_z: number
  scale: number
  created_at: string
}

export interface Star {
  id: string
  user_id: string
  planet_id: string
  content: string
  position_x: number
  position_y: number
  position_z: number
  created_at: string
}

export interface Profile {
  id: string
  username: string | null
  email: string | null
  daily_stars_added: number
  daily_views_used: number
  last_reset_date: string
  created_at: string
}

export interface StarCreateInput {
  planet_id: string
  content: string
  position_x: number
  position_y: number
  position_z: number
}

// 3D position tuple type
export type Position3D = [number, number, number]

// Planet with calculated 3D position
export interface PlanetWithPosition extends Planet {
  position: Position3D
}

// Star with planet info for display
export interface StarWithPlanet extends Star {
  planet?: Planet
}
