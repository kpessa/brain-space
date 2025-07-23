// Unified Todo System Types

// Enum types matching the database
export type TodoType = 'task' | 'quest' | 'ritual' | 'habit' | 'routine_item' | 'gratitude_action'
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'deferred' | 'cancelled'
export type TodoSourceType = 'braindump' | 'journal' | 'routine' | 'manual' | 'recurring'
export type RecurrencePatternType = 'daily' | 'weekly' | 'monthly' | 'custom'
export type AttemptOutcome = 'success' | 'partial' | 'failed' | 'blocked'
export type CompletionQuality = 'great' | 'good' | 'okay' | 'poor'
export type RelationshipType = 'subtask' | 'blocks' | 'related' | 'depends_on'
export type LogicType = 'AND' | 'OR' | 'NONE'
export type TagCategory = 'context' | 'project' | 'area' | 'energy' | 'time'
export type EisenhowerQuadrant = 'do-first' | 'schedule' | 'delegate' | 'eliminate'

// Main Todo interface
export interface Todo {
  id: string
  userId: string

  // Core fields
  title: string
  description?: string
  type: TodoType
  status: TodoStatus

  // Priority fields (0-10 scale)
  priorityImportance?: number
  priorityUrgency?: number

  // Scheduling fields
  dueDate?: string // ISO date string
  scheduledDate?: string // ISO date string
  scheduledTime?: string // HH:MM format
  scheduledDuration?: number // minutes

  // Hierarchy
  parentId?: string
  position?: number

  // Source tracking
  sourceType: TodoSourceType
  sourceId?: string
  sourceMetadata?: Record<string, any>

  // Completion tracking
  completedAt?: string // ISO timestamp
  completionNotes?: string

  // Metadata
  createdAt: string
  updatedAt: string

  // Computed field
  eisenhowerQuadrant?: EisenhowerQuadrant

  // Relations (populated by queries)
  recurrence?: TodoRecurrence
  completions?: TodoCompletion[]
  attempts?: TodoAttempt[]
  relationships?: TodoRelationship[]
  tags?: TodoTag[]
  children?: Todo[]
}

// Recurrence pattern configuration
export interface RecurrencePatternConfig {
  frequency?: number // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[] // 0-6 for weekly patterns
  dayOfMonth?: number // for monthly patterns
  customCron?: string // for complex patterns
}

// Todo Recurrence
export interface TodoRecurrence {
  id: string
  todoId: string

  patternType: RecurrencePatternType
  patternConfig: RecurrencePatternConfig

  startDate: string
  endDate?: string

  nextOccurrenceDate?: string
  lastGeneratedDate?: string

  // Habit tracking
  isHabit: boolean
  currentStreak: number
  longestStreak: number

  createdAt: string
  updatedAt: string
}

// Todo Completion (for recurring tasks)
export interface TodoCompletion {
  id: string
  todoId: string

  completionDate: string // YYYY-MM-DD
  completedAt: string // ISO timestamp

  quality?: CompletionQuality
  durationMinutes?: number
  notes?: string

  streakCount?: number

  createdAt: string
}

// Todo Attempt
export interface TodoAttempt {
  id: string
  todoId: string

  attemptDate: string // YYYY-MM-DD
  startedAt: string // ISO timestamp

  outcome: AttemptOutcome
  durationMinutes?: number
  notes?: string
  nextAction?: string

  createdAt: string
}

// Todo Relationship
export interface TodoRelationship {
  id: string

  parentTodoId: string
  childTodoId: string

  relationshipType: RelationshipType
  logicType?: LogicType
  isOptional?: boolean

  createdAt: string
}

// Todo Tag
export interface TodoTag {
  id: string
  todoId: string

  tagName: string
  tagCategory?: TagCategory

  createdAt: string
}

// Integration link types
export interface BraindumpTodo {
  braindumpId: string
  nodeId: string
  todoId: string
  createdAt: string
}

export interface JournalTodo {
  journalEntryId: string
  todoId: string
  todoType: string // 'daily_quest', 'gratitude_action', etc.
  createdAt: string
}

export interface RoutineTodo {
  routineEntryId: string
  todoId: string
  todoType: string // 'ritual_item', 'mit', 'improvement', etc.
  createdAt: string
}

// Helper types for creating/updating todos
export interface CreateTodoInput {
  title: string
  description?: string
  type?: TodoType
  status?: TodoStatus
  priorityImportance?: number
  priorityUrgency?: number
  dueDate?: string
  scheduledDate?: string
  scheduledTime?: string
  scheduledDuration?: number
  parentId?: string
  sourceType?: TodoSourceType
  sourceId?: string
  sourceMetadata?: Record<string, any>
  tags?: string[]
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  type?: TodoType
  status?: TodoStatus
  priorityImportance?: number
  priorityUrgency?: number
  dueDate?: string
  scheduledDate?: string
  scheduledTime?: string
  scheduledDuration?: number
  completedAt?: string
  completionNotes?: string
}

// View/Filter types
export interface TodoFilter {
  status?: TodoStatus[]
  type?: TodoType[]
  eisenhowerQuadrant?: EisenhowerQuadrant[]
  tags?: string[]
  scheduledDate?: string
  dueDate?: string
  parentId?: string | null // null means top-level only
  sourceType?: TodoSourceType[]
  hasRecurrence?: boolean
  searchQuery?: string
}

export interface TodoSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'scheduledDate' | 'priority' | 'title'
  direction: 'asc' | 'desc'
}

// Recurring instance for UI display
export interface TodoInstance {
  todo: Todo
  instanceDate: string
  isCompleted: boolean
  completion?: TodoCompletion
}

// Stats and analytics
export interface TodoStats {
  totalTodos: number
  completedTodos: number
  pendingTodos: number
  overdueCount: number
  todayCount: number
  weekCount: number

  byType: Record<TodoType, number>
  byQuadrant: Record<EisenhowerQuadrant, number>

  habitsActive: number
  averageCompletionTime: number // hours
  streakData: {
    currentStreak: number
    longestStreak: number
  }
}

// Helper functions
export function getQuadrantFromPriority(importance?: number, urgency?: number): EisenhowerQuadrant {
  if (importance === undefined || urgency === undefined) {
    return 'eliminate'
  }

  if (importance >= 5 && urgency >= 5) return 'do-first'
  if (importance >= 5 && urgency < 5) return 'schedule'
  if (importance < 5 && urgency >= 5) return 'delegate'
  return 'eliminate'
}

export function getQuadrantInfo(quadrant: EisenhowerQuadrant) {
  const quadrantMap = {
    'do-first': {
      label: 'Do First',
      description: 'Important & Urgent',
      icon: '🔥',
      color: 'bg-red-50 border-red-200 text-red-900',
    },
    schedule: {
      label: 'Schedule',
      description: 'Important, Not Urgent',
      icon: '📅',
      color: 'bg-blue-50 border-blue-200 text-blue-900',
    },
    delegate: {
      label: 'Delegate',
      description: 'Urgent, Not Important',
      icon: '👥',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    },
    eliminate: {
      label: 'Eliminate',
      description: 'Not Important or Urgent',
      icon: '🗑️',
      color: 'bg-gray-50 border-gray-200 text-gray-900',
    },
  }

  return quadrantMap[quadrant]
}

// Type guards
export function isTodo(obj: any): obj is Todo {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string'
}

export function isRecurringTodo(todo: Todo): boolean {
  return todo.recurrence !== undefined && todo.recurrence !== null
}

export function isHabit(todo: Todo): boolean {
  return todo.type === 'habit' || (todo.recurrence?.isHabit ?? false)
}
