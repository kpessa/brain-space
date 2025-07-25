import type { Node, Edge } from '@xyflow/react'

export interface BrainDumpEntry {
  id: string
  userId: string
  title: string
  rawText: string
  createdAt: string
  updatedAt: string
  nodes: BrainDumpNode[]
  edges: BrainDumpEdge[]
  categories: Category[]
  parentBrainDumpId?: string // ID of parent brain dump if created from a node
  originNodeId?: string // ID of the node this was created from
  originNodeType?: string // Original type of the node before conversion to root
  originalParentNodeId?: string // ID of the parent node that the origin node was connected to
  topicFocus?: string // The topic/label of the originating node
  type?: 'general' | 'topic-focused' // To distinguish brain dump types
}

export interface NodeStyle {
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  borderWidth?: number
  icon?: string
}

// Recurrence pattern for recurring tasks and habits
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  frequency?: number // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[] // for weekly (0-6, Sunday-Saturday)
  dayOfMonth?: number // for monthly
  customCron?: string // for complex patterns
  startDate: string
  endDate?: string // optional end date
}

// Completion record for recurring tasks
export interface RecurringCompletion {
  date: string // YYYY-MM-DD
  completedAt: string // ISO timestamp
  duration?: number // minutes
  notes?: string
  quality?: 'great' | 'good' | 'okay' | 'poor' // for habits
}

export interface BrainDumpNode extends Node {
  width?: number
  height?: number
  data: {
    label: string
    category?: string
    isCollapsed?: boolean
    children?: string[]
    parentId?: string
    originalText?: string
    aiGenerated?: boolean
    style?: NodeStyle
    isLink?: boolean
    linkedBrainDumpId?: string
    layoutMode?: 'horizontal' | 'freeform'
    isGhost?: boolean // True if this is a reference to another node
    referencedNodeId?: string // ID of the original node this ghost references
    synonyms?: string[] // Alternative names/aliases for this node
    isInstance?: boolean // True if this is an instance of a prototype
    prototypeId?: string // ID of the prototype node (for instances)
    instances?: string[] // IDs of instance nodes (for prototypes)
    hasTopicBrainDump?: boolean // True if this node has an associated topic brain dump
    topicBrainDumpId?: string // ID of the associated topic brain dump
    importance?: number // Importance value (0-10 scale, stored as log value)
    urgency?: number // Urgency value (0-10 scale, stored as log value)
    priorityMode?: 'simple' | 'advanced' // Priority input mode (default: 'simple')
    dueDate?: string // ISO date string for task due date
    dueDateMode?: 'none' | 'specific' | 'relative' // Due date input mode
    autoUrgencyFromDueDate?: boolean // Auto-calculate urgency from due date
    timeboxStartTime?: string // ISO timestamp for when task is scheduled
    timeboxDuration?: number // Duration in minutes
    timeboxDate?: string // Date for the timebox (YYYY-MM-DD format)
    isTimedTask?: boolean // Flag to indicate this is a scheduled task
    // Task completion tracking
    taskStatus?: 'pending' | 'in-progress' | 'completed' | 'deferred'
    completedAt?: string // ISO timestamp
    attempts?: Array<{
      id: string
      timestamp: string
      duration?: number
      notes?: string
      outcome: 'success' | 'partial' | 'failed' | 'blocked'
      nextAction?: string
    }>
    totalAttempts?: number
    // Subtask support
    subtasks?: string[] // Array of child task node IDs
    parentTaskId?: string // ID of parent task (if this is a subtask)
    subtaskProgress?: { completed: number; total: number } // Track subtask completion
    subtaskLogic?: 'AND' | 'OR' | 'NONE' // How subtasks relate to parent completion (default: 'NONE')
    isOptional?: boolean // Whether this subtask is optional for parent completion
    autoCompleteParent?: boolean // Whether completing this task should auto-complete parent (for OR logic)

    // Recurring task support
    taskType?: 'one-time' | 'recurring' | 'habit' // Default to 'one-time' for backward compatibility
    recurrencePattern?: RecurrencePattern
    recurringCompletions?: RecurringCompletion[] // History of completions for recurring tasks
    currentStreak?: number // For habits
    longestStreak?: number // For habits
    lastRecurringCompletionDate?: string // YYYY-MM-DD format
  }
}

export interface BrainDumpEdge extends Edge {
  animated?: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  description?: string
  nodeCount: number
}

export interface ProcessedThought {
  id: string
  text: string
  category: string
  confidence: number
  relatedThoughts: string[]
  // Additional fields from AI
  keywords?: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  urgency?: number // 1-10 scale for detailed priority
  importance?: number // 1-10 scale for detailed priority
  urgencyLevel?: 'low' | 'medium' | 'high' // For simpler categorization
  importanceLevel?: 'low' | 'medium' | 'high' // For simpler categorization
  dueDate?: string // ISO date string
  reasoning?: string // AI's reasoning
  nodeType?: string // For firebase integration
  metadata?: Record<string, any> // For firebase integration
}

export interface BrainDumpProcessingResult {
  thoughts: ProcessedThought[]
  categories: Category[]
  suggestedLayout: 'tree' | 'radial' | 'force'
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'ideas', name: 'Ideas', color: '#3b82f6', nodeCount: 0 },
  { id: 'tasks', name: 'Tasks', color: '#10b981', nodeCount: 0 },
  { id: 'questions', name: 'Questions', color: '#f59e0b', nodeCount: 0 },
  { id: 'insights', name: 'Insights', color: '#8b5cf6', nodeCount: 0 },
  { id: 'problems', name: 'Problems', color: '#ef4444', nodeCount: 0 },
  { id: 'misc', name: 'Miscellaneous', color: '#6b7280', nodeCount: 0 },
]

export const NODE_TYPES = {
  category: 'category',
  thought: 'thought',
  root: 'root',
  ghost: 'ghost',
  link: 'link',
} as const

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES]
