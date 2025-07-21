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
}

export const supabaseService = new SupabaseService()
