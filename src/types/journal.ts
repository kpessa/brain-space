export interface JournalEntry {
  id: string
  userId: string
  date: string
  gratitude: string[]
  dailyQuest: string
  threats: string
  allies: string
  notes: string
  xpEarned: number
  createdAt: string
  updatedAt: string
}

export interface UserProgress {
  userId: string
  level: number
  currentXP: number
  totalXP: number
  currentStreak: number
  longestStreak: number
  totalEntries: number
  achievements: Achievement[]
  lastEntryDate: string | null
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string
  category: AchievementCategory
}

export const AchievementCategory = {
  STREAK: 'streak',
  ENTRIES: 'entries',
  GRATITUDE: 'gratitude',
  QUESTS: 'quests',
  SPECIAL: 'special',
} as const

export type AchievementCategory = (typeof AchievementCategory)[keyof typeof AchievementCategory]

export interface Level {
  level: number
  title: string
  minXP: number
  maxXP: number
  perks: string[]
}

export const LEVELS: Level[] = [
  {
    level: 1,
    title: 'Novice Adventurer',
    minXP: 0,
    maxXP: 100,
    perks: ['Basic journal entries', 'Daily quest tracking'],
  },
  {
    level: 2,
    title: 'Brave Wanderer',
    minXP: 100,
    maxXP: 250,
    perks: ['Custom quest categories', 'Weekly review unlocked'],
  },
  {
    level: 3,
    title: 'Seasoned Explorer',
    minXP: 250,
    maxXP: 500,
    perks: ['AI motivational messages', 'Advanced statistics'],
  },
  {
    level: 4,
    title: 'Mighty Champion',
    minXP: 500,
    maxXP: 1000,
    perks: ['Custom themes', 'Export journal entries'],
  },
  {
    level: 5,
    title: 'Legendary Hero',
    minXP: 1000,
    maxXP: Infinity,
    perks: ['All features unlocked', 'Mentor status'],
  },
]

export interface QuestTemplate {
  id: string
  category: QuestCategory
  prompt: string
  levelRange: [number, number]
  xpReward: number
}

export const QuestCategory = {
  PERSONAL_GROWTH: 'personal_growth',
  RELATIONSHIPS: 'relationships',
  CAREER: 'career',
  HEALTH: 'health',
  CREATIVITY: 'creativity',
  ADVENTURE: 'adventure',
} as const

export type QuestCategory = (typeof QuestCategory)[keyof typeof QuestCategory]

export interface DailyStats {
  date: string
  entriesCreated: number
  gratitudeItems: number
  threatsIdentified: number
  alliesRecognized: number
  wordsWritten: number
  xpEarned: number
}

export const XP_REWARDS = {
  DAILY_ENTRY: 25,
  GRATITUDE_ITEM: 5,
  QUEST_DEFINED: 10,
  THREAT_IDENTIFIED: 5,
  ALLY_RECOGNIZED: 5,
  NOTES_BONUS: 10, // For writing substantial notes
  STREAK_BONUS: (streak: number) => Math.min(streak * 5, 50), // Max 50 XP for streaks
}

export const ACHIEVEMENTS_LIST: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'first-entry',
    name: 'First Steps',
    description: 'Create your first journal entry',
    icon: '🎯',
    category: AchievementCategory.ENTRIES,
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Journal for 7 consecutive days',
    icon: '🔥',
    category: AchievementCategory.STREAK,
  },
  {
    id: 'gratitude-master',
    name: 'Gratitude Master',
    description: 'Record 100 gratitude items',
    icon: '💖',
    category: AchievementCategory.GRATITUDE,
  },
  {
    id: 'quest-completer',
    name: 'Quest Completer',
    description: 'Complete 30 daily quests',
    icon: '⚔️',
    category: AchievementCategory.QUESTS,
  },
  {
    id: 'dragon-slayer',
    name: 'Dragon Slayer',
    description: 'Identify and overcome 50 threats',
    icon: '🐲',
    category: AchievementCategory.SPECIAL,
  },
]
