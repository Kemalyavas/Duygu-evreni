export interface Planet {
  id: string
  name: string
  name_tr: string
  name_en?: string
  color: string
  description_tr: string
  description_en?: string
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
  // Public, anonymous "resonance" counter (heart taps). Optional so older
  // fetches / pre-migration rows are safe. See migration 005_star_resonance.sql.
  resonance_count?: number
}

export interface Profile {
  id: string
  username: string | null
  email: string | null
  daily_stars_added: number
  daily_views_used: number
  last_reset_date: string
  show_username_in_chats: boolean
  is_admin?: boolean
  is_banned?: boolean
  banned_reason?: string | null
  banned_at?: string | null
  created_at: string
}

// Columns the browser/SSR client is allowed to read from `profiles`.
// Deliberately EXCLUDES PII the app never reads (email, last_ip,
// last_ip_updated_at). Those columns are REVOKEd from the `authenticated`
// role at the DB level so a logged-in user cannot dump other users' email/IP
// via PostgREST. A bare `select=*` would 403 once revoked, so every own-profile
// read must use this list. Keep in sync with
// supabase/migrations/004_profiles_pii_column_revoke.sql.
export const PROFILE_SELECT_COLUMNS =
  'id,username,show_username_in_chats,is_admin,is_banned,banned_reason,banned_at,daily_stars_added,daily_views_used,daily_message_requests_sent,last_reset_date,created_at'

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

// ==========================================
// Mesajlaşma Sistemi Types
// ==========================================

export type ConversationStatus = 'pending' | 'accepted' | 'rejected'

export interface Conversation {
  id: string
  star_id: string
  initiator_id: string
  star_owner_id: string
  status: ConversationStatus
  first_message: string
  created_at: string
  accepted_at: string | null
  updated_at: string
}

export interface ConversationWithDetails extends Conversation {
  star?: Star
  initiator?: Profile
  star_owner?: Profile
  last_message?: Message
  unread_count?: number
  partner_nickname?: string // Karşı tarafa verdiğim takma ad
  is_partner_blocked?: boolean // Karşı tarafı engelledim mi
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface MessageWithSender extends Message {
  sender?: Profile
}

export interface BlockedUser {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface ConversationNickname {
  id: string
  conversation_id: string
  user_id: string
  nickname: string
  created_at: string
  updated_at: string
}

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  conversation_id: string | null
  reason: ReportReason
  description: string | null
  status: ReportStatus
  created_at: string
  reviewed_at: string | null
}

// ==========================================
// Bildirim Sistemi Types
// ==========================================

export type NotificationType = 'message_request' | 'request_accepted' | 'new_message' | 'new_conversation'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  conversation_id: string | null
  sender_id: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationWithSender extends Notification {
  sender?: {
    id: string
    username: string
    show_username_in_chats: boolean
  }
}
