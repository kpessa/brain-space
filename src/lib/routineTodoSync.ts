import { supabase } from '@/lib/supabase'
import type { RoutineEntry } from '@/types/routines'
import type { CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { useTodoStore } from '@/store/todos'
import { logger } from '@/services/logger'

/**
 * Service to sync Routine entries with the unified todo system
 * This ensures that MITs, rituals, and improvement goals are reflected in todos
 */

// Convert routine MIT to todo input
export function routineMITToTodoInput(entry: RoutineEntry): CreateTodoInput | null {
  if (!entry.mit || !entry.mit.trim()) return null
  
  return {
    title: entry.mit,
    description: `Most Important Task for Day ${entry.dayNumber} of 66-day routine`,
    type: 'task',
    status: entry.morningCompleted ? 'completed' : 'pending',
    scheduledDate: entry.date,
    sourceType: 'routine',
    sourceId: entry.id,
    sourceMetadata: {
      routineEntryId: entry.id,
      dayNumber: entry.dayNumber,
      entryDate: entry.date,
      routineType: 'mit',
    },
  }
}

// Convert routine ritual items to todo inputs
export function routineRitualsToTodoInputs(entry: RoutineEntry): CreateTodoInput[] {
  if (!entry.morningRitualPlan || !Array.isArray(entry.morningRitualPlan)) {
    return []
  }
  
  return entry.morningRitualPlan
    .filter(ritual => ritual.trim())
    .map((ritual, index) => ({
      title: ritual,
      description: `Morning ritual item ${index + 1} for Day ${entry.dayNumber}`,
      type: 'ritual' as const,
      status: (entry.ritualCompleted?.[index] ? 'completed' : 'pending') as const,
      scheduledDate: entry.date,
      scheduledTime: entry.wakeIntention,
      sourceType: 'routine' as const,
      sourceId: `${entry.id}:ritual:${index}`,
      sourceMetadata: {
        routineEntryId: entry.id,
        dayNumber: entry.dayNumber,
        entryDate: entry.date,
        ritualIndex: index,
        routineType: 'ritual',
      },
    }))
}

// Convert improvement goal to todo input
export function routineImprovementToTodoInput(entry: RoutineEntry): CreateTodoInput | null {
  if (!entry.onePercentImprovement || !entry.onePercentImprovement.trim()) return null
  
  return {
    title: `1% Improvement: ${entry.onePercentImprovement}`,
    description: `Daily improvement goal for Day ${entry.dayNumber}`,
    type: 'habit',
    status: entry.morningCompleted ? 'completed' : 'pending',
    scheduledDate: entry.date,
    sourceType: 'routine',
    sourceId: `${entry.id}:improvement`,
    sourceMetadata: {
      routineEntryId: entry.id,
      dayNumber: entry.dayNumber,
      entryDate: entry.date,
      routineType: 'improvement',
    },
  }
}

// Sync routine MIT to todos
export async function syncRoutineMITToTodo(
  entry: RoutineEntry,
  userId: string
): Promise<string | null> {
  const todoInput = routineMITToTodoInput(entry)
  if (!todoInput) return null
  
  try {
    // Check if todo already exists
    const { data: existingLink } = await supabase
      .from('routine_todos')
      .select('todo_id')
      .eq('routine_entry_id', entry.id)
      .eq('todo_type', 'mit')
      .single()
    
    if (existingLink) {
      // Update existing todo
      const updates: UpdateTodoInput = {
        title: entry.mit!,
        status: entry.morningCompleted ? 'completed' : 'pending',
      }
      
      await useTodoStore.getState().updateTodo(existingLink.todo_id, updates)
      
      logger.info('ROUTINE_SYNC', 'Updated existing MIT todo', {
        todoId: existingLink.todo_id,
        routineId: entry.id,
      })
      
      return existingLink.todo_id
    } else {
      // Create new todo
      const todo = await useTodoStore.getState().createTodo(userId, todoInput)
      
      if (todo) {
        // Create link
        await supabase.from('routine_todos').insert({
          routine_entry_id: entry.id,
          todo_id: todo.id,
          todo_type: 'mit',
        })
        
        logger.info('ROUTINE_SYNC', 'Created new MIT todo', {
          todoId: todo.id,
          routineId: entry.id,
          mit: entry.mit,
        })
        
        return todo.id
      }
    }
  } catch (error) {
    logger.error('ROUTINE_SYNC', 'Error syncing MIT to todo', {
      routineId: entry.id,
      error,
    })
  }
  
  return null
}

// Sync routine rituals to todos
export async function syncRoutineRitualsToTodos(
  entry: RoutineEntry,
  userId: string
): Promise<void> {
  const ritualInputs = routineRitualsToTodoInputs(entry)
  
  for (const ritualInput of ritualInputs) {
    try {
      const ritualIndex = ritualInput.sourceMetadata?.ritualIndex ?? 0
      
      // Check if todo already exists
      const { data: existingLink } = await supabase
        .from('routine_todos')
        .select('todo_id')
        .eq('routine_entry_id', entry.id)
        .eq('todo_type', 'ritual_item')
        .like('todo_id', `%:ritual:${ritualIndex}`)
        .single()
      
      if (existingLink) {
        // Update existing todo
        const updates: UpdateTodoInput = {
          title: ritualInput.title,
          status: ritualInput.status,
        }
        
        await useTodoStore.getState().updateTodo(existingLink.todo_id, updates)
      } else {
        // Create new todo
        const todo = await useTodoStore.getState().createTodo(userId, ritualInput)
        
        if (todo) {
          await supabase.from('routine_todos').insert({
            routine_entry_id: entry.id,
            todo_id: todo.id,
            todo_type: 'ritual_item',
          })
        }
      }
    } catch (error) {
      logger.error('ROUTINE_SYNC', 'Error syncing ritual to todo', {
        routineId: entry.id,
        ritual: ritualInput.title,
        error,
      })
    }
  }
}

// Sync improvement goal to todos
export async function syncRoutineImprovementToTodo(
  entry: RoutineEntry,
  userId: string
): Promise<string | null> {
  const todoInput = routineImprovementToTodoInput(entry)
  if (!todoInput) return null
  
  try {
    // Check if todo already exists
    const { data: existingLink } = await supabase
      .from('routine_todos')
      .select('todo_id')
      .eq('routine_entry_id', entry.id)
      .eq('todo_type', 'improvement')
      .single()
    
    if (existingLink) {
      // Update existing todo
      const updates: UpdateTodoInput = {
        title: todoInput.title,
        status: entry.morningCompleted ? 'completed' : 'pending',
      }
      
      await useTodoStore.getState().updateTodo(existingLink.todo_id, updates)
      
      return existingLink.todo_id
    } else {
      // Create new todo
      const todo = await useTodoStore.getState().createTodo(userId, todoInput)
      
      if (todo) {
        await supabase.from('routine_todos').insert({
          routine_entry_id: entry.id,
          todo_id: todo.id,
          todo_type: 'improvement',
        })
        
        return todo.id
      }
    }
  } catch (error) {
    logger.error('ROUTINE_SYNC', 'Error syncing improvement to todo', {
      routineId: entry.id,
      error,
    })
  }
  
  return null
}

// Sync all routine items to todos
export async function syncRoutineEntryToTodos(
  entry: RoutineEntry,
  userId: string
): Promise<void> {
  try {
    // Sync MIT
    if (entry.mit) {
      await syncRoutineMITToTodo(entry, userId)
    }
    
    // Sync rituals
    if (entry.morningRitualPlan?.length) {
      await syncRoutineRitualsToTodos(entry, userId)
    }
    
    // Sync improvement goal
    if (entry.onePercentImprovement) {
      await syncRoutineImprovementToTodo(entry, userId)
    }
    
    logger.info('ROUTINE_SYNC', 'Completed routine sync', {
      routineId: entry.id,
      dayNumber: entry.dayNumber,
    })
  } catch (error) {
    logger.error('ROUTINE_SYNC', 'Error syncing routine entry', {
      routineId: entry.id,
      error,
    })
  }
}

// Delete todos for a routine entry
export async function syncRoutineDeletion(entryId: string): Promise<void> {
  try {
    // Find all todos linked to this routine entry
    const { data: links } = await supabase
      .from('routine_todos')
      .select('todo_id')
      .eq('routine_entry_id', entryId)
    
    if (links) {
      for (const link of links) {
        await useTodoStore.getState().deleteTodo(link.todo_id)
      }
      
      logger.info('ROUTINE_SYNC', 'Deleted todos for routine entry', {
        routineId: entryId,
        todoCount: links.length,
      })
    }
  } catch (error) {
    logger.error('ROUTINE_SYNC', 'Error deleting todos for routine', {
      routineId: entryId,
      error,
    })
  }
}