/**
 * Date utility functions for due date handling and urgency calculation
 */

import { linearToLog } from './priorityUtils'

/**
 * Calculate urgency based on due date
 * Returns a log-scale urgency value (0-10)
 */
export function calculateUrgencyFromDueDate(dueDate: string | undefined): number | undefined {
  if (!dueDate) return undefined

  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let urgency: number

  if (diffDays < 0) {
    // Overdue
    urgency = 10
  } else if (diffDays === 0) {
    // Due today
    urgency = 9
  } else if (diffDays === 1) {
    // Due tomorrow
    urgency = 8
  } else if (diffDays <= 3) {
    // Due in 2-3 days
    urgency = 7
  } else if (diffDays <= 7) {
    // Due this week
    urgency = 6
  } else if (diffDays <= 14) {
    // Due in 1-2 weeks
    urgency = 5
  } else if (diffDays <= 30) {
    // Due this month
    urgency = 4
  } else if (diffDays <= 60) {
    // Due in 1-2 months
    urgency = 3
  } else if (diffDays <= 90) {
    // Due in 2-3 months
    urgency = 2
  } else {
    // Due later than 3 months
    urgency = 1
  }

  // Convert to log scale
  return linearToLog(urgency)
}

/**
 * Get a human-readable description of time until due date
 */
export function getDueDateDescription(dueDate: string | undefined): string {
  if (!dueDate) return ''

  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays)
    if (overdueDays === 1) return 'Overdue by 1 day'
    return `Overdue by ${overdueDays} days`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else if (diffDays <= 14) {
    return 'Due next week'
  } else if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7)
    return `Due in ${weeks} weeks`
  } else if (diffDays <= 60) {
    return 'Due next month'
  } else {
    const months = Math.ceil(diffDays / 30)
    return `Due in ${months} months`
  }
}

/**
 * Get color class for due date indicator based on urgency
 */
export function getDueDateColorClass(dueDate: string | undefined): string {
  if (!dueDate) return ''

  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'text-red-600 bg-red-100 border-red-300' // Overdue
  } else if (diffDays <= 1) {
    return 'text-orange-600 bg-orange-100 border-orange-300' // Due today/tomorrow
  } else if (diffDays <= 7) {
    return 'text-yellow-600 bg-yellow-100 border-yellow-300' // Due this week
  } else {
    return 'text-gray-600 bg-gray-100 border-gray-300' // Due later
  }
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Get date for relative options
 */
export function getRelativeDate(option: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek'): Date {
  const date = new Date()

  switch (option) {
    case 'today':
      return date
    case 'tomorrow':
      date.setDate(date.getDate() + 1)
      return date
    case 'thisWeek':
      const daysUntilSunday = 7 - date.getDay()
      date.setDate(date.getDate() + daysUntilSunday)
      return date
    case 'nextWeek':
      date.setDate(date.getDate() + 7)
      return date
    default:
      return date
  }
}

/**
 * Check if a date is in the past
 */
export function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}
