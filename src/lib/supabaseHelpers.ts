// Convert camelCase to snake_case for database operations
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }

  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj
  }

  return Object.keys(obj).reduce((acc: any, key) => {
    // Handle consecutive capitals like "XP" -> "xp" not "x_p"
    const snakeKey = key
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // ABc -> A_Bc
      .replace(/([a-z\d])([A-Z])/g, '$1_$2') // aBc -> a_Bc
      .toLowerCase()
    acc[snakeKey] = toSnakeCase(obj[key])
    return acc
  }, {})
}

// Convert snake_case to camelCase for JavaScript operations
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }

  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj
  }

  return Object.keys(obj).reduce((acc: any, key) => {
    // Special handling for known fields with acronyms
    const specialCases: Record<string, string> = {
      current_xp: 'currentXP',
      total_xp: 'totalXP',
      xp_earned: 'xpEarned',
      user_id: 'userId',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      last_entry_date: 'lastEntryDate',
      current_streak: 'currentStreak',
      longest_streak: 'longestStreak',
      total_entries: 'totalEntries',
      daily_quest: 'dailyQuest',
      // Fallback mappings for old field names
      experience: 'currentXP',
      total_experience: 'totalXP',
      streak: 'currentStreak',
    }

    const camelKey =
      specialCases[key] || key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    acc[camelKey] = toCamelCase(obj[key])
    return acc
  }, {})
}
