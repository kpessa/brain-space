import type { Node, DueDate, RelativeUnit } from '@/types/node'

/**
 * Calculate priority from urgency and importance
 * @param urgency - 0-10 scale
 * @param importance - 0-10 scale
 * @returns priority - average of urgency and importance
 */
export function calculatePriority(urgency?: number, importance?: number): number | undefined {
  if (urgency === undefined || importance === undefined) return undefined
  return (urgency + importance) / 2
}

/**
 * Convert relative dates to absolute dates
 */
export function resolveRelativeDate(dueDate: DueDate, baseDate: Date = new Date()): Date {
  if (dueDate.type === 'exact') {
    return new Date(dueDate.date)
  }

  const date = new Date(baseDate)

  switch (dueDate.unit) {
    case 'minutes':
      date.setMinutes(date.getMinutes() + dueDate.offset)
      break
    case 'hours':
      date.setHours(date.getHours() + dueDate.offset)
      break
    case 'days':
      date.setDate(date.getDate() + dueDate.offset)
      break
    case 'weeks':
      date.setDate(date.getDate() + dueDate.offset * 7)
      break
    case 'months':
      date.setMonth(date.getMonth() + dueDate.offset)
      break
  }

  return date
}

/**
 * Create a DueDate from a string that might contain relative date text
 */
export function parseDueDate(text: string): DueDate | undefined {
  // Handle ISO date strings
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return { type: 'exact', date: text }
  }

  // Handle relative date patterns
  const relativePatterns: Array<[RegExp, (match: RegExpMatchArray) => DueDate]> = [
    [
      /in (\d+) (minute|hour|day|week|month)s?/i,
      match => ({
        type: 'relative',
        offset: parseInt(match[1]),
        unit: match[2].toLowerCase() as RelativeUnit,
      }),
    ],
    [/tomorrow/i, () => ({ type: 'relative', offset: 1, unit: 'days' })],
    [/next week/i, () => ({ type: 'relative', offset: 1, unit: 'weeks' })],
    [/next month/i, () => ({ type: 'relative', offset: 1, unit: 'months' })],
  ]

  for (const [pattern, handler] of relativePatterns) {
    const match = text.match(pattern)
    if (match) {
      return handler(match)
    }
  }

  return undefined
}

/**
 * Convert urgency/importance strings to numbers
 */
export function parseUrgency(urgency?: string): number | undefined {
  if (!urgency) return undefined
  const map: Record<string, number> = {
    low: 3,
    medium: 5,
    high: 8,
  }
  return map[urgency.toLowerCase()] || undefined
}

export function parseImportance(importance?: string): number | undefined {
  return parseUrgency(importance) // Same scale
}

/**
 * Create a new Node with defaults
 */
export function createNode(partial: Partial<Node>, userId: string): Node {
  const now = new Date().toISOString()
  const node: Node = {
    id: partial.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    ...partial,
  }

  // Calculate priority if urgency and importance are provided
  if (node.urgency !== undefined && node.importance !== undefined) {
    node.priority = calculatePriority(node.urgency, node.importance)
  }

  return node
}

/**
 * Get Eisenhower matrix quadrant
 */
export function getEisenhowerQuadrant(urgency?: number, importance?: number): string {
  if (urgency === undefined || importance === undefined) return 'unknown'

  if (urgency >= 7 && importance >= 7) return 'do-first' // Urgent & Important
  if (urgency < 7 && importance >= 7) return 'schedule' // Not Urgent & Important
  if (urgency >= 7 && importance < 7) return 'delegate' // Urgent & Not Important
  return 'decide' // Not Urgent & Not Important
}

/**
 * Check if a node matches search criteria
 */
export function nodeMatchesSearch(node: Node, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase()

  // Search in title and description
  if (node.title?.toLowerCase().includes(term)) return true
  if (node.description?.toLowerCase().includes(term)) return true

  // Search in aliases
  if (node.aliases?.some(alias => alias.toLowerCase().includes(term))) return true

  // Search in tags
  if (node.tags?.some(tag => tag.toLowerCase().includes(term))) return true

  return false
}

/**
 * Get display title for a node
 */
export function getNodeDisplayTitle(node: Node): string {
  return node.title || node.description?.substring(0, 50) || 'Untitled Node'
}
