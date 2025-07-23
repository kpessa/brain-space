import { create } from 'zustand'
import type { RoutineEntry, RoutineProgress } from '../types/routines'
import { supabaseService } from '../services/supabase'
import { isSupabaseConfigured } from '../lib/supabase'
import { logger } from '../services/logger'

interface RoutineStore {
  // State
  entries: RoutineEntry[]
  progress: RoutineProgress | null
  currentEntry: RoutineEntry | null
  isLoading: boolean
  isSyncing: boolean
  
  // Actions
  initializeProgress: (userId: string) => Promise<void>
  loadEntries: (userId: string) => Promise<void>
  getCurrentDayEntry: () => RoutineEntry | null
  createOrUpdateEntry: (data: Partial<RoutineEntry>) => Promise<void>
  saveDraft: (data: Partial<RoutineEntry>) => Promise<void>
  completeEvening: (data: {
    sleepIntention: string
    wakeIntention: string
    magicalMoment: string
    morningRitualPlan: string[]
  }) => Promise<void>
  completeMorning: (data: {
    actualSleepTime: string
    actualWakeTime: string
    ritualCompleted: boolean[]
    mit: string
    onePercentImprovement: string
    distractionsToMinimize: { distraction: string; limit: string }[]
  }) => Promise<void>
  advanceDay: () => Promise<void>
  pauseJourney: () => Promise<void>
  resumeJourney: () => Promise<void>
  
