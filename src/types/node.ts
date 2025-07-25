// Flexible Node type definition with optional fields and aliasing support

export type LogicType = 'AND' | 'OR'

export interface Attempt {
  id: string
  description: string
  timestamp: string // ISO date
}

export type RelativeUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months'

export type DueDate =
  | { type: 'exact'; date: string } // ISO date string
  | { type: 'relative'; offset: number; unit: RelativeUnit } // e.g., 3 days from now

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  timesPerInterval?: number // e.g., 2 times per day or 4 times per week
  timesOfDay?: string[] // e.g., ["08:00", "18:00"]
  daysOfWeek?: (
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday'
  )[] // for weekly
  interval?: number // for custom intervals
  unit?: RelativeUnit // used with interval if frequency is "custom"
  repeatCount?: number // optional, how many times to repeat
  endDate?: string // optional ISO date for when recurrence should stop
}

type NodeType = "goal" | "project" | "task" | "option" | "idea" | "question" | "problem" | "insight" | "thought" | "concern";

// AI-focused input type for GenAI - excludes system-managed fields
export type GenAiNodeInput = {
  title?: string
  description?: string
  aliases?: string[]
  type?: NodeType
  tags?: string[]
  urgency?: number
  importance?: number
  priority?: number // optional: can be computed later
  children?: string[] // references by title
  logicType?: LogicType
  attempts?: Omit<Attempt, 'id'>[] // id can be generated by system
  dueDate?: DueDate
  recurrence?: Recurrence
  completed?: boolean
}

export interface Node {
  id: string
  userId: string // Foreign key to user
  generatedById?: string // Optional foreign key to route or page where node was generated
  lastUpdatedBy?: string // Optional foreign key to user who last updated the node

  title?: string
  description?: string

  // Aliases (optional)
  aliases?: string[]

  // Node classification (optional)
  type?: NodeType
  tags?: string[]

  // Eisenhower matrix (optional)
  urgency?: number
  importance?: number
  priority?: number // computed from urgency + importance

  // ReactFlow-related data (optional)
  reactFlow?: {
    position?: {
      x: number
      y: number
    }
    size?: {
      width: number
      height: number
    }
  }

  // Children logic (optional)
  children?: string[]
  logicType?: LogicType

  // Attempts (optional)
  attempts?: Attempt[]

  // Due date (optional)
  dueDate?: DueDate

  // Recurrence (optional)
  recurrence?: Recurrence

  // Metadata (optional)
  completed?: boolean
  createdAt?: string
  updatedAt?: string
}
