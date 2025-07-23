export interface RoutineEntry {
  id: string
  userId: string
  dayNumber: number // 1-66
  date: string // ISO date string

  // Evening routine data
  eveningCompleted: boolean
  sleepIntention?: string // Time as HH:MM
  wakeIntention?: string // Time as HH:MM
  magicalMoment?: string
  morningRitualPlan?: string[] // List of 3-5 simple actions

  // Morning routine data
  morningCompleted: boolean
  actualSleepTime?: string // Time as HH:MM
  actualWakeTime?: string // Time as HH:MM
  ritualCompleted?: boolean[] // Completion status for each ritual item
  mit?: string // Most Important Task
  onePercentImprovement?: string
  distractionsToMinimize?: { distraction: string; limit: string }[]

  createdAt: string
  updatedAt: string
}

export interface RoutineProgress {
  userId: string
  currentDay: number // 0-66, 0 means not started
  startedAt?: string // ISO date when journey began
  lastCompletedDate?: string // Last date any routine was completed
  totalDaysCompleted: number
  isActive: boolean // Whether the journey is currently active

  // Stats
  morningRoutinesCompleted: number
  eveningRoutinesCompleted: number
  currentStreak: number
  longestStreak: number
}

export interface RoutineStats {
  averageSleepTime: number // In minutes
  averageWakeTime: string // Average time as HH:MM
  mostCommonRituals: string[]
  completionRate: number // Percentage
  topDistractions: string[]
}

// Preset morning ritual suggestions
export const MORNING_RITUAL_SUGGESTIONS = [
  'Drink a glass of water',
  'Take 5 deep breaths',
  'Stretch for 2 minutes',
  'Read 2 pages',
  'Write 3 gratitudes',
  'Make your bed',
  'Step outside for fresh air',
  'Do 10 pushups',
  'Meditate for 5 minutes',
  'Review your goals',
  'Smile in the mirror',
  'Text a loved one good morning',
]

// Preset distraction categories
export const DISTRACTION_CATEGORIES = [
  'Social media',
  'News/Reddit',
  'YouTube/Netflix',
  'Video games',
  'Work emails',
  'Phone notifications',
  'Snacking',
  'Online shopping',
]

// Journey milestones
export const ROUTINE_MILESTONES = [
  { day: 1, title: 'Journey Begins', message: "You've taken the first step!" },
  { day: 7, title: 'One Week Strong', message: 'A full week of growth!' },
  { day: 14, title: 'Two Week Champion', message: 'Building momentum!' },
  { day: 21, title: 'Habit Formation', message: 'Science says habits form in 21 days!' },
  { day: 30, title: 'Monthly Master', message: 'A full month of dedication!' },
  { day: 45, title: 'Persistence Pays', message: "You're unstoppable!" },
  { day: 66, title: 'Journey Complete', message: "You've transformed your mornings and evenings!" },
]
