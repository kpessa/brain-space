import { useLocation } from 'react-router-dom'
import { useNodesStore } from '@/store/nodes'
import type { Node } from '@/types/node'

export interface QuickAddContext {
  page: 'nodes' | 'matrix' | 'timebox' | 'braindump' | 'other'
  defaultScheduled: boolean
  defaultImportance: number
  defaultUrgency: number
  defaultDate?: string
}

export interface QuickAddNodeData {
  type: 'thought' | 'category' | 'goal' | 'project' | 'task' | 'option' | 'idea' | 'question' | 'problem' | 'insight' | 'concern'
  text?: string // For thoughts
  name?: string // For categories
  category?: string
  urgency?: number
  importance?: number
  reasoning?: string
  dueDate?: string
  scheduledTime?: string
  confidence?: number // For categories
  // AI-enhanced fields
  title?: string
  description?: string
  aliases?: string[]
  tags?: string[]
  priority?: number
  children?: string[]
  logicType?: 'AND' | 'OR'
  recurrence?: any
  completed?: boolean
}

export function useQuickAdd() {
  const location = useLocation()
  const { createNode } = useNodesStore()

  // Detect current context for smart defaults
  const getContext = (): QuickAddContext => {
    const path = location.pathname

    if (path.startsWith('/nodes')) {
      return {
        page: 'nodes',
        defaultScheduled: false,
        defaultImportance: 5,
        defaultUrgency: 5,
      }
    }

    if (path.startsWith('/braindump')) {
      return {
        page: 'braindump',
        defaultScheduled: false,
        defaultImportance: 5,
        defaultUrgency: 5,
      }
    }

    if (path.startsWith('/matrix')) {
      return {
        page: 'matrix',
        defaultScheduled: false,
        defaultImportance: 8, // High importance for quick capture
        defaultUrgency: 7,
      }
    }

    if (path.startsWith('/timebox')) {
      const today = new Date().toISOString().split('T')[0]
      return {
        page: 'timebox',
        defaultScheduled: true,
        defaultImportance: 6,
        defaultUrgency: 6,
        defaultDate: today,
      }
    }

    return {
      page: 'other',
      defaultScheduled: false,
      defaultImportance: 5,
      defaultUrgency: 5,
    }
  }

  // Add a new node
  const addNode = async (data: QuickAddNodeData) => {
    if (data.type === 'category') {
      throw new Error('Category creation not yet implemented')
    }

    // Create a proper Node object for Firebase
    const newNode: Partial<Node> = {
      type: data.type || 'thought',
      data: {
        title: data.title || data.text || '',
        description: data.description || data.reasoning || data.text || '',
        tags: data.tags || [data.category || 'general'],
        aliases: data.aliases || [],
        priority: data.priority || 5,
        urgency: data.urgency || 5,
        importance: data.importance || 5,
        dueDate: data.dueDate ? { date: data.dueDate, time: data.scheduledTime } : undefined,
        children: data.children || [],
        logicType: data.logicType,
        recurrence: data.recurrence,
        completed: data.completed || false,
      },
      ui: {
        position: { x: 0, y: 0 },
        collapsed: false,
      },
    }

    // Create node in Firebase
    const createdNode = await createNode(newNode)
    return createdNode
  }

  return {
    context: getContext(),
    addNode,
  }
}
