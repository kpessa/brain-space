import { supabase } from '@/lib/supabase'
import type { BrainDumpNode } from '@/types/braindump'
import type { CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { useTodoStore } from '@/store/todos'
import { logger } from '@/services/logger'

/**
 * Service to sync BrainDump nodes with the unified todo system
 * This ensures that task-like nodes are automatically reflected in todos
 */

// Check if a node should be synced as a todo
export function shouldSyncAsTodo(node: BrainDumpNode): boolean {
  if (node.type !== 'thought') return false

  const data = node.data
  return !!(
    data.taskStatus ||
    data.importance !== undefined ||
    data.urgency !== undefined ||
    data.category === 'tasks' ||
    data.dueDate ||
    data.timeboxDate
  )
}

// Convert a BrainDump node to todo input
export function nodeToTodoInput(node: BrainDumpNode, braindumpId: string): CreateTodoInput {
  const data = node.data

  return {
    title: data.label,
    description: data.originalText,
    type: data.taskType === 'habit' ? 'habit' : 'task',
    status: convertNodeStatusToTodoStatus(data.taskStatus),
    priorityImportance: data.importance,
    priorityUrgency: data.urgency,
    dueDate: data.dueDate,
    scheduledDate: data.timeboxDate,
    scheduledTime: data.timeboxStartTime,
    scheduledDuration: data.timeboxDuration,
    sourceType: 'braindump',
    sourceId: `${braindumpId}:${node.id}`,
    sourceMetadata: {
      nodeId: node.id,
      braindumpId,
      category: data.category,
      aiGenerated: data.aiGenerated,
    },
  }
}

// Convert node status to todo status
function convertNodeStatusToTodoStatus(nodeStatus?: string): CreateTodoInput['status'] {
  switch (nodeStatus) {
    case 'completed':
      return 'completed'
    case 'in-progress':
      return 'in_progress'
    case 'deferred':
      return 'deferred'
    default:
      return 'pending'
  }
}

// Sync a single node to todos
export async function syncNodeToTodo(
  node: BrainDumpNode,
  braindumpId: string,
  userId: string
): Promise<string | null> {
  if (!shouldSyncAsTodo(node)) return null

  try {
    // Check if todo already exists for this node
    const { data: existingLink } = await supabase
      .from('braindump_todos')
      .select('todo_id')
      .eq('braindump_id', braindumpId)
      .eq('node_id', node.id)
      .single()

    if (existingLink) {
      // Update existing todo
      const updates: UpdateTodoInput = {
        title: node.data.label,
        description: node.data.originalText,
        status: convertNodeStatusToTodoStatus(node.data.taskStatus),
        priorityImportance: node.data.importance,
        priorityUrgency: node.data.urgency,
        dueDate: node.data.dueDate,
        scheduledDate: node.data.timeboxDate,
        scheduledTime: node.data.timeboxStartTime,
        scheduledDuration: node.data.timeboxDuration,
      }

      if (node.data.completedAt) {
        updates.completedAt = node.data.completedAt
      }

      await useTodoStore.getState().updateTodo(existingLink.todo_id, updates)

      logger.info('SYNC', 'Updated existing todo', {
        todoId: existingLink.todo_id,
        nodeId: node.id,
      })

      return existingLink.todo_id
    } else {
      // Create new todo
      const todoInput = nodeToTodoInput(node, braindumpId)
      const todo = await useTodoStore.getState().createTodo(userId, todoInput)

      if (todo) {
        // Create link
        await supabase.from('braindump_todos').insert({
          braindump_id: braindumpId,
          node_id: node.id,
          todo_id: todo.id,
        })

        // Handle completion time if already completed
        if (node.data.completedAt && node.data.taskStatus === 'completed') {
          await useTodoStore.getState().updateTodo(todo.id, {
            completedAt: node.data.completedAt,
          })
        }

        // Handle attempts
        if (node.data.attempts?.length) {
          for (const attempt of node.data.attempts) {
            await useTodoStore.getState().recordAttempt(todo.id, {
              attemptDate: new Date(attempt.timestamp).toISOString().split('T')[0],
              startedAt: attempt.timestamp,
              outcome: attempt.outcome,
              durationMinutes: attempt.duration,
              notes: attempt.notes,
              nextAction: attempt.nextAction,
            })
          }
        }

        // Handle recurrence
        if (node.data.recurrencePattern) {
          await useTodoStore.getState().makeRecurring(todo.id, node.data.recurrencePattern.type, {
            frequency: node.data.recurrencePattern.frequency,
            daysOfWeek: node.data.recurrencePattern.daysOfWeek,
            dayOfMonth: node.data.recurrencePattern.dayOfMonth,
            customCron: node.data.recurrencePattern.customCron,
          })
        }

        logger.info('SYNC', 'Created new todo', {
          todoId: todo.id,
          nodeId: node.id,
        })

        return todo.id
      }
    }
  } catch (error) {
    logger.error('SYNC', 'Error syncing node to todo', {
      nodeId: node.id,
      error,
    })
  }

  return null
}

// Sync node deletion
export async function syncNodeDeletion(nodeId: string, braindumpId: string): Promise<void> {
  try {
    // Find and delete associated todo
    const { data: link } = await supabase
      .from('braindump_todos')
      .select('todo_id')
      .eq('braindump_id', braindumpId)
      .eq('node_id', nodeId)
      .single()

    if (link) {
      await useTodoStore.getState().deleteTodo(link.todo_id)
      logger.info('SYNC', 'Deleted todo for removed node', {
        todoId: link.todo_id,
        nodeId,
      })
    }
  } catch (error) {
    logger.error('SYNC', 'Error deleting todo for node', {
      nodeId,
      error,
    })
  }
}

// Sync parent-child relationships
export async function syncNodeRelationships(
  edges: Array<{ source: string; target: string }>,
  braindumpId: string
): Promise<void> {
  try {
    // Get all todo links for this braindump
    const { data: links } = await supabase
      .from('braindump_todos')
      .select('node_id, todo_id')
      .eq('braindump_id', braindumpId)

    if (!links) return

    // Create a map of node IDs to todo IDs
    const nodeToTodoMap = new Map(links.map(link => [link.node_id, link.todo_id]))

    // Update parent-child relationships
    for (const edge of edges) {
      const parentTodoId = nodeToTodoMap.get(edge.source)
      const childTodoId = nodeToTodoMap.get(edge.target)

      if (parentTodoId && childTodoId) {
        await useTodoStore.getState().moveToParent(childTodoId, parentTodoId)
      }
    }

    logger.info('SYNC', 'Synced node relationships', {
      braindumpId,
      relationshipCount: edges.length,
    })
  } catch (error) {
    logger.error('SYNC', 'Error syncing relationships', {
      braindumpId,
      error,
    })
  }
}

// Batch sync all nodes in a brain dump
export async function syncBrainDumpToTodos(
  nodes: BrainDumpNode[],
  edges: Array<{ source: string; target: string }>,
  braindumpId: string,
  userId: string
): Promise<void> {
  try {
    // Sync each node
    for (const node of nodes) {
      await syncNodeToTodo(node, braindumpId, userId)
    }

    // Sync relationships
    await syncNodeRelationships(edges, braindumpId)

    logger.info('SYNC', 'Completed brain dump sync', {
      braindumpId,
      nodeCount: nodes.length,
    })
  } catch (error) {
    logger.error('SYNC', 'Error syncing brain dump', {
      braindumpId,
      error,
    })
  }
}
