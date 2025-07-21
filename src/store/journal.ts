import { create } from 'zustand'
import type { JournalEntry, UserProgress, Achievement } from '../types/journal'
import { XP_REWARDS, LEVELS, ACHIEVEMENTS_LIST } from '../types/journal'
import { supabaseService } from '../services/supabase'
import { isSupabaseConfigured } from '../lib/supabase'

interface JournalState {
  entries: JournalEntry[]
  userProgress: UserProgress
  isLoading: boolean
  isSyncing: boolean

  // Actions
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'xpEarned'>) => void
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>
  deleteEntry: (id: string) => void
  calculateStreak: () => number
  checkAchievements: () => void
  getTodayEntry: () => JournalEntry | undefined

  // Sync actions
  setEntries: (entries: JournalEntry[]) => void
  setUserProgress: (progress: UserProgress) => void
  syncEntry: (entry: JournalEntry, userId: string) => Promise<void>
  syncProgress: (progress: UserProgress) => Promise<void>
  recalculateProgress: () => Promise<void>
}

const initialProgress: UserProgress = {
  userId: 'demo-user',
  level: 1,
  currentXP: 0,
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalEntries: 0,
  achievements: [],
  lastEntryDate: null,
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  userProgress: initialProgress,
  isLoading: false,
  isSyncing: false,

  addEntry: async entryData => {
    const { entries, userProgress } = get()

    // Calculate XP for this entry
    let xpEarned = XP_REWARDS.DAILY_ENTRY
    xpEarned += entryData.gratitude.filter(g => g.trim()).length * XP_REWARDS.GRATITUDE_ITEM
    if (entryData.dailyQuest.trim()) xpEarned += XP_REWARDS.QUEST_DEFINED
    if (entryData.threats.trim()) xpEarned += XP_REWARDS.THREAT_IDENTIFIED
    if (entryData.allies.trim()) xpEarned += XP_REWARDS.ALLY_RECOGNIZED
    if (entryData.notes.trim().length > 50) xpEarned += XP_REWARDS.NOTES_BONUS

    // Ensure xpEarned is a valid number
    xpEarned = isNaN(xpEarned) ? 0 : xpEarned

    // Check streak
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const lastEntry = userProgress.lastEntryDate
      ? new Date(userProgress.lastEntryDate).toDateString()
      : null

    let newStreak = userProgress.currentStreak
    if (lastEntry === yesterday) {
      newStreak += 1
    } else if (lastEntry !== today) {
      newStreak = 1
    }

    // Add streak bonus
    const streakBonus = XP_REWARDS.STREAK_BONUS(newStreak)
    xpEarned += isNaN(streakBonus) ? 0 : streakBonus

    // Create new entry
    const newEntry: JournalEntry = {
      ...entryData,
      id: `entry-${Date.now()}`,
      xpEarned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Calculate new level
    const newTotalXP = userProgress.totalXP + xpEarned
    let newLevel = LEVELS.findIndex(level => newTotalXP < level.maxXP) + 1
    if (newLevel === 0) newLevel = LEVELS.length // If no level found (totalXP >= all maxXP), set to max level
    const currentLevelData = LEVELS[newLevel - 1]
    // For the max level, calculate currentXP differently to avoid Infinity
    const newCurrentXP =
      currentLevelData.maxXP === Infinity
        ? newTotalXP - currentLevelData.minXP
        : Math.min(
            newTotalXP - currentLevelData.minXP,
            currentLevelData.maxXP - currentLevelData.minXP
          )

    const newProgress = {
      ...userProgress,
      level: newLevel,
      currentXP: isNaN(newCurrentXP) ? 0 : newCurrentXP,
      totalXP: isNaN(newTotalXP) ? 0 : newTotalXP,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, userProgress.longestStreak),
      totalEntries: userProgress.totalEntries + 1,
      lastEntryDate: new Date().toISOString(),
    }

    set({
      entries: [newEntry, ...entries],
      userProgress: newProgress,
    })

    // Check for new achievements
    get().checkAchievements()

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && newProgress.userId !== 'demo-user') {
      await get().syncEntry(newEntry, newProgress.userId)
      await get().syncProgress(newProgress)
    }
  },

  updateEntry: async (id, updates) => {
    const { entries, userProgress } = get()
    const currentEntry = entries.find(e => e.id === id)
    if (!currentEntry) return

    // Calculate XP difference if XP has changed
    const oldXP = currentEntry.xpEarned
    const newXP = updates.xpEarned || oldXP
    const xpDiff = newXP - oldXP

    // Update the entry
    const updatedEntry = {
      ...currentEntry,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    // Update entries in state
    set(state => ({
      entries: state.entries.map(entry => (entry.id === id ? updatedEntry : entry)),
    }))

    // Update user progress if XP changed
    if (xpDiff !== 0) {
      const newTotalXP = userProgress.totalXP + xpDiff
      let newLevel = LEVELS.findIndex(level => newTotalXP < level.maxXP) + 1
      if (newLevel === 0) newLevel = LEVELS.length // If no level found (totalXP >= all maxXP), set to max level
      const currentLevelData = LEVELS[newLevel - 1]
      // For the max level, calculate currentXP differently to avoid Infinity
      const newCurrentXP =
        currentLevelData.maxXP === Infinity
          ? newTotalXP - currentLevelData.minXP
          : Math.min(
              newTotalXP - currentLevelData.minXP,
              currentLevelData.maxXP - currentLevelData.minXP
            )

      const newProgress = {
        ...userProgress,
        level: newLevel,
        currentXP: isNaN(newCurrentXP) ? 0 : newCurrentXP,
        totalXP: isNaN(newTotalXP) ? 0 : newTotalXP,
      }

      set({ userProgress: newProgress })

      // Sync progress to Supabase if configured
      if (isSupabaseConfigured() && userProgress.userId !== 'demo-user') {
        await get().syncProgress(newProgress)
      }
    }

    // Sync entry to Supabase if configured
    if (isSupabaseConfigured() && userProgress.userId !== 'demo-user') {
      set({ isSyncing: true })
      try {
        await supabaseService.updateJournalEntry(id, updatedEntry)
      } catch (error) {
        console.error('Failed to sync journal entry update:', error)
      } finally {
        set({ isSyncing: false })
      }
    }
  },

  deleteEntry: id => {
    set(state => ({
      entries: state.entries.filter(entry => entry.id !== id),
    }))
  },

  calculateStreak: () => {
    const { entries } = get()
    if (entries.length === 0) return 0

    let streak = 1
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    for (let i = 1; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i - 1].date)
      const previousDate = new Date(sortedEntries[i].date)
      const dayDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)

      if (dayDiff === 1) {
        streak++
      } else {
        break
      }
    }

    return streak
  },

  checkAchievements: () => {
    const { entries, userProgress } = get()
    const newAchievements: Achievement[] = []

    // First Entry
    if (entries.length === 1 && !userProgress.achievements.find(a => a.id === 'first-entry')) {
      newAchievements.push({
        ...ACHIEVEMENTS_LIST.find(a => a.id === 'first-entry')!,
        unlockedAt: new Date().toISOString(),
      })
    }

    // Week Warrior
    if (
      userProgress.currentStreak >= 7 &&
      !userProgress.achievements.find(a => a.id === 'week-warrior')
    ) {
      newAchievements.push({
        ...ACHIEVEMENTS_LIST.find(a => a.id === 'week-warrior')!,
        unlockedAt: new Date().toISOString(),
      })
    }

    // Gratitude Master
    const totalGratitude = entries.reduce(
      (sum, entry) => sum + entry.gratitude.filter(g => g.trim()).length,
      0
    )
    if (
      totalGratitude >= 100 &&
      !userProgress.achievements.find(a => a.id === 'gratitude-master')
    ) {
      newAchievements.push({
        ...ACHIEVEMENTS_LIST.find(a => a.id === 'gratitude-master')!,
        unlockedAt: new Date().toISOString(),
      })
    }

    if (newAchievements.length > 0) {
      set(state => ({
        userProgress: {
          ...state.userProgress,
          achievements: [...state.userProgress.achievements, ...newAchievements],
        },
      }))
    }
  },

  getTodayEntry: () => {
    const { entries } = get()
    const today = new Date().toDateString()
    return entries.find(entry => new Date(entry.date).toDateString() === today)
  },

  setEntries: entries => {
    set({ entries })
  },

  setUserProgress: progress => {
    // Clean up any duplicate fields (e.g., currentXp vs currentXP)
    const cleanProgress = { ...progress }

    // Remove lowercase versions if uppercase versions exist
    if ('currentXP' in cleanProgress && 'currentXp' in cleanProgress) {
      delete cleanProgress.currentXp
    }
    if ('totalXP' in cleanProgress && 'totalXp' in cleanProgress) {
      delete cleanProgress.totalXp
    }

    // Validate and sanitize the progress data to prevent NaN values
    const sanitizedProgress = {
      ...cleanProgress,
      currentXP:
        isNaN(cleanProgress.currentXP) || cleanProgress.currentXP === null
          ? 0
          : cleanProgress.currentXP,
      totalXP:
        isNaN(cleanProgress.totalXP) || cleanProgress.totalXP === null ? 0 : cleanProgress.totalXP,
      level:
        isNaN(cleanProgress.level) || cleanProgress.level === null || cleanProgress.level < 1
          ? 1
          : cleanProgress.level,
      currentStreak:
        isNaN(cleanProgress.currentStreak) || cleanProgress.currentStreak === null
          ? 0
          : cleanProgress.currentStreak,
      longestStreak:
        isNaN(cleanProgress.longestStreak) || cleanProgress.longestStreak === null
          ? 0
          : cleanProgress.longestStreak,
      totalEntries:
        isNaN(cleanProgress.totalEntries) || cleanProgress.totalEntries === null
          ? 0
          : cleanProgress.totalEntries,
    }
    set({ userProgress: sanitizedProgress })
  },

  syncEntry: async (entry, userId) => {
    if (!isSupabaseConfigured() || userId === 'demo-user') return

    set({ isSyncing: true })
    try {
      await supabaseService.createJournalEntry(entry)
    } catch (error) {
      console.error('Failed to sync journal entry:', error)
    } finally {
      set({ isSyncing: false })
    }
  },

  syncProgress: async progress => {
    if (!isSupabaseConfigured()) return

    set({ isSyncing: true })
    try {
      await supabaseService.updateUserProgress(progress.userId, progress)
    } catch (error) {
      console.error('Failed to sync user progress:', error)
    } finally {
      set({ isSyncing: false })
    }
  },

  recalculateProgress: async () => {
    const { entries, userProgress } = get()

    if (entries.length === 0) return

    // Calculate totals from entries
    const totalXP = entries.reduce((sum, entry) => sum + (entry.xpEarned || 0), 0)
    const totalEntries = entries.length

    // Calculate current streak
    const currentStreak = get().calculateStreak()

    // Calculate longest streak by checking all historical streaks
    let longestStreak = currentStreak
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let tempStreak = 1
    for (let i = 1; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i].date)
      const previousDate = new Date(sortedEntries[i - 1].date)
      const dayDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)

      if (Math.abs(dayDiff - 1) < 0.1) {
        // Account for small floating point differences
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    // Calculate level
    const levelIndex = LEVELS.findIndex(level => totalXP < level.maxXP)
    const newLevel = levelIndex >= 0 ? levelIndex + 1 : LEVELS.length
    const currentLevelMinXP = LEVELS[newLevel - 1]?.minXP || 0
    const currentXP = totalXP - currentLevelMinXP

    // Get last entry date
    const lastEntryDate =
      entries.length > 0
        ? entries.reduce((latest, entry) =>
            new Date(entry.date) > new Date(latest.date) ? entry : latest
          ).date
        : null

    // Create recalculated progress
    const recalculatedProgress = {
      ...userProgress,
      level: newLevel,
      currentXP: Math.max(0, currentXP),
      totalXP,
      currentStreak,
      longestStreak,
      totalEntries,
      lastEntryDate,
    }

    // Update the store
    set({ userProgress: recalculatedProgress })

    // Sync to database
    if (isSupabaseConfigured() && userProgress.userId !== 'demo-user') {
      await get().syncProgress(recalculatedProgress)
    }
  },
}))
