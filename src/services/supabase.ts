import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { JournalEntry, UserProgress } from '../types/journal'
import type { BrainDumpEntry } from '../types/braindump'
import type { Database } from '../types/database'
import { toSnakeCase, toCamelCase } from '../lib/supabaseHelpers'

type Tables = Database['public']['Tables']

export class SupabaseService {
  // Auth methods
  async signUp(email: string, password: string) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return { error }

    // Initialize user progress
    if (data.user) {
      await this.initializeUserProgress(data.user.id)
    }

    return { data }
  }

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  }

  async signOut() {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    const { error } = await supabase.auth.signOut()
    return { error }
  }

  async getCurrentUser() {
    if (!isSupabaseConfigured()) return null

    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  // User Progress methods
  async initializeUserProgress(userId: string) {
    if (!isSupabaseConfigured()) return

    const { error } = await supabase.from('user_progress').insert({
      user_id: userId,
      level: 1,
      current_xp: 0,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      total_entries: 0,
      achievements: [],
      last_entry_date: null,
    })

    if (error) console.error('Error initializing user progress:', error)
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    if (!isSupabaseConfigured()) return null

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user progress:', error)
      return null
    }

    // Convert snake_case to camelCase
    return data ? (toCamelCase(data) as UserProgress) : null
  }

  async updateUserProgress(userId: string, updates: Partial<UserProgress>) {
    if (!isSupabaseConfigured()) return

    // Convert camelCase to snake_case for database
    const snakeCaseUpdates = toSnakeCase(updates)

    const { error } = await supabase
      .from('user_progress')
      .update(snakeCaseUpdates)
      .eq('user_id', userId)

    if (error) console.error('Error updating user progress:', error)
  }

  // Journal Entry methods
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching journal entries:', error)
      return []
    }

    // Convert snake_case to camelCase
    return (data || []).map(entry => toCamelCase(entry)) as JournalEntry[]
  }

  async createJournalEntry(entry: JournalEntry) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    // Convert to snake_case and ensure userId is proper UUID format
    const snakeCaseEntry = toSnakeCase(entry)

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(snakeCaseEntry)
      .select()
      .single()

    return { data: data ? toCamelCase(data) : null, error }
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    // Convert to snake_case
    const snakeCaseUpdates = toSnakeCase(updates)

    const { data, error } = await supabase
      .from('journal_entries')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single()

    return { data: data ? toCamelCase(data) : null, error }
  }

  async deleteJournalEntry(id: string) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    const { error } = await supabase.from('journal_entries').delete().eq('id', id)

    return { error }
  }

  // Brain Dump methods
  async getBrainDumps(userId: string): Promise<BrainDumpEntry[]> {
    if (!isSupabaseConfigured()) return []

    const { data, error } = await supabase
      .from('brain_dumps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brain dumps:', error)
      return []
    }

    return data.map(item => ({
      ...item,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) as BrainDumpEntry[]
  }

  async createBrainDump(brainDump: BrainDumpEntry) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    const { data, error } = await supabase
      .from('brain_dumps')
      .insert({
        id: brainDump.id,
        user_id: brainDump.userId,
        title: brainDump.title,
        raw_text: brainDump.rawText,
        nodes: brainDump.nodes,
        edges: brainDump.edges,
        categories: brainDump.categories,
      })
      .select()
      .single()

    return { data, error }
  }

  async updateBrainDump(id: string, updates: Partial<BrainDumpEntry>) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.rawText !== undefined) updateData.raw_text = updates.rawText
    if (updates.nodes !== undefined) updateData.nodes = updates.nodes
    if (updates.edges !== undefined) updateData.edges = updates.edges
    if (updates.categories !== undefined) updateData.categories = updates.categories

    const { data, error } = await supabase
      .from('brain_dumps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  async deleteBrainDump(id: string) {
    if (!isSupabaseConfigured()) return { error: new Error('Supabase not configured') }

    const { error } = await supabase.from('brain_dumps').delete().eq('id', id)

    return { error }
  }

  // Real-time subscriptions
  subscribeToJournalEntries(userId: string, callback: (payload: any) => void) {
    if (!isSupabaseConfigured()) return null

    return supabase
      .channel('journal-entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  }

  subscribeToBrainDumps(userId: string, callback: (payload: any) => void) {
    if (!isSupabaseConfigured()) return null

    return supabase
      .channel('brain-dumps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brain_dumps',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  }

  // Routine methods
  async getRoutineProgress(userId: string) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    
    const result = await supabase
      .from('routine_progress')
      .select('*')
      .eq('user_id', userId)
      .single()
      
    // Transform response to camelCase
    if (result.data) {
      result.data = this.transformRoutineProgressFromDb(result.data)
    }
    
    return result
  }

  async createRoutineProgress(progress: any) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    
    // Convert to snake_case for database
    const dbProgress = {
      user_id: progress.userId,
      current_day: progress.currentDay,
      started_at: progress.startedAt,
      last_completed_date: progress.lastCompletedDate,
      total_days_completed: progress.totalDaysCompleted,
      is_active: progress.isActive,
      morning_routines_completed: progress.morningRoutinesCompleted,
      evening_routines_completed: progress.eveningRoutinesCompleted,
      current_streak: progress.currentStreak,
      longest_streak: progress.longestStreak,
    }
    
    const result = await supabase
      .from('routine_progress')
      .insert(dbProgress)
      .select()
      .single()
      
    // Transform response back to camelCase
    if (result.data) {
      result.data = this.transformRoutineProgressFromDb(result.data)
    }
    
    return result
  }

  async updateRoutineProgress(userId: string, updates: any) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    
    // Convert to snake_case for database
    const dbUpdates: any = {}
    if (updates.currentDay !== undefined) dbUpdates.current_day = updates.currentDay
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt
    if (updates.lastCompletedDate !== undefined) dbUpdates.last_completed_date = updates.lastCompletedDate
    if (updates.totalDaysCompleted !== undefined) dbUpdates.total_days_completed = updates.totalDaysCompleted
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.morningRoutinesCompleted !== undefined) dbUpdates.morning_routines_completed = updates.morningRoutinesCompleted
    if (updates.eveningRoutinesCompleted !== undefined) dbUpdates.evening_routines_completed = updates.eveningRoutinesCompleted
    if (updates.currentStreak !== undefined) dbUpdates.current_streak = updates.currentStreak
    if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak
    
    const result = await supabase
      .from('routine_progress')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select()
      .single()
      
    // Transform response back to camelCase
    if (result.data) {
      result.data = this.transformRoutineProgressFromDb(result.data)
    }
    
    return result
  }

  async getRoutineEntries(userId: string) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    
    const result = await supabase
      .from('routine_entries')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: false })
      
    // Transform response to camelCase
    if (result.data) {
      result.data = result.data.map(entry => this.transformRoutineEntryFromDb(entry))
    }
    
    return result
  }

  async getRoutineEntry(entryId: string) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    
    const result = await supabase
      .from('routine_entries')
      .select('*')
      .eq('id', entryId)
      .single()
      
    // Transform response to camelCase
    if (result.data) {
      result.data = this.transformRoutineEntryFromDb(result.data)
    }
    
    return result
  }

  async createRoutineEntry(entry: any) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    
    // Convert camelCase to snake_case for database
    const dbEntry = {
      id: entry.id,
      user_id: entry.userId,
      day_number: entry.dayNumber,
      date: entry.date,
      evening_completed: entry.eveningCompleted,
      sleep_intention: entry.sleepIntention,
      wake_intention: entry.wakeIntention,
      magical_moment: entry.magicalMoment,
      morning_ritual_plan: entry.morningRitualPlan,
      morning_completed: entry.morningCompleted,
      actual_sleep_time: entry.actualSleepTime,
      actual_wake_time: entry.actualWakeTime,
      ritual_completed: entry.ritualCompleted,
      mit: entry.mit,
      one_percent_improvement: entry.onePercentImprovement,
      distractions_to_minimize: entry.distractionsToMinimize,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    }
    
    const result = await supabase
      .from('routine_entries')
      .insert(dbEntry)
      .select()
      .single()
      
    // Transform response back to camelCase
    if (result.data) {
      result.data = this.transformRoutineEntryFromDb(result.data)
    }
    
    return result
  }

  async updateRoutineEntry(entryId: string, updates: any) {
    if (!isSupabaseConfigured()) return { data: null, error: null }
    
    // Convert camelCase to snake_case for database
    const dbUpdates: any = {}
    
    if (updates.eveningCompleted !== undefined) dbUpdates.evening_completed = updates.eveningCompleted
    if (updates.sleepIntention !== undefined) dbUpdates.sleep_intention = updates.sleepIntention
    if (updates.wakeIntention !== undefined) dbUpdates.wake_intention = updates.wakeIntention
    if (updates.magicalMoment !== undefined) dbUpdates.magical_moment = updates.magicalMoment
    if (updates.morningRitualPlan !== undefined) dbUpdates.morning_ritual_plan = updates.morningRitualPlan
    if (updates.morningCompleted !== undefined) dbUpdates.morning_completed = updates.morningCompleted
    if (updates.actualSleepTime !== undefined) dbUpdates.actual_sleep_time = updates.actualSleepTime
    if (updates.actualWakeTime !== undefined) dbUpdates.actual_wake_time = updates.actualWakeTime
    if (updates.ritualCompleted !== undefined) dbUpdates.ritual_completed = updates.ritualCompleted
    if (updates.mit !== undefined) dbUpdates.mit = updates.mit
    if (updates.onePercentImprovement !== undefined) dbUpdates.one_percent_improvement = updates.onePercentImprovement
    if (updates.distractionsToMinimize !== undefined) dbUpdates.distractions_to_minimize = updates.distractionsToMinimize
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt
    
    const result = await supabase
      .from('routine_entries')
      .update(dbUpdates)
      .eq('id', entryId)
      .select()
      .single()
      
    // Transform response back to camelCase
    if (result.data) {
      result.data = this.transformRoutineEntryFromDb(result.data)
    }
    
    return result
  }

  // Transform snake_case database fields to camelCase for app
  private transformRoutineEntryFromDb(dbEntry: any) {
    return {
      id: dbEntry.id,
      userId: dbEntry.user_id,
      dayNumber: dbEntry.day_number,
      date: dbEntry.date,
      eveningCompleted: dbEntry.evening_completed,
      sleepIntention: dbEntry.sleep_intention,
      wakeIntention: dbEntry.wake_intention,
      magicalMoment: dbEntry.magical_moment,
      morningRitualPlan: dbEntry.morning_ritual_plan,
      morningCompleted: dbEntry.morning_completed,
      actualSleepTime: dbEntry.actual_sleep_time,
      actualWakeTime: dbEntry.actual_wake_time,
      ritualCompleted: dbEntry.ritual_completed,
      mit: dbEntry.mit,
      onePercentImprovement: dbEntry.one_percent_improvement,
      distractionsToMinimize: dbEntry.distractions_to_minimize,
      createdAt: dbEntry.created_at,
      updatedAt: dbEntry.updated_at,
    }
  }

  // Transform snake_case database progress to camelCase
  private transformRoutineProgressFromDb(dbProgress: any) {
    return {
      userId: dbProgress.user_id,
      currentDay: dbProgress.current_day,
      startedAt: dbProgress.started_at,
      lastCompletedDate: dbProgress.last_completed_date,
      totalDaysCompleted: dbProgress.total_days_completed,
      isActive: dbProgress.is_active,
      morningRoutinesCompleted: dbProgress.morning_routines_completed,
      eveningRoutinesCompleted: dbProgress.evening_routines_completed,
      currentStreak: dbProgress.current_streak,
      longestStreak: dbProgress.longest_streak,
    }
  }
}

export const supabaseService = new SupabaseService()
