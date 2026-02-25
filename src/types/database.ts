/**
 * Represents the Supabase Leaderboard schema.
 * Matching the definition in supabase/schema.sql.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leaderboard: {
        Row: {
          id: string
          name: string
          score: number
          game_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          score: number
          game_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          score?: number
          game_id?: string
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          email: string
          status: string
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          email: string
          status?: string
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          email?: string
          status?: string
          created_at?: string
          metadata?: Json
        }
      }
      views: {
        Row: {
          slug: string
          count: number
          updated_at: string
        }
        Insert: {
          slug: string
          count?: number
          updated_at?: string
        }
        Update: {
          slug?: string
          count?: number
          updated_at?: string
        }
      }
      status: {
        Row: {
          id: number
          text: string
          emoji: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          text: string
          emoji?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          text?: string
          emoji?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
