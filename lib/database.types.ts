// Generated from the live Supabase schema (project zfrhpasivazpknvwjnwl) on 2026-06-02.
// Regenerate with: supabase gen types typescript --project-id zfrhpasivazpknvwjnwl
// This is the authoritative DB schema reference (the schema is not otherwise in-repo).
// To get fully-typed queries, instantiate the clients with createBrowserClient<Database>(...).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banned_ips: {
        Row: {
          banned_by: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          reason: string | null
        }
        Insert: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          ip_address: unknown
          reason?: string | null
        }
        Update: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banned_ips_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_nicknames: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          nickname: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          nickname: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          nickname?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_nicknames_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_nicknames_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          first_message: string
          hidden_by_initiator: boolean | null
          hidden_by_owner: boolean | null
          id: string
          initiator_id: string
          star_id: string
          star_owner_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          first_message: string
          hidden_by_initiator?: boolean | null
          hidden_by_owner?: boolean | null
          id?: string
          initiator_id: string
          star_id: string
          star_owner_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          first_message?: string
          hidden_by_initiator?: boolean | null
          hidden_by_owner?: boolean | null
          id?: string
          initiator_id?: string
          star_id?: string
          star_owner_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_star_id_fkey"
            columns: ["star_id"]
            isOneToOne: false
            referencedRelation: "stars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_star_owner_id_fkey"
            columns: ["star_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      planets: {
        Row: {
          color: string
          created_at: string | null
          description_en: string | null
          description_tr: string
          id: string
          name: string
          name_en: string | null
          name_tr: string
          position_x: number
          position_y: number
          position_z: number
          scale: number | null
        }
        Insert: {
          color: string
          created_at?: string | null
          description_en?: string | null
          description_tr: string
          id?: string
          name: string
          name_en?: string | null
          name_tr: string
          position_x: number
          position_y: number
          position_z: number
          scale?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description_en?: string | null
          description_tr?: string
          id?: string
          name?: string
          name_en?: string | null
          name_tr?: string
          position_x?: number
          position_y?: number
          position_z?: number
          scale?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banned_at: string | null
          banned_reason: string | null
          created_at: string | null
          daily_message_requests_sent: number | null
          daily_stars_added: number | null
          daily_views_used: number | null
          email: string | null
          id: string
          is_admin: boolean | null
          is_banned: boolean
          last_ip: unknown
          last_ip_updated_at: string | null
          last_reset_date: string | null
          show_username_in_chats: boolean | null
          username: string | null
        }
        Insert: {
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string | null
          daily_message_requests_sent?: number | null
          daily_stars_added?: number | null
          daily_views_used?: number | null
          email?: string | null
          id: string
          is_admin?: boolean | null
          is_banned?: boolean
          last_ip?: unknown
          last_ip_updated_at?: string | null
          last_reset_date?: string | null
          show_username_in_chats?: boolean | null
          username?: string | null
        }
        Update: {
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string | null
          daily_message_requests_sent?: number | null
          daily_stars_added?: number | null
          daily_views_used?: number | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          is_banned?: boolean
          last_ip?: unknown
          last_ip_updated_at?: string | null
          last_reset_date?: string | null
          show_username_in_chats?: boolean | null
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          status: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          status?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stars: {
        Row: {
          content: string
          created_at: string | null
          id: string
          planet_id: string | null
          position_x: number
          position_y: number
          position_z: number
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          planet_id?: string | null
          position_x: number
          position_y: number
          position_z: number
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          planet_id?: string | null
          position_x?: number
          position_y?: number
          position_z?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stars_planet_id_fkey"
            columns: ["planet_id"]
            isOneToOne: false
            referencedRelation: "planets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ip_history: {
        Row: {
          first_seen_at: string | null
          id: string
          ip_address: unknown
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          first_seen_at?: string | null
          id?: string
          ip_address: unknown
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          first_seen_at?: string | null
          id?: string
          ip_address?: unknown
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ip_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_planet_star_counts: {
        Args: Record<PropertyKey, never>
        Returns: { planet_id: string; count: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
