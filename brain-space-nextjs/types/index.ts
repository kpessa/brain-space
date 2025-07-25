// Export all types from a central location
export * from './braindump'
export * from './journal'

// Common types used across the application
export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: string
  updatedAt: string
  
  // Gamification
  level: number
  xp: number
  achievements: string[]
  
  // Preferences
  preferences: UserPreferences
  
  // Subscription/plan info
  plan: 'free' | 'pro' | 'premium'
  planExpiresAt?: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  aiProvider: 'openai' | 'anthropic' | 'google'
  defaultJournalTemplate?: string
  notifications: NotificationSettings
  privacy: PrivacySettings
  
  // Feature preferences
  enableAIEnhancements: boolean
  autoSaveDrafts: boolean
  showProgressTracking: boolean
  
  // UI preferences
  sidebarCollapsed: boolean
  defaultDashboardView: string
  dateFormat: 'US' | 'EU' | 'ISO'
  timeFormat: '12h' | '24h'
}

export interface NotificationSettings {
  journalReminders: boolean
  routineReminders: boolean
  achievementNotifications: boolean
  weeklyProgress: boolean
  emailDigest: boolean
  
  // Timing
  journalReminderTime: string // HH:mm format
  routineReminderTimes: {
    morning: string
    evening: string
  }
}

export interface PrivacySettings {
  shareProgress: boolean
  allowAnalytics: boolean
  dataRetention: '1year' | '2years' | 'forever'
  exportData: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Common utility types
export interface TimeRange {
  start: string // ISO string
  end: string // ISO string
}

export interface Coordinates {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

// Error types
export interface AppError {
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server_error' | 'network_error'
  message: string
  code?: string
  field?: string // For validation errors
  details?: any
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  error: string | null
  lastUpdated?: string
}

// Toast/notification types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Form types
export interface FormField<T = any> {
  value: T
  error?: string
  touched: boolean
  required?: boolean
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>
  }
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

// Search and filter types
export interface SearchFilters {
  query?: string
  dateRange?: TimeRange
  categories?: string[]
  tags?: string[]
  status?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface SearchResult<T> {
  items: T[]
  total: number
  filters: SearchFilters
  facets?: Record<string, Array<{ value: string; count: number }>>
}