  // Helpers
  getStreak: () => number
  getMilestoneProgress: () => { current: number; next: number; nextTitle: string } | null
}

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  entries: [],
  progress: null,
  currentEntry: null,
  isLoading: false,
  isSyncing: false,
  
  initializeProgress: async (userId: string) => {
    try {
      set({ isLoading: true })
      
      // Check if user has existing progress
      if (isSupabaseConfigured()) {
        const { data: existingProgress } = await supabaseService.getRoutineProgress(userId)
        
        if (existingProgress) {
          set({ progress: existingProgress })
        } else {
          // Create new progress entry
          const newProgress: RoutineProgress = {
            userId,
            currentDay: 0,
            totalDaysCompleted: 0,
            isActive: true,
            morningRoutinesCompleted: 0,
            eveningRoutinesCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
          }
          
          await supabaseService.createRoutineProgress(newProgress)
          set({ progress: newProgress })
        }
      } else {
        // Offline mode - use localStorage
        const stored = localStorage.getItem(`routine-progress-${userId}`)
        if (stored) {
          set({ progress: JSON.parse(stored) })
        } else {
          const newProgress: RoutineProgress = {
            userId,
            currentDay: 0,
            totalDaysCompleted: 0,
            isActive: true,
            morningRoutinesCompleted: 0,
            eveningRoutinesCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
          }
          localStorage.setItem(`routine-progress-${userId}`, JSON.stringify(newProgress))
          set({ progress: newProgress })
        }
      }
    } catch (error) {
      logger.error('ROUTINES', 'Failed to initialize progress', { error })
    } finally {
      set({ isLoading: false })
    }
  },
  
  loadEntries: async (userId: string) => {
    try {
      set({ isLoading: true })
      
      const { progress } = get()
      if (!progress) {
        logger.warn('ROUTINES', 'No progress loaded, cannot load entries')
        return
      }
      
      if (isSupabaseConfigured()) {
        const { data: entries, error } = await supabaseService.getRoutineEntries(userId)
        
        if (error) {
          logger.error('ROUTINES', 'Failed to load entries from Supabase', { error })
          return
        }
        
        set({ entries: entries || [] })
        
        // Find the current day's entry based on dayNumber
        if (progress.currentDay > 0 && entries) {
          const currentDayEntry = entries.find(e => e.dayNumber === progress.currentDay)
          
          if (currentDayEntry) {
            set({ currentEntry: currentDayEntry })
            logger.info('ROUTINES', 'Found current day entry', { 
              dayNumber: progress.currentDay,
              entryId: currentDayEntry.id,
              date: currentDayEntry.date
            })
          } else {
            // No entry exists for current day yet
            logger.info('ROUTINES', 'No entry found for current day', { 
              dayNumber: progress.currentDay 
            })
          }
        }
      } else {
        // Offline mode
        const stored = localStorage.getItem(`routine-entries-${userId}`)
        const entries = stored ? JSON.parse(stored) : []
        set({ entries })
        
        if (progress.currentDay > 0) {
          const currentDayEntry = entries.find((e: RoutineEntry) => e.dayNumber === progress.currentDay)
          if (currentDayEntry) {
            set({ currentEntry: currentDayEntry })
          }
        }
      }
    } catch (error) {
      logger.error('ROUTINES', 'Failed to load entries', { error })
    } finally {
      set({ isLoading: false })
    }
  },
  
  getCurrentDayEntry: () => {
    const { progress, entries } = get()
    if (!progress || progress.currentDay === 0) return null
    
    return entries.find(e => e.dayNumber === progress.currentDay) || null
  },
  
  createOrUpdateEntry: async (data: Partial<RoutineEntry>) => {
    const { progress, currentEntry } = get()
    if (!progress) {
      logger.error('ROUTINES', 'Cannot save entry without progress')
      return
    }
    
    try {
      set({ isSyncing: true })
      
      const today = new Date().toISOString().split('T')[0]
      const entryId = currentEntry?.id || `routine-${Date.now()}`
      
      const entry: RoutineEntry = {
        id: entryId,
        userId: progress.userId,
        dayNumber: progress.currentDay,
        date: today,
        eveningCompleted: currentEntry?.eveningCompleted || false,
        morningCompleted: currentEntry?.morningCompleted || false,
        createdAt: currentEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...currentEntry,
        ...data,
      }
      
      logger.info('ROUTINES', 'Saving entry', { 
        entryId,
        dayNumber: entry.dayNumber,
        isUpdate: !!currentEntry,
        data
      })
      
      if (isSupabaseConfigured()) {
        let result
        if (currentEntry) {
          result = await supabaseService.updateRoutineEntry(entryId, entry)
        } else {
          result = await supabaseService.createRoutineEntry(entry)
        }
        
        if (result.error) {
          logger.error('ROUTINES', 'Failed to save to Supabase', { error: result.error })
          throw result.error
        }
        
        // Use the returned data which has proper field mapping
        if (result.data) {
          set({ currentEntry: result.data })
          
          // Update entries list
          set(state => ({
            entries: currentEntry 
              ? state.entries.map(e => e.id === entryId ? result.data : e)
              : [...state.entries, result.data]
          }))
        }
      } else {
        // Offline mode
        set({ currentEntry: entry })
        
        const entries = currentEntry
          ? get().entries.map(e => e.id === entryId ? entry : e)
          : [...get().entries, entry]
          
        localStorage.setItem(`routine-entries-${progress.userId}`, JSON.stringify(entries))
        set({ entries })
      }
      
      logger.info('ROUTINES', 'Entry saved successfully', { entryId })
      
    } catch (error) {
      logger.error('ROUTINES', 'Failed to save entry', { error })
      throw error
    } finally {
      set({ isSyncing: false })
    }
  },
  
  saveDraft: async (data: Partial<RoutineEntry>) => {
    const { progress, currentEntry } = get()
    if (!progress || progress.currentDay === 0) {
      logger.warn('ROUTINES', 'Cannot save draft without active progress')
      return
    }
    
    // Don't mark as completed, just save the current state
    try {
      await get().createOrUpdateEntry(data)
      logger.info('ROUTINES', 'Draft saved', { data })
    } catch (error) {
      logger.error('ROUTINES', 'Failed to save draft', { error })
    }
  },
  
  completeEvening: async (data) => {
    const { createOrUpdateEntry, progress } = get()
    
    await createOrUpdateEntry({
      eveningCompleted: true,
      ...data,
    })
    
    // Update progress
    if (progress) {
      const updatedProgress = {
        ...progress,
        eveningRoutinesCompleted: progress.eveningRoutinesCompleted + 1,
        lastCompletedDate: new Date().toISOString().split('T')[0],
      }
      
      if (isSupabaseConfigured()) {
        await supabaseService.updateRoutineProgress(progress.userId, updatedProgress)
      } else {
        localStorage.setItem(`routine-progress-${progress.userId}`, JSON.stringify(updatedProgress))
      }
      
      set({ progress: updatedProgress })
    }
  },
  
  completeMorning: async (data) => {
    const { createOrUpdateEntry, progress, currentEntry } = get()
    
    await createOrUpdateEntry({
      morningCompleted: true,
      ...data,
    })
    
    // Update progress
    if (progress && currentEntry) {
      const bothCompleted = currentEntry.eveningCompleted && true // morning will be true after update
      
      const updatedProgress = {
        ...progress,
        morningRoutinesCompleted: progress.morningRoutinesCompleted + 1,
        totalDaysCompleted: bothCompleted ? progress.totalDaysCompleted + 1 : progress.totalDaysCompleted,
        lastCompletedDate: new Date().toISOString().split('T')[0],
        currentStreak: progress.currentStreak + (bothCompleted ? 1 : 0),
        longestStreak: Math.max(progress.longestStreak, progress.currentStreak + (bothCompleted ? 1 : 0)),
      }
      
      if (isSupabaseConfigured()) {
        await supabaseService.updateRoutineProgress(progress.userId, updatedProgress)
      } else {
        localStorage.setItem(`routine-progress-${progress.userId}`, JSON.stringify(updatedProgress))
      }
      
      set({ progress: updatedProgress })
    }
  },
  
  advanceDay: async () => {
    const { progress } = get()
    if (!progress || progress.currentDay >= 66) return
    
    const updatedProgress = {
      ...progress,
      currentDay: progress.currentDay + 1,
      startedAt: progress.startedAt || new Date().toISOString().split('T')[0],
    }
    
    if (isSupabaseConfigured()) {
      await supabaseService.updateRoutineProgress(progress.userId, updatedProgress)
    } else {
      localStorage.setItem(`routine-progress-${progress.userId}`, JSON.stringify(updatedProgress))
    }
    
    set({ progress: updatedProgress, currentEntry: null })
  },
  
  pauseJourney: async () => {
    const { progress } = get()
    if (!progress) return
    
    const updatedProgress = {
      ...progress,
      isActive: false,
    }
    
    if (isSupabaseConfigured()) {
      await supabaseService.updateRoutineProgress(progress.userId, updatedProgress)
    } else {
      localStorage.setItem(`routine-progress-${progress.userId}`, JSON.stringify(updatedProgress))
    }
    
    set({ progress: updatedProgress })
  },
  
  resumeJourney: async () => {
    const { progress } = get()
    if (!progress) return
    
    const updatedProgress = {
      ...progress,
      isActive: true,
    }
    
    if (isSupabaseConfigured()) {
      await supabaseService.updateRoutineProgress(progress.userId, updatedProgress)
    } else {
      localStorage.setItem(`routine-progress-${progress.userId}`, JSON.stringify(updatedProgress))
    }
    
    set({ progress: updatedProgress })
  },
  
  getStreak: () => {
    const { progress } = get()
    return progress?.currentStreak || 0
  },
  
  getMilestoneProgress: () => {
    const { progress } = get()
    if (!progress) return null
    
    const milestones = [7, 14, 21, 30, 45, 66]
    const nextMilestone = milestones.find(m => m > progress.currentDay)
    
    if (!nextMilestone) return null
    
    const titles: Record<number, string> = {
      7: 'One Week Strong',
      14: 'Two Week Champion',
      21: 'Habit Formation',
      30: 'Monthly Master',
      45: 'Persistence Pays',
      66: 'Journey Complete',
    }
    
    return {
      current: progress.currentDay,
      next: nextMilestone,
      nextTitle: titles[nextMilestone],
    }
  },
}))