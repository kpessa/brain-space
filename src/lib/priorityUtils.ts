/**
 * Utility functions for Eisenhower Matrix priority calculations
 */

/**
 * Convert a linear scale value (0-10) to log scale
 * This gives more resolution at lower values
 */
export function linearToLog(value: number): number {
  // Ensure value is within bounds
  const clampedValue = Math.max(0, Math.min(10, value))

  // Use log10(x + 1) to map 0-10 to 0-1.04
  // Then scale to 0-10 range
  return (Math.log10(clampedValue + 1) / Math.log10(11)) * 10
}

/**
 * Convert a log scale value back to linear scale (0-10)
 */
export function logToLinear(logValue: number): number {
  // Ensure value is within bounds
  const clampedValue = Math.max(0, Math.min(10, logValue))

  // Reverse the log transformation
  const normalized = clampedValue / 10
  return Math.pow(10, normalized * Math.log10(11)) - 1
}

/**
 * Get the Eisenhower quadrant for given importance/urgency values
 */
export function getQuadrant(importance?: number, urgency?: number): string {
  const imp = importance ?? 5
  const urg = urgency ?? 5

  if (imp >= 5 && urg >= 5) return 'do-first' // Important & Urgent
  if (imp >= 5 && urg < 5) return 'schedule' // Important & Not Urgent
  if (imp < 5 && urg >= 5) return 'delegate' // Not Important & Urgent
  return 'eliminate' // Not Important & Not Urgent
}

/**
 * Get quadrant display properties
 */
export function getQuadrantInfo(quadrant: string) {
  switch (quadrant) {
    case 'do-first':
      return {
        label: 'Do First',
        color: 'bg-red-100 border-red-300 text-red-900',
        description: 'Important & Urgent - Crisis management',
        icon: '🔥',
        position: { x: 1, y: 1 }, // top-right
      }
    case 'schedule':
      return {
        label: 'Schedule',
        color: 'bg-blue-100 border-blue-300 text-blue-900',
        description: 'Important & Not Urgent - Planning & development',
        icon: '📅',
        position: { x: 0, y: 1 }, // top-left
      }
    case 'delegate':
      return {
        label: 'Delegate',
        color: 'bg-yellow-100 border-yellow-300 text-yellow-900',
        description: 'Not Important & Urgent - Interruptions',
        icon: '👥',
        position: { x: 1, y: 0 }, // bottom-right
      }
    case 'eliminate':
    default:
      return {
        label: 'Eliminate',
        color: 'bg-gray-100 border-gray-300 text-gray-600',
        description: 'Not Important & Not Urgent - Time wasters',
        icon: '🗑️',
        position: { x: 0, y: 0 }, // bottom-left
      }
  }
}

/**
 * Calculate position within a quadrant based on priority values
 * Returns normalized x,y coordinates (0-1) within the quadrant
 */
export function getPositionInQuadrant(
  importance?: number,
  urgency?: number
): { x: number; y: number } {
  const imp = importance ?? 5
  const urg = urgency ?? 5

  // Normalize to 0-1 within the quadrant
  const x = (urg % 5) / 5
  const y = (imp % 5) / 5

  return { x, y }
}

/**
 * Convert simple mode selection to numeric values
 */
export function simpleToNumeric(isHigh: boolean): number {
  return isHigh ? 7 : 3
}

/**
 * Convert numeric value to simple mode
 */
export function numericToSimple(value?: number): boolean {
  return (value ?? 5) >= 5
}
