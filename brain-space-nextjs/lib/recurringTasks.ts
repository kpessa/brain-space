import { RecurrencePattern, RecurringCompletion } from '@/types/recurrence'
import { format, addDays } from 'date-fns'

/**
 * Check if a task should occur on a given date based on its recurrence pattern
 */
export function shouldTaskOccurOnDate(pattern: RecurrencePattern, date: Date | string): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const startDate = new Date(pattern.startDate)

  // Check if date is before start date
  if (checkDate < startDate) return false

  // Check if date is after end date (if specified)
  if (pattern.endDate) {
    const endDate = new Date(pattern.endDate)
    if (checkDate > endDate) return false
  }

  // Calculate based on pattern type
  switch (pattern.type) {
    case 'daily': {
      const frequency = pattern.frequency || 1
      const daysDiff = Math.floor(
        (checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff % frequency === 0
    }

    case 'weekly': {
      const frequency = pattern.frequency || 1
      const weeksDiff = Math.floor(
        (checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
      )

      // Check if it's the right week
      if (weeksDiff % frequency !== 0) return false

      // Check if it's the right day of week
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        return pattern.daysOfWeek.includes(checkDate.getDay())
      }

      // If no specific days specified, use the same day of week as start date
      return checkDate.getDay() === startDate.getDay()
    }

    case 'monthly': {
      const frequency = pattern.frequency || 1
      const monthsDiff =
        (checkDate.getFullYear() - startDate.getFullYear()) * 12 +
        (checkDate.getMonth() - startDate.getMonth())

      // Check if it's the right month
      if (monthsDiff % frequency !== 0) return false

      // Check if it's the right day of month
      const targetDay = pattern.dayOfMonth || startDate.getDate()
      return checkDate.getDate() === targetDay
    }

    case 'custom':
      // TODO: Implement custom cron-like patterns
      return false

    default:
      return false
  }
}

/**
 * Get the completion status for a recurring task on a specific date
 */
export function getRecurringTaskCompletionForDate(
  completions: RecurringCompletion[] | undefined,
  date: string
): RecurringCompletion | undefined {
  if (!completions) return undefined
  return completions.find(c => c.date === date)
}

/**
 * Check if a recurring task is completed for a specific date
 */
export function isRecurringTaskCompletedForDate(
  completions: RecurringCompletion[] | undefined,
  date: string
): boolean {
  return !!getRecurringTaskCompletionForDate(completions, date)
}

/**
 * Calculate current streak for a habit
 */
export function calculateCurrentStreak(
  completions: RecurringCompletion[] | undefined,
  pattern: RecurrencePattern
): number {
  if (!completions || completions.length === 0) return 0

  // Sort completions by date (most recent first)
  // const sortedCompletions = [...completions].sort(
  //   (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  // )

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0) // Start from today

  // Check backwards from today
  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')

    // Should this task occur on this date?
    if (shouldTaskOccurOnDate(pattern, currentDate)) {
      // Is it completed?
      if (isRecurringTaskCompletedForDate(completions, dateStr)) {
        streak++
      } else {
        // Streak broken
        break
      }
    }

    // Move to previous day
    currentDate = addDays(currentDate, -1)

    // Don't go before the start date
    if (currentDate < new Date(pattern.startDate)) break
  }

  return streak
}

/**
 * Get all dates where a recurring task should appear within a date range
 */
export function getRecurringTaskDates(
  pattern: RecurrencePattern,
  startDate: Date,
  endDate: Date
): string[] {
  const dates: string[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    if (shouldTaskOccurOnDate(pattern, currentDate)) {
      dates.push(format(currentDate, 'yyyy-MM-dd'))
    }
    currentDate = addDays(currentDate, 1)
  }

  return dates
}

/**
 * Format recurrence pattern for display
 */
export function formatRecurrencePattern(pattern: RecurrencePattern): string {
  const frequency = pattern.frequency || 1

  switch (pattern.type) {
    case 'daily':
      return frequency === 1 ? 'Daily' : `Every ${frequency} days`

    case 'weekly': {
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const daysStr = pattern.daysOfWeek?.map(d => weekDays[d]).join(', ') || ''

      if (frequency === 1) {
        return daysStr ? `Weekly on ${daysStr}` : 'Weekly'
      } else {
        return daysStr ? `Every ${frequency} weeks on ${daysStr}` : `Every ${frequency} weeks`
      }
    }

    case 'monthly': {
      const dayStr = pattern.dayOfMonth ? `on the ${pattern.dayOfMonth}` : ''
      return frequency === 1
        ? `Monthly ${dayStr}`.trim()
        : `Every ${frequency} months ${dayStr}`.trim()
    }

    case 'custom':
      return 'Custom schedule'

    default:
      return 'Unknown schedule'
  }
}

/**
 * Get the next occurrence date for a recurring task
 */
export function getNextOccurrenceDate(pattern: RecurrencePattern, fromDate?: Date): Date | null {
  const start = fromDate || new Date()
  let currentDate = new Date(start)
  currentDate.setHours(0, 0, 0, 0)

  // Check up to 1 year in the future
  const maxDate = addDays(currentDate, 365)

  while (currentDate <= maxDate) {
    if (shouldTaskOccurOnDate(pattern, currentDate)) {
      return currentDate
    }
    currentDate = addDays(currentDate, 1)
  }

  return null
}