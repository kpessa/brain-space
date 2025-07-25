import { create } from 'zustand'
import type { RoutineEntry, RoutineProgress } from '@/types/routines'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { format, isToday, differenceInDays } from 'date-fns'

interface RoutineStore {
  // State
  entries: RoutineEntry[]
  progress: RoutineProgress | null
  currentEntry: RoutineEntry | null
  isLoading: boolean
  error: string | null

  // Actions
  initializeProgress: (userId: string) => Promise<void>
  loadEntries: (userId: string) => Promise<void>
  getCurrentDayEntry: () => RoutineEntry | null
  createOrUpdateEntry: (data: Partial<RoutineEntry>) => Promise<void>
  completeEvening: (userId: string, data: {
    sleepIntention: string
    wakeIntention: string
    magicalMoment: string
    morningRitualPlan: string[]
  }) => Promise<void>
  completeMorning: (userId: string, data: {
    actualSleepTime: string
    actualWakeTime: string
    ritualCompleted: boolean[]
    mit: string
    onePercentImprovement: string
    distractionsToMinimize: { distraction: string; limit: string }[]
  }) => Promise<void>
  advanceDay: (userId: string) => Promise<void>
  pauseJourney: (userId: string) => Promise<void>
  resumeJourney: (userId: string) => Promise<void>

