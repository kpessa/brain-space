import { useEffect, useRef, useCallback } from 'react'
import { useRoutineStore } from '../store/routines'
import { logger } from '../services/logger'

export function useRoutineAutoSave(routineType: 'morning' | 'evening') {
  const { saveDraft, currentEntry } = useRoutineStore()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<string>('')

  const autoSave = useCallback(
    (data: any) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Debounce for 1 second
      timeoutRef.current = setTimeout(async () => {
        const dataString = JSON.stringify(data)

        // Only save if data has changed
        if (dataString !== lastSavedRef.current) {
          logger.info('ROUTINE_AUTOSAVE', `Auto-saving ${routineType} routine draft`, { data })

          try {
            await saveDraft(data)
            lastSavedRef.current = dataString
          } catch (error) {
            logger.error('ROUTINE_AUTOSAVE', 'Failed to auto-save', { error })
          }
        }
      }, 1000)
    },
    [saveDraft, routineType]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Update lastSaved when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      lastSavedRef.current = JSON.stringify(currentEntry)
    }
  }, [currentEntry])

  return autoSave
}
