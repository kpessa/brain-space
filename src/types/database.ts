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
      routine_progress: {
        Row: {
          user_id: string
          current_day: number
          started_at: string | null
          last_completed_date: string | null
          total_days_completed: number
          is_active: boolean
          morning_routines_completed: number
          evening_routines_completed: number
          current_streak: number
          longest_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          current_day?: number
          started_at?: string | null
          last_completed_date?: string | null
          total_days_completed?: number
          is_active?: boolean
          morning_routines_completed?: number
          evening_routines_completed?: number
          current_streak?: number
          longest_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          current_day?: number
          started_at?: string | null
          last_completed_date?: string | null
          total_days_completed?: number
          is_active?: boolean
          morning_routines_completed?: number
          evening_routines_completed?: number
          current_streak?: number
          longest_streak?: number
          created_at?: string
          updated_at?: string
        }
      }
      routine_entries: {
        Row: {
          id: string
          user_id: string
          day_number: number
          date: string
          evening_completed: boolean
          sleep_intention: string | null
          wake_intention: string | null
          magical_moment: string | null
          morning_ritual_plan: Json | null
          morning_completed: boolean
          actual_sleep_time: string | null
          actual_wake_time: string | null
          ritual_completed: Json | null
          mit: string | null
          one_percent_improvement: string | null
          distractions_to_minimize: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_number: number
          date: string
          evening_completed?: boolean
          sleep_intention?: string | null
          wake_intention?: string | null
          magical_moment?: string | null
          morning_ritual_plan?: Json | null
          morning_completed?: boolean
          actual_sleep_time?: string | null
          actual_wake_time?: string | null
          ritual_completed?: Json | null
          mit?: string | null
          one_percent_improvement?: string | null
          distractions_to_minimize?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_number?: number
          date?: string
          evening_completed?: boolean
          sleep_intention?: string | null
          wake_intention?: string | null
          magical_moment?: string | null
          morning_ritual_plan?: Json | null
          morning_completed?: boolean
          actual_sleep_time?: string | null
          actual_wake_time?: string | null
          ritual_completed?: Json | null
          mit?: string | null
          one_percent_improvement?: string | null
          distractions_to_minimize?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: string
          status: string
          priority_importance: number | null
          priority_urgency: number | null
          due_date: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          scheduled_duration: number | null
          parent_id: string | null
          position: number
          source_type: string
          source_id: string | null
          source_metadata: Json | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          updated_at: string
          eisenhower_quadrant: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type?: string
          status?: string
          priority_importance?: number | null
          priority_urgency?: number | null
          due_date?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          scheduled_duration?: number | null
          parent_id?: string | null
          position?: number
          source_type?: string
          source_id?: string | null
          source_metadata?: Json | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: string
          status?: string
          priority_importance?: number | null
          priority_urgency?: number | null
          due_date?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          scheduled_duration?: number | null
          parent_id?: string | null
          position?: number
          source_type?: string
          source_id?: string | null
          source_metadata?: Json | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      todo_recurrence: {
        Row: {
          id: string
          todo_id: string
          pattern_type: string
          pattern_config: Json
          start_date: string
          end_date: string | null
          next_occurrence_date: string | null
          last_generated_date: string | null
          is_habit: boolean
          current_streak: number
          longest_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          pattern_type: string
          pattern_config: Json
          start_date: string
          end_date?: string | null
          next_occurrence_date?: string | null
          last_generated_date?: string | null
          is_habit?: boolean
          current_streak?: number
          longest_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          pattern_type?: string
          pattern_config?: Json
          start_date?: string
          end_date?: string | null
          next_occurrence_date?: string | null
          last_generated_date?: string | null
          is_habit?: boolean
          current_streak?: number
          longest_streak?: number
          created_at?: string
          updated_at?: string
        }
      }
      todo_completions: {
        Row: {
          id: string
          todo_id: string
          completion_date: string
          completed_at: string
          quality: string | null
          duration_minutes: number | null
          notes: string | null
          streak_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          completion_date: string
          completed_at?: string
          quality?: string | null
          duration_minutes?: number | null
          notes?: string | null
          streak_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          completion_date?: string
          completed_at?: string
          quality?: string | null
          duration_minutes?: number | null
          notes?: string | null
          streak_count?: number | null
          created_at?: string
        }
      }
      todo_attempts: {
        Row: {
          id: string
          todo_id: string
          attempt_date: string
          started_at: string
          outcome: string
          duration_minutes: number | null
          notes: string | null
          next_action: string | null
          created_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          attempt_date?: string
          started_at?: string
          outcome: string
          duration_minutes?: number | null
          notes?: string | null
          next_action?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          attempt_date?: string
          started_at?: string
          outcome?: string
          duration_minutes?: number | null
          notes?: string | null
          next_action?: string | null
          created_at?: string
        }
      }
      todo_relationships: {
        Row: {
          id: string
          parent_todo_id: string
          child_todo_id: string
          relationship_type: string
          logic_type: string | null
          is_optional: boolean
          created_at: string
        }
        Insert: {
          id?: string
          parent_todo_id: string
          child_todo_id: string
          relationship_type?: string
          logic_type?: string | null
          is_optional?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          parent_todo_id?: string
          child_todo_id?: string
          relationship_type?: string
          logic_type?: string | null
          is_optional?: boolean
          created_at?: string
        }
      }
      todo_tags: {
        Row: {
          id: string
          todo_id: string
          tag_name: string
          tag_category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          todo_id: string
          tag_name: string
          tag_category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          todo_id?: string
          tag_name?: string
          tag_category?: string | null
          created_at?: string
        }
      }
      braindump_todos: {
        Row: {
          braindump_id: string
          node_id: string
          todo_id: string
          created_at: string
        }
        Insert: {
          braindump_id: string
          node_id: string
          todo_id: string
          created_at?: string
        }
        Update: {
          braindump_id?: string
          node_id?: string
          todo_id?: string
          created_at?: string
        }
      }
      journal_todos: {
        Row: {
          journal_entry_id: string
          todo_id: string
          todo_type: string
          created_at: string
        }
        Insert: {
          journal_entry_id: string
          todo_id: string
          todo_type: string
          created_at?: string
        }
        Update: {
          journal_entry_id?: string
          todo_id?: string
          todo_type?: string
          created_at?: string
        }
      }
      routine_todos: {
        Row: {
          routine_entry_id: string
          todo_id: string
          todo_type: string
          created_at: string
        }
        Insert: {
          routine_entry_id: string
          todo_id: string
          todo_type: string
          created_at?: string
        }
        Update: {
          routine_entry_id?: string
          todo_id?: string
          todo_type?: string
          created_at?: string
        }
      }
    }
    Views: {
      todo_instances: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: string
          status: string
          priority_importance: number | null
          priority_urgency: number | null
          due_date: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          scheduled_duration: number | null
          parent_id: string | null
          position: number
          source_type: string
          source_id: string | null
          source_metadata: Json | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          updated_at: string
          eisenhower_quadrant: string | null
          pattern_type: string | null
          pattern_config: Json | null
          is_habit: boolean | null
          current_streak: number | null
          longest_streak: number | null
          is_due_today: boolean | null
        }
      }
    }
    Functions: {
      migrate_braindump_nodes_to_todos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_journal_quests_to_todos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_routine_items_to_todos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      establish_todo_relationships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrate_all_to_todos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_recurring_todo_instances: {
        Args: {
          start_date?: string
          end_date?: string
        }
        Returns: {
          todo_id: string
          instance_date: string
          is_completed: boolean
        }[]
      }
    }
    Enums: {
      todo_type: 'task' | 'quest' | 'ritual' | 'habit' | 'routine_item' | 'gratitude_action'
      todo_status: 'pending' | 'in_progress' | 'completed' | 'deferred' | 'cancelled'
      todo_source_type: 'braindump' | 'journal' | 'routine' | 'manual' | 'recurring'
      recurrence_pattern_type: 'daily' | 'weekly' | 'monthly' | 'custom'
      attempt_outcome: 'success' | 'partial' | 'failed' | 'blocked'
      completion_quality: 'great' | 'good' | 'okay' | 'poor'
      relationship_type: 'subtask' | 'blocks' | 'related' | 'depends_on'
      logic_type: 'AND' | 'OR' | 'NONE'
      tag_category: 'context' | 'project' | 'area' | 'energy' | 'time'
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
