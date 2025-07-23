import { supabase } from '@/lib/supabase'
import type { BrainDumpNode } from '@/types/braindump'
import { logger } from '@/services/logger'

/**
 * Direct migration functions that bypass the store and use raw Supabase operations
 * This helps avoid any store initialization or transformation issues
 */

export async function directMigrateBrainDump(userId: string): Promise<{
  success: number
  errors: string[]
}> {
  const errors: string[] = []
  let success = 0

  try {
    // Get all brain dumps for user
    const { data: dumps, error: dumpError } = await supabase
      .from('brain_dumps')
      .select('*')
      .eq('user_id', userId)

    if (dumpError) {
      errors.push(`Failed to fetch brain dumps: ${dumpError.message}`)
      return { success, errors }
    }

    if (!dumps || dumps.length === 0) {
      return { success, errors }
    }

    // Process each brain dump
    for (const dump of dumps) {
      const nodes = dump.nodes as BrainDumpNode[]
      
      for (const node of nodes) {
        // Only process task-like nodes
        if (node.type !== 'thought') continue
        
        const hasTaskIndicators = 
          node.data.taskStatus ||
          node.data.importance !== undefined ||
          node.data.urgency !== undefined ||
          node.data.category === 'tasks' ||
          node.data.dueDate ||
          node.data.timeboxDate

        if (!hasTaskIndicators) continue

        try {
          // Check if todo already exists
          const { data: existingLink } = await supabase
            .from('braindump_todos')
            .select('todo_id')
            .eq('braindump_id', dump.id)
            .eq('node_id', node.id)
            .single()

          if (existingLink) {
            logger.info('MIGRATION', 'Todo already exists for node', { nodeId: node.id })
            continue
          }

          // Create todo with direct insert
          const todoData = {
            user_id: userId,
            title: node.data.label || 'Untitled Task',
            description: node.data.originalText || null,
            type: node.data.taskType === 'habit' ? 'habit' : 'task',
            status: mapNodeStatus(node.data.taskStatus),
            priority_importance: node.data.importance ?? 3,
            priority_urgency: node.data.urgency ?? 3,
            due_date: node.data.dueDate || null,
            scheduled_date: node.data.timeboxDate || null,
            scheduled_time: node.data.timeboxStartTime || null,
            scheduled_duration: node.data.timeboxDuration || null,
            source_type: 'braindump',
            source_id: `${dump.id}:${node.id}`,
            source_metadata: {
              nodeId: node.id,
              braindumpId: dump.id,
              braindumpTitle: dump.title,
              category: node.data.category,
            },
          }

          const { data: todo, error: todoError } = await supabase
            .from('todos')
            .insert(todoData)
            .select('id')
            .single()

          if (todoError) {
            errors.push(`Node ${node.id}: ${todoError.message}`)
            logger.error('MIGRATION', 'Failed to create todo', { 
              nodeId: node.id, 
              error: todoError,
              todoData 
            })
            continue
          }

          if (!todo) {
            errors.push(`Node ${node.id}: No todo returned from insert`)
            continue
          }

          // Create link
          const { error: linkError } = await supabase
            .from('braindump_todos')
            .insert({
              braindump_id: dump.id,
              node_id: node.id,
              todo_id: todo.id,
            })

          if (linkError) {
            errors.push(`Failed to link todo ${todo.id}: ${linkError.message}`)
            // Try to clean up the todo
            await supabase.from('todos').delete().eq('id', todo.id)
          } else {
            success++
            logger.info('MIGRATION', 'Successfully migrated node', { 
              nodeId: node.id, 
              todoId: todo.id 
            })
          }

        } catch (err: any) {
          errors.push(`Node ${node.id}: ${err.message || err}`)
          logger.error('MIGRATION', 'Error processing node', { 
            nodeId: node.id, 
            error: err 
          })
        }
      }
    }

  } catch (err: any) {
    errors.push(`General error: ${err.message || err}`)
    logger.error('MIGRATION', 'General migration error', { error: err })
  }

  return { success, errors }
}

function mapNodeStatus(nodeStatus?: string): string {
  switch (nodeStatus) {
    case 'completed': return 'completed'
    case 'in-progress': return 'in_progress'
    case 'deferred': return 'deferred'
    default: return 'pending'
  }
}

