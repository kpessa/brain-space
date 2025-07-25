import { useJournalStore } from '@/store/journalStore'
import { useNodesStore } from '@/store/nodeStore'
import { useBrainDumpStore } from '@/store/braindumpStore'
import { useRoutineStore } from '@/store/routineStore'
import { shouldTaskOccurOnDate, isRecurringTaskCompletedForDate } from '@/lib/recurringTasks'
import { format } from 'date-fns'
import type { RecurrencePattern } from '@/types/recurrence'

export interface UnifiedTodo {
  id: string
  title: string
  description?: string
  completed: boolean
  source: 'journal' | 'node' | 'braindump' | 'routine'
  sourceId: string
  dueDate?: string
  priority?: 'high' | 'medium' | 'low'
  urgency?: number
  importance?: number
  tags?: string[]
  createdAt: string
  completedAt?: string
}

export function useUnifiedTodos() {
  const { entries: journalEntries } = useJournalStore()
  const { nodes } = useNodesStore()
  const { entries: brainDumpEntries } = useBrainDumpStore()
  const { currentEntry } = useRoutineStore()

  const getTodos = (): UnifiedTodo[] => {
    const todos: UnifiedTodo[] = []

    // Extract todos from journal entries
    journalEntries.forEach(entry => {
      // Extract daily quest as a todo
      if (entry.dailyQuest && entry.dailyQuest.trim()) {
        todos.push({
          id: `journal-quest-${entry.id}`,
          title: entry.dailyQuest,
          completed: false, // Journal quests don't have completion tracking yet
          source: 'journal',
          sourceId: entry.id,
          createdAt: entry.createdAt,
          priority: 'high', // Daily quests are high priority
        })
      }
    })

    // Extract todos from nodes (tasks, actions, etc.)
    nodes
      .filter(node => node.type === 'task')
      .forEach(node => {
        const priority = getPriorityFromUrgencyImportance(node.urgency, node.importance)
        
        // Handle recurring tasks
        if (node.taskType === 'recurring' || node.taskType === 'habit') {
          // Check if task occurs today
          const today = format(new Date(), 'yyyy-MM-dd')
          if (node.recurrence) {
            const pattern: RecurrencePattern = {
              type: node.recurrence.frequency,
              frequency: node.recurrence.interval,
              daysOfWeek: node.recurrence.daysOfWeek?.map(day => {
                const dayMap: Record<string, number> = {
                  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                  'Thursday': 4, 'Friday': 5, 'Saturday': 6
                }
                return dayMap[day]
              }),
              dayOfMonth: node.recurrence.frequency === 'monthly' ? 
                new Date(node.createdAt || '').getDate() : undefined,
              startDate: node.createdAt?.split('T')[0] || today,
              endDate: node.recurrence.endDate,
            }
            
            if (shouldTaskOccurOnDate(pattern, today)) {
              const isCompleted = isRecurringTaskCompletedForDate(
                node.recurringCompletions,
                today
              )
              
              todos.push({
                id: `node-recurring-${node.id}-${today}`,
                title: node.title || 'Untitled',
                description: node.description,
                completed: isCompleted,
                source: 'node',
                sourceId: node.id,
                dueDate: today,
                urgency: node.urgency,
                importance: node.importance,
                priority,
                tags: [...(node.tags || []), node.taskType],
                createdAt: node.createdAt || today,
                completedAt: isCompleted ? 
                  node.recurringCompletions?.find(c => c.date === today)?.completedAt 
                  : undefined,
              })
            }
          }
        } else {
          // Regular one-time task
          todos.push({
            id: `node-${node.id}`,
            title: node.title || 'Untitled',
            description: node.description,
            completed: node.completed || false,
            source: 'node',
            sourceId: node.id,
            dueDate: typeof node.dueDate === 'object' && node.dueDate?.type === 'exact' 
              ? node.dueDate.date 
              : undefined,
            urgency: node.urgency,
            importance: node.importance,
            priority,
            tags: node.tags,
            createdAt: node.createdAt || new Date().toISOString(),
            completedAt: node.completedAt,
          })
        }
      })

    // Extract todos from brain dump nodes
    brainDumpEntries.forEach(entry => {
      entry.nodes
        .filter(node => 
          node.data.type === 'task' || 
          node.data.category === 'tasks' ||
          node.data.nodeType === 'task'
        )
        .forEach(node => {
          const priority = getPriorityFromUrgencyImportance(
            node.data.urgency,
            node.data.importance
          )
          
          todos.push({
            id: `braindump-${entry.id}-${node.id}`,
            title: node.data.label,
            description: node.data.description,
            completed: false, // Brain dump nodes don't track completion
            source: 'braindump',
            sourceId: entry.id,
            dueDate: node.data.dueDate,
            urgency: node.data.urgency,
            importance: node.data.importance,
            priority,
            tags: node.data.tags || node.data.keywords,
            createdAt: entry.createdAt,
          })
        })
    })

    // Extract todos from current routine entry
    if (currentEntry) {
      // Morning routine todos
      if (!currentEntry.morningCompleted && currentEntry.morningRitualPlan) {
        currentEntry.morningRitualPlan.forEach((ritual, index) => {
          const isCompleted = currentEntry.ritualCompleted?.[index] || false
          if (!isCompleted) {
            todos.push({
              id: `morning-ritual-${index}`,
              title: ritual,
              description: 'Morning ritual',
              completed: isCompleted,
              source: 'routine',
              sourceId: `morning-${currentEntry.id}`,
              priority: 'high',
              createdAt: currentEntry.createdAt,
              dueDate: format(new Date(), 'yyyy-MM-dd'),
            })
          }
        })
      }

      // MIT (Most Important Task)
      if (currentEntry.mit && !currentEntry.morningCompleted) {
        todos.push({
          id: `mit-${currentEntry.id}`,
          title: currentEntry.mit,
          description: 'Most Important Task for today',
          completed: false,
          source: 'routine',
          sourceId: `mit-${currentEntry.id}`,
          priority: 'high',
          createdAt: currentEntry.createdAt,
          dueDate: format(new Date(), 'yyyy-MM-dd'),
          tags: ['MIT'],
        })
      }

      // Evening routine preparation
      if (!currentEntry.eveningCompleted) {
        todos.push({
          id: `evening-routine-${currentEntry.id}`,
          title: 'Complete Evening Routine',
          description: 'Reflect on the day and prepare for tomorrow',
          completed: false,
          source: 'routine',
          sourceId: `evening-${currentEntry.id}`,
          priority: 'medium',
          createdAt: currentEntry.createdAt,
          dueDate: format(new Date(), 'yyyy-MM-dd'),
        })
      }
    }

    return todos
  }

  const getTodosBySource = (source: UnifiedTodo['source']): UnifiedTodo[] => {
    return getTodos().filter(todo => todo.source === source)
  }

  const getTodosByPriority = (priority: UnifiedTodo['priority']): UnifiedTodo[] => {
    return getTodos().filter(todo => todo.priority === priority)
  }

  const getOverdueTodos = (): UnifiedTodo[] => {
    const now = new Date()
    return getTodos().filter(todo => {
      if (!todo.dueDate) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate < now && !todo.completed
    })
  }

  const getTodaysTodos = (): UnifiedTodo[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return getTodos().filter(todo => {
      if (!todo.dueDate) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate >= today && dueDate < tomorrow
    })
  }

  const getUpcomingTodos = (days: number = 7): UnifiedTodo[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const future = new Date(today)
    future.setDate(future.getDate() + days)

    return getTodos().filter(todo => {
      if (!todo.dueDate) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate >= today && dueDate <= future
    })
  }

  return {
    todos: getTodos(),
    getTodosBySource,
    getTodosByPriority,
    getOverdueTodos,
    getTodaysTodos,
    getUpcomingTodos,
  }
}

function getPriorityFromUrgencyImportance(
  urgency?: number,
  importance?: number
): UnifiedTodo['priority'] {
  if (!urgency || !importance) return 'medium'
  
  const score = (urgency + importance) / 2
  
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}