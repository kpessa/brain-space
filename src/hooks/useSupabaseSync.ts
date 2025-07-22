import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useJournalStore } from '../store/journal'
import { useBrainDumpStore } from '../store/braindump'
import { supabaseService } from '../services/supabase'
import { isSupabaseConfigured } from '../lib/supabase'
import { logger } from '../services/logger'

export function useSupabaseSync() {
  const { user, isOfflineMode } = useAuth()

  // Sync journal entries
  useEffect(() => {
    if (!user || isOfflineMode || !isSupabaseConfigured()) return

    // Load journal entries from Supabase
    const loadJournalEntries = async () => {
      const entries = await supabaseService.getJournalEntries(user.id)
      useJournalStore.getState().setEntries(entries)

      // If we have entries but no progress, calculate progress from entries
      const progress = await supabaseService.getUserProgress(user.id)
      if (!progress && entries.length > 0) {
        // Calculate totals from entries
        const totalXP = entries.reduce((sum, entry) => sum + (entry.xpEarned || 0), 0)
        const totalEntries = entries.length

        // Calculate level - import LEVELS from types
        const { LEVELS } = await import('../types/journal')
        const levelIndex = LEVELS.findIndex(level => totalXP < level.maxXP)
        const newLevel = levelIndex >= 0 ? levelIndex + 1 : LEVELS.length
        const currentLevelMinXP = LEVELS[newLevel - 1]?.minXP || 0

        // Create initial progress
        const initialProgress = {
          userId: user.id,
          level: newLevel,
          currentXP: totalXP - currentLevelMinXP,
          totalXP,
          currentStreak: 0,
          longestStreak: 0,
          totalEntries,
          achievements: [],
          lastEntryDate: entries[0]?.date || null,
        }

        useJournalStore.getState().setUserProgress(initialProgress)
        await supabaseService.updateUserProgress(user.id, initialProgress)
      }
    }

    // Load user progress
    const loadUserProgress = async () => {
      const progress = await supabaseService.getUserProgress(user.id)
      if (progress) {
        useJournalStore.getState().setUserProgress(progress)
      }
    }

    // Load both entries and progress in parallel, then ensure progress is loaded
    Promise.all([loadJournalEntries(), loadUserProgress()])
      .then(() => {
        logger.info('SYNC', 'Initial sync completed')
      })
      .catch(error => {
        logger.error('SYNC', 'Error during initial sync', error)
      })

    // Subscribe to real-time updates
    const subscription = supabaseService.subscribeToJournalEntries(user.id, payload => {
      logger.debug('SYNC', 'Journal entry change detected', { payload })
      // Reload entries when changes occur
      loadJournalEntries()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [user?.id, isOfflineMode])

  // Sync brain dumps
  useEffect(() => {
    let mounted = true

    logger.info('SYNC', 'Brain dump sync effect running', {
      hasUser: !!user,
      userId: user?.id,
      isOfflineMode,
      isSupabaseConfigured: isSupabaseConfigured(),
    })

    if (!user || isOfflineMode || !isSupabaseConfigured()) {
      logger.info('SYNC', 'Skipping sync due to conditions', {
        hasUser: !!user,
        isOfflineMode,
        isSupabaseConfigured: isSupabaseConfigured(),
      })
      return
    }

    // Load brain dumps from Supabase
    const loadBrainDumps = async () => {
      if (!mounted) return

      logger.info('SYNC', 'Loading brain dumps from Supabase...', { userId: user.id })

      const dumps = await supabaseService.getBrainDumps(user.id)

      if (!mounted) return

      logger.info('SYNC', 'Loaded brain dumps', {
        count: dumps.length,
        dumpIds: dumps.map(d => d.id),
      })

      dumps.forEach(dump => {
        logger.debug('SYNC', 'Dump details', {
          id: dump.id,
          title: dump.title,
          type: dump.type,
          nodesCount: dump.nodes?.length || 0,
          edgesCount: dump.edges?.length || 0,
          topicFocus: dump.topicFocus,
          parentBrainDumpId: dump.parentBrainDumpId,
        })
      })

      if (!mounted) return

      useBrainDumpStore.getState().setEntries(dumps)

      // Restore current entry from localStorage
      const savedCurrentId = localStorage.getItem('currentBrainDumpId')
      logger.info('SYNC', 'Checking for saved current entry', {
        savedCurrentId,
        hasLocalStorage: !!savedCurrentId,
      })

      if (savedCurrentId) {
        const savedEntry = dumps.find(d => d.id === savedCurrentId)
        if (savedEntry) {
          logger.info('SYNC', 'Restoring current entry', {
            id: savedCurrentId,
            title: savedEntry.title,
            nodesCount: savedEntry.nodes?.length || 0,
          })
          useBrainDumpStore.getState().setCurrentEntry(savedEntry)
        } else {
          logger.warn('SYNC', 'Saved entry not found in loaded dumps', {
            savedCurrentId,
            availableIds: dumps.map(d => d.id),
          })
        }
      }
    }

    loadBrainDumps()

    // Subscribe to real-time updates
    const subscription = supabaseService.subscribeToBrainDumps(user.id, payload => {
      logger.debug('REALTIME', 'Brain dump change detected', {
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
      })

      // Check if this is an update to the current entry
      const currentEntry = useBrainDumpStore.getState().currentEntry
      if (currentEntry && payload.new && payload.new.id === currentEntry.id) {
        // Compare timestamps to see if this is our own update
        const localTimestamp = new Date(currentEntry.updatedAt).getTime()
        const remoteTimestamp = new Date(payload.new.updatedAt).getTime()

        logger.debug('REALTIME', 'Timestamp comparison', {
          localTimestamp,
          remoteTimestamp,
        })

        // If timestamps are very close (within 2 seconds), it's likely our own update
        if (Math.abs(remoteTimestamp - localTimestamp) < 2000) {
          logger.debug('REALTIME', 'Skipping reload - this appears to be our own update')
          return
        }
      }

      // Add a small delay to avoid race conditions with local updates
      setTimeout(() => {
        logger.debug('REALTIME', 'Reloading brain dumps after delay...')
        loadBrainDumps()
      }, 100)
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [user?.id, isOfflineMode])

  // Return sync status
  return {
    isSyncing: false, // You could add loading states here
    isOffline: isOfflineMode,
  }
}