  // Helpers
  getStreak: () => number
  getMilestoneProgress: () => { current: number; next: number; nextTitle: string } | null
  updateStreak: (userId: string) => Promise<void>
}

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  entries: [],
  progress: null,
  currentEntry: null,
  isLoading: false,
  error: null,

  initializeProgress: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const progressDoc = await getDoc(doc(db, 'users', userId, 'routineProgress', 'current'))
      
      if (progressDoc.exists()) {
        const data = progressDoc.data() as RoutineProgress
        set({ progress: data })
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

        await setDoc(doc(db, 'users', userId, 'routineProgress', 'current'), newProgress)
        set({ progress: newProgress })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  loadEntries: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const entriesQuery = query(
        collection(db, 'users', userId, 'routineEntries'),
        orderBy('dayNumber', 'desc')
      )
      const snapshot = await getDocs(entriesQuery)
      
      const entries: RoutineEntry[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        entries.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as RoutineEntry)
      })

      set({ entries })

      // Find today's entry
      const todayEntry = entries.find(entry => isToday(new Date(entry.date)))
      set({ currentEntry: todayEntry || null })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  getCurrentDayEntry: () => {
    return get().currentEntry
  },

  createOrUpdateEntry: async (data: Partial<RoutineEntry>) => {
    const { entries } = get()
    const existingEntry = entries.find(e => e.id === data.id)
    
    try {
      if (existingEntry) {
        // Update existing entry
        await updateDoc(doc(db, 'users', data.userId!, 'routineEntries', data.id!), {
          ...data,
          updatedAt: serverTimestamp(),
        })
        
        const updatedEntries = entries.map(e => 
          e.id === data.id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
        )
        set({ entries: updatedEntries })
      } else {
        // Create new entry
        const id = `routine-${Date.now()}`
        const newEntry: RoutineEntry = {
          id,
          userId: data.userId!,
          dayNumber: data.dayNumber!,
          date: data.date || format(new Date(), 'yyyy-MM-dd'),
          eveningCompleted: false,
          morningCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        }
        
        await setDoc(doc(db, 'users', data.userId!, 'routineEntries', id), {
          ...newEntry,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        
        set({ 
          entries: [...entries, newEntry],
          currentEntry: newEntry,
        })
      }
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  completeEvening: async (userId: string, data) => {
    const { progress, currentEntry } = get()
    if (!progress) return

    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      let entry = currentEntry

      if (!entry || entry.date !== today) {
        // Create new entry for today
        const dayNumber = progress.currentDay + 1
        await get().createOrUpdateEntry({
          userId,
          dayNumber,
          date: today,
          eveningCompleted: true,
          ...data,
        })
      } else {
        // Update existing entry
        await get().createOrUpdateEntry({
          ...entry,
          eveningCompleted: true,
          ...data,
        })
      }

      // Update progress
      const newProgress = {
        ...progress,
        eveningRoutinesCompleted: progress.eveningRoutinesCompleted + 1,
        lastCompletedDate: today,
      }
      
      await updateDoc(doc(db, 'users', userId, 'routineProgress', 'current'), newProgress)
      set({ progress: newProgress })
      
      // Update streak
      await get().updateStreak(userId)
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  completeMorning: async (userId: string, data) => {
    const { progress, currentEntry } = get()
    if (!progress || !currentEntry) return

    try {
      // Update entry
      await get().createOrUpdateEntry({
        ...currentEntry,
        morningCompleted: true,
        ...data,
      })

      // Update progress
      const bothCompleted = currentEntry.eveningCompleted && true
      const newProgress = {
        ...progress,
        morningRoutinesCompleted: progress.morningRoutinesCompleted + 1,
        totalDaysCompleted: bothCompleted ? progress.totalDaysCompleted + 1 : progress.totalDaysCompleted,
        lastCompletedDate: format(new Date(), 'yyyy-MM-dd'),
      }
      
      await updateDoc(doc(db, 'users', userId, 'routineProgress', 'current'), newProgress)
      set({ progress: newProgress })
      
      // Update streak
      await get().updateStreak(userId)
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  advanceDay: async (userId: string) => {
    const { progress } = get()
    if (!progress || progress.currentDay >= 66) return

    try {
      const newProgress = {
        ...progress,
        currentDay: progress.currentDay + 1,
        startedAt: progress.startedAt || new Date().toISOString(),
      }
      
      await updateDoc(doc(db, 'users', userId, 'routineProgress', 'current'), newProgress)
      set({ progress: newProgress })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  pauseJourney: async (userId: string) => {
    const { progress } = get()
    if (!progress) return

    try {
      const newProgress = {
        ...progress,
        isActive: false,
      }
      
      await updateDoc(doc(db, 'users', userId, 'routineProgress', 'current'), newProgress)
      set({ progress: newProgress })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  resumeJourney: async (userId: string) => {
    const { progress } = get()
    if (!progress) return

    try {
      const newProgress = {
        ...progress,
        isActive: true,
      }
      
      await updateDoc(doc(db, 'users', userId, 'routineProgress', 'current'), newProgress)
      set({ progress: newProgress })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  getStreak: () => {
    const { entries } = get()
    if (entries.length === 0) return 0

    let streak = 0
    const today = new Date()
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i]
      const entryDate = new Date(entry.date)
      const daysDiff = differenceInDays(today, entryDate)

      if (daysDiff === i && (entry.morningCompleted || entry.eveningCompleted)) {
        streak++
      } else {
        break
      }
    }

    return streak
  },

  getMilestoneProgress: () => {
    const { progress } = get()
    if (!progress) return null

    const milestones = [7, 14, 21, 30, 45, 66]
    const current = progress.currentDay
    const next = milestones.find(m => m > current) || 66

    const titles: Record<number, string> = {
      7: 'One Week Strong',
      14: 'Two Week Champion',
      21: 'Habit Formation',
      30: 'Monthly Master',
      45: 'Persistence Pays',
      66: 'Journey Complete',
    }

    return {
      current,
      next,
      nextTitle: titles[next] || 'Journey Complete',
    }
  },

  updateStreak: async (userId: string) => {
    const { progress } = get()
    if (!progress) return

    const currentStreak = get().getStreak()
    const longestStreak = Math.max(currentStreak, progress.longestStreak)

    const newProgress = {
      ...progress,
      currentStreak,
      longestStreak,
    }

    await updateDoc(doc(db, 'users', userId, 'routineProgress', 'current'), newProgress)
    set({ progress: newProgress })
  },
}))