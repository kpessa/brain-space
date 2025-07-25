// Simple Journal Types (migrated from React app)
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

// Keep the Hero's Journey types below for future enhancement
// Hero's Journey Framework Types (for future enhancement)
export interface JournalEntryV2 {
  id: string
  userId: string
  date: string // YYYY-MM-DD format
  title?: string
  createdAt: string
  updatedAt: string
  
  // Hero's Journey Framework Fields
  gratitude: GratitudeItem[]
  wins: WinItem[]
  quests: QuestItem[]
  allies: AllyItem[]
  threats: ThreatItem[]
  insights: InsightItem[]
  mood: MoodRating
  energy: EnergyLevel
  
  // Optional fields
  weatherNote?: string
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent'
  reflection?: string
  tomorrowFocus?: string
  
  // Metadata
  wordCount?: number
  completionStatus: 'draft' | 'partial' | 'complete'
  tags?: string[]
}

export interface GratitudeItem {
  id: string
  text: string
  category?: 'people' | 'experiences' | 'personal' | 'opportunities' | 'simple_pleasures'
  intensity?: 1 | 2 | 3 | 4 | 5 // How grateful (1=slightly, 5=extremely)
}

export interface WinItem {
  id: string
  text: string
  category?: 'personal' | 'work' | 'health' | 'relationships' | 'learning' | 'creative'
  size?: 'small' | 'medium' | 'large' // Significance of the win
  effort?: 1 | 2 | 3 | 4 | 5 // How much effort it took
}

export interface QuestItem {
  id: string
  text: string
  type: 'main' | 'side' | 'daily' | 'urgent'
  difficulty?: 'easy' | 'medium' | 'hard' | 'epic'
  timeEstimate?: number // minutes
  priority?: 'low' | 'medium' | 'high'
  status?: 'planned' | 'in_progress' | 'completed' | 'deferred'
  reward?: string // What you get for completing it
  linkedBrainDumpId?: string // Link to brain dump for complex quests
}

export interface AllyItem {
  id: string
  name: string
  type: 'person' | 'resource' | 'tool' | 'habit' | 'knowledge'
  description: string
  availability?: 'always' | 'limited' | 'specific_times'
  strength?: 'low' | 'medium' | 'high' // How much they can help
}

export interface ThreatItem {
  id: string
  text: string
  type: 'external' | 'internal' | 'time' | 'resource' | 'emotional'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  likelihood?: 'unlikely' | 'possible' | 'likely' | 'certain'
  mitigation?: string // How to address or prepare for it
  status?: 'identified' | 'monitoring' | 'addressing' | 'resolved'
}

export interface InsightItem {
  id: string
  text: string
  source?: 'experience' | 'reading' | 'conversation' | 'reflection' | 'observation'
  category?: 'personal' | 'work' | 'relationships' | 'life' | 'learning'
  actionable?: boolean // Can this insight lead to action?
  followUpAction?: string // What to do with this insight
}

export interface MoodRating {
  overall: 1 | 2 | 3 | 4 | 5 // 1=very low, 5=very high
  energy: 1 | 2 | 3 | 4 | 5
  motivation: 1 | 2 | 3 | 4 | 5
  stress: 1 | 2 | 3 | 4 | 5 // 1=very low stress, 5=very high stress
  focus: 1 | 2 | 3 | 4 | 5
  confidence: 1 | 2 | 3 | 4 | 5
  note?: string // Optional mood note
}

export interface EnergyLevel {
  morning: 1 | 2 | 3 | 4 | 5
  afternoon: 1 | 2 | 3 | 4 | 5
  evening: 1 | 2 | 3 | 4 | 5
  physicalEnergy: 1 | 2 | 3 | 4 | 5
  mentalEnergy: 1 | 2 | 3 | 4 | 5
  emotionalEnergy: 1 | 2 | 3 | 4 | 5
}

// Journal templates and prompts
export interface JournalTemplate {
  id: string
  name: string
  description: string
  sections: JournalSection[]
  isDefault?: boolean
  createdBy?: string
}

export interface JournalSection {
  id: string
  title: string
  type: 'gratitude' | 'wins' | 'quests' | 'allies' | 'threats' | 'insights' | 'reflection' | 'mood' | 'custom'
  prompts: string[]
  required?: boolean
  order: number
}

// Progress tracking
export interface JournalStreak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastEntryDate: string // YYYY-MM-DD
  totalEntries: number
  streakStartDate: string
}

export interface JournalStats {
  userId: string
  period: 'week' | 'month' | 'quarter' | 'year'
  startDate: string
  endDate: string
  
  // Entry statistics
  totalEntries: number
  averageWordCount: number
  completionRate: number // Percentage of complete entries
  
  // Mood trends
  averageMood: number
  moodTrend: 'improving' | 'stable' | 'declining'
  moodVariance: number
  
  // Content analysis
  topGratitudeCategories: Record<string, number>
  topWinCategories: Record<string, number>
  questCompletionRate: number
  mostCommonThreats: string[]
  insightCount: number
  
  // Engagement metrics
  streak: JournalStreak
  daysWithEntries: string[] // Array of YYYY-MM-DD dates
  averageTimeSpent: number // minutes
}