export async function directMigrateJournal(userId: string): Promise<{
  success: number
  errors: string[]
}> {
  const errors: string[] = []
  let success = 0

  try {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .not('daily_quest', 'is', null)

    if (error) {
      errors.push(`Failed to fetch journal entries: ${error.message}`)
      return { success, errors }
    }

    for (const entry of entries || []) {
      if (!entry.daily_quest || !entry.daily_quest.trim()) continue

      try {
        // Check if already migrated
        const { data: existingLink } = await supabase
          .from('journal_todos')
          .select('todo_id')
          .eq('journal_entry_id', entry.id)
          .eq('todo_type', 'daily_quest')
          .single()

        if (existingLink) continue

        const { data: todo, error: todoError } = await supabase
          .from('todos')
          .insert({
            user_id: userId,
            title: entry.daily_quest,
            description: `Daily quest from journal entry on ${new Date(entry.date).toLocaleDateString()}`,
            type: 'quest',
            status: 'completed', // Historical entries are completed
            scheduled_date: entry.date,
            source_type: 'journal',
            source_id: entry.id,
            source_metadata: {
              journalEntryId: entry.id,
              entryDate: entry.date,
              xpEarned: entry.xp_earned,
            },
            completed_at: entry.date,
            priority_importance: 3,
            priority_urgency: 3,
          })
          .select('id')
          .single()

        if (todoError || !todo) {
          errors.push(`Journal ${entry.id}: ${todoError?.message || 'No todo returned'}`)
          continue
        }

        await supabase.from('journal_todos').insert({
          journal_entry_id: entry.id,
          todo_id: todo.id,
          todo_type: 'daily_quest',
        })

        success++
      } catch (err: any) {
        errors.push(`Journal ${entry.id}: ${err.message || err}`)
      }
    }
  } catch (err: any) {
    errors.push(`General error: ${err.message || err}`)
  }

  return { success, errors }
}

export async function directMigrateRoutines(userId: string): Promise<{
  success: number
  errors: string[]
}> {
  const errors: string[] = []
  let success = 0

  try {
    const { data: entries, error } = await supabase
      .from('routine_entries')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      errors.push(`Failed to fetch routine entries: ${error.message}`)
      return { success, errors }
    }

    for (const entry of entries || []) {
      // Migrate MIT
      if (entry.mit && entry.mit.trim()) {
        try {
          const { data: todo, error: todoError } = await supabase
            .from('todos')
            .insert({
              user_id: userId,
              title: entry.mit,
              description: `Most Important Task for Day ${entry.day_number}`,
              type: 'task',
              status: entry.morning_completed ? 'completed' : 'pending',
              scheduled_date: entry.date,
              source_type: 'routine',
              source_id: entry.id,
              source_metadata: {
                routineEntryId: entry.id,
                dayNumber: entry.day_number,
                routineType: 'mit',
              },
              completed_at: entry.morning_completed ? entry.date : null,
              priority_importance: 5,
              priority_urgency: 5,
            })
            .select('id')
            .single()

          if (todo && !todoError) {
            await supabase.from('routine_todos').insert({
              routine_entry_id: entry.id,
              todo_id: todo.id,
              todo_type: 'mit',
            })
            success++
          }
        } catch (err: any) {
          errors.push(`Routine MIT ${entry.id}: ${err.message || err}`)
        }
      }
    }
  } catch (err: any) {
    errors.push(`General error: ${err.message || err}`)
  }

  return { success, errors }
}

export async function runDirectMigration(userId: string): Promise<{
  summary: {
    braindumps: { success: number; errors: string[] }
    journal: { success: number; errors: string[] }
    routines: { success: number; errors: string[] }
  }
}> {
  logger.info('MIGRATION', 'Starting direct migration', { userId })

  const [braindumps, journal, routines] = await Promise.all([
    directMigrateBrainDump(userId),
    directMigrateJournal(userId),
    directMigrateRoutines(userId),
  ])

  const summary = {
    braindumps,
    journal,
    routines,
  }

  logger.info('MIGRATION', 'Direct migration complete', { 
    userId,
    summary: {
      braindumps: braindumps.success,
      journal: journal.success,
      routines: routines.success,
      totalErrors: braindumps.errors.length + journal.errors.length + routines.errors.length,
    }
  })

  return { summary }
}