import { useLocation } from 'react-router-dom'
import { useBrainDumpStore } from '@/store/braindump'
import type { BrainDumpNode } from '@/types/braindump'

export interface QuickAddContext {
  page: 'braindump' | 'matrix' | 'timebox' | 'other'
  defaultTimedTask: boolean
  defaultImportance: number
  defaultUrgency: number
  defaultDate?: string
}

export interface QuickAddData {
  label: string
  timeboxDate?: string
  timeboxStartTime?: string
  isTimedTask?: boolean
  importance?: number
  urgency?: number
  category?: string
}

export function useQuickAdd() {
  const location = useLocation()
  const { currentEntry, addNode } = useBrainDumpStore()

  // Detect current context for smart defaults
  const getContext = (): QuickAddContext => {
    const path = location.pathname

    if (path.startsWith('/braindump')) {
      return {
        page: 'braindump',
        defaultTimedTask: false,
        defaultImportance: 5,
        defaultUrgency: 5,
      }
    }

    if (path.startsWith('/matrix')) {
      return {
        page: 'matrix',
        defaultTimedTask: false,
        defaultImportance: 8, // High importance for quick capture
        defaultUrgency: 7,
      }
    }

    if (path.startsWith('/timebox')) {
      const today = new Date().toISOString().split('T')[0]
      return {
        page: 'timebox',
        defaultTimedTask: true,
        defaultImportance: 6,
        defaultUrgency: 6,
        defaultDate: today,
      }
    }

    return {
      page: 'other',
      defaultTimedTask: false,
      defaultImportance: 5,
      defaultUrgency: 5,
    }
  }

  // Add a new task
  const addTask = async (data: QuickAddData) => {
    const context = getContext()
    const nodeId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create the new node
    const newNode: BrainDumpNode = {
      id: nodeId,
      type: 'thought',
      position: { x: 0, y: 0 },
      data: {
        label: data.label.trim(),
        category: data.category || 'tasks',
        importance: data.importance ?? context.defaultImportance,
        urgency: data.urgency ?? context.defaultUrgency,
        layoutMode: 'freeform',
        isCollapsed: false,
        children: [],
        // Timebox properties
        isTimedTask: data.isTimedTask ?? context.defaultTimedTask,
        timeboxDate: data.timeboxDate || context.defaultDate,
        timeboxStartTime: data.timeboxStartTime,
        timeboxDuration: data.isTimedTask ? 60 : undefined, // Default 1 hour
        // Task properties
        taskStatus: 'pending',
        totalAttempts: 0,
        attempts: [],
      },
    }

    // Add to current brain dump or create new one
    if (currentEntry) {
      addNode(newNode)
    } else {
      // Create a new brain dump entry if none exists
      // This would typically create a new brain dump, but for now just add to store
      addNode(newNode)
    }

    return newNode
  }

  return {
    context: getContext(),
    addTask,
  }
}
