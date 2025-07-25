export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  frequency?: number // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[] // 0-6 (Sunday to Saturday) for weekly patterns
  dayOfMonth?: number // 1-31 for monthly patterns
  startDate: string // YYYY-MM-DD format
  endDate?: string // Optional end date
  customPattern?: string // For future cron-like patterns
}

export interface RecurringCompletion {
  date: string // YYYY-MM-DD format
  completedAt: string // ISO timestamp
  notes?: string
  status?: 'completed' | 'skipped' | 'partial'
}

export type TaskType = 'one-time' | 'recurring' | 'habit'

export interface RecurringTaskData {
  taskType: TaskType
  recurrencePattern?: RecurrencePattern
  recurringCompletions?: RecurringCompletion[]
  currentStreak?: number
  longestStreak?: number
  lastRecurringCompletionDate?: string
}