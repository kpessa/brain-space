export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          user_id: string
          level: number
          current_xp: number
          total_xp: number
          current_streak: number
          longest_streak: number
          total_entries: number
          achievements: Json
          last_entry_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          level?: number
          current_xp?: number
          total_xp?: number
          current_streak?: number
          longest_streak?: number
          total_entries?: number
          achievements?: Json
          last_entry_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          level?: number
          current_xp?: number
          total_xp?: number
          current_streak?: number
          longest_streak?: number
          total_entries?: number
          achievements?: Json
          last_entry_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          gratitude: string[]
          daily_quest: string | null
          threats: string | null
          allies: string | null
          notes: string | null
          xp_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          date: string
          gratitude?: string[]
          daily_quest?: string | null
          threats?: string | null
          allies?: string | null
          notes?: string | null
          xp_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          gratitude?: string[]
          daily_quest?: string | null
          threats?: string | null
          allies?: string | null
          notes?: string | null
          xp_earned?: number
          created_at?: string
          updated_at?: string
        }
      }
      brain_dumps: {
        Row: {
          id: string
          user_id: string
          title: string
          raw_text: string
          nodes: Json
          edges: Json
          categories: Json
          parent_brain_dump_id: string | null
          origin_node_id: string | null
          topic_focus: string | null
          type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          raw_text: string
          nodes?: Json
          edges?: Json
          categories?: Json
          parent_brain_dump_id?: string | null
          origin_node_id?: string | null
          topic_focus?: string | null
          type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          raw_text?: string
          nodes?: Json
          edges?: Json
          categories?: Json
          parent_brain_dump_id?: string | null
          origin_node_id?: string | null
          topic_focus?: string | null
          type?: string | null
          created_at?: string
          updated_at?: string
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

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
export type BrainDump = Database['public']['Tables']['brain_dumps']['Row']

// Achievement type
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
}

// Node and Edge types for brain dumps
export interface BrainNode {
  id: string
  label: string
  x: number
  y: number
  category?: string
}

export interface BrainEdge {
  id: string
  source: string
  target: string
  label?: string
}
