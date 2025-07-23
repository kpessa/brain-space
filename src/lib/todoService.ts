import { supabase } from '@/lib/supabase'
import type { BrainDumpNode } from '@/types/braindump'
import type { JournalEntry } from '@/types/journal'
import type { RoutineEntry } from '@/types/routines'
import type { CreateTodoInput, Todo, TodoType, TodoSourceType } from '@/types/todo'
import { getQuadrantFromPriority } from '@/types/todo'

/**
 * Service functions for todo migration and integration
 */

// Convert a BrainDump node to a Todo
export function convertBrainDumpNodeToTodo(
  node: BrainDumpNode,
  userId: string,
  braindumpId: string
): CreateTodoInput | null {
  // Null safety check for node and node.data
  if (!node || !node.data) {
    return null
  }

  // Only convert thought nodes that look like tasks
  if (
    node.type !== 'thought' ||
    (!node.data.taskStatus && 
     !node.data.importance && 
     !node.data.urgency &&
     node.data.category !== 'tasks')
  ) {
    return null
  }

  const todoType: TodoType = 
    node.data.taskType === 'habit' ? 'habit' :
    node.data.category === 'tasks' ? 'task' :
    'task'

  return {
    title: node.data.label || 'Untitled Task',
    description: node.data.originalText || undefined,
    type: todoType,
    status: convertNodeStatusToTodoStatus(node.data.taskStatus),
    priorityImportance: node.data.importance,
    priorityUrgency: node.data.urgency,
    dueDate: node.data.dueDate || undefined,
    scheduledDate: node.data.timeboxDate || undefined,
    scheduledTime: node.data.timeboxStartTime || undefined,
    scheduledDuration: node.data.timeboxDuration || undefined,
    sourceType: 'braindump' as TodoSourceType,
    sourceId: `${braindumpId}:${node.id}`,
    sourceMetadata: {
      nodeId: node.id,
      braindumpId,
      originalNode: node,
    },
  }
}

// Convert node status to todo status
function convertNodeStatusToTodoStatus(nodeStatus?: string): Todo['status'] {
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

// Convert a Journal daily quest to a Todo
export function convertJournalQuestToTodo(
  entry: JournalEntry,
  userId: string
): CreateTodoInput {
  return {
    title: entry.dailyQuest || 'Daily Quest',
    description: 'Daily quest from journal entry',
    type: 'quest',
    status: 'completed', // Journal entries are historical
    scheduledDate: new Date(entry.date).toISOString().split('T')[0],
    sourceType: 'journal' as TodoSourceType,
    sourceId: entry.id,
    sourceMetadata: {
      journalEntryId: entry.id,
      entryDate: entry.date,
      xpEarned: entry.xpEarned,
    },
  }
}

// Convert Routine MIT to Todo
export function convertRoutineMITToTodo(
  entry: RoutineEntry,
  userId: string
): CreateTodoInput | null {
  if (!entry.mit) return null

  return {
    title: entry.mit,
    description: 'Most Important Task for the day',
    type: 'task',
    status: entry.morningCompleted ? 'completed' : 'pending',
    scheduledDate: entry.date,
    sourceType: 'routine' as TodoSourceType,
    sourceId: entry.id,
    sourceMetadata: {
      routineEntryId: entry.id,
      dayNumber: entry.dayNumber,
      entryDate: entry.date,
    },
  }
}

// Convert Routine ritual items to Todos
export function convertRoutineRitualsToTodos(
  entry: RoutineEntry,
  userId: string
): CreateTodoInput[] {
  if (!entry.morningRitualPlan || !Array.isArray(entry.morningRitualPlan)) {
    return []
  }

  return entry.morningRitualPlan.map((ritual, index) => ({
    title: ritual,
    type: 'ritual' as TodoType,
    status: entry.ritualCompleted?.[index] ? 'completed' : 'pending',
    scheduledDate: entry.date,
    scheduledTime: entry.wakeIntention,
    sourceType: 'routine' as TodoSourceType,
    sourceId: entry.id,
    sourceMetadata: {
      routineEntryId: entry.id,
      dayNumber: entry.dayNumber,
      entryDate: entry.date,
      ritualIndex: index,
    },
  }))
}

// Migrate a single BrainDump to todos
export async function migrateBrainDumpToTodos(
  braindumpId: string,
  userId: string
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = []
  let created = 0

  try {
    // Fetch the brain dump
    const { data: dump, error } = await supabase
      .from('brain_dumps')
      .select('*')
      .eq('id', braindumpId)
      .single()

    if (error || !dump) {
      errors.push(`Failed to fetch brain dump: ${error?.message}`)
      return { created, errors }
    }

    // Process each node
    const nodes = dump.nodes as BrainDumpNode[]
    for (const node of nodes) {
      const todoInput = convertBrainDumpNodeToTodo(node, userId, braindumpId)
      if (!todoInput) continue

      try {
        // Create the todo
        const todoData = {
          user_id: userId,
          ...transformTodoInputToDB(todoInput),
        }
        
        // console.log('Creating todo with data:', todoData)
        
        const { data: todo, error: todoError } = await supabase
          .from('todos')
          .insert(todoData)
          .select()
          .single()

        if (todoError || !todo) {
          // console.error('Todo creation failed:', { todoError, todoData })
          errors.push(`Failed to create todo for node ${node.id}: ${todoError?.message || 'No data returned'}`)
          continue
        }

        // Create the link
        const { error: linkError } = await supabase
          .from('braindump_todos')
          .insert({
            braindump_id: braindumpId,
            node_id: node.id,
            todo_id: todo.id,
          })

        if (linkError) {
          errors.push(`Failed to link todo ${todo.id} to node ${node.id}: ${linkError.message}`)
        } else {
          created++
        }

        // Handle recurrence
        if (node.data.recurrencePattern) {
          await createRecurrenceFromNode(todo.id, node)
        }

        // Handle attempts
        if (node.data.attempts?.length) {
          await createAttemptsFromNode(todo.id, node)
        }

        // Handle completions
        if (node.data.recurringCompletions?.length) {
          await createCompletionsFromNode(todo.id, node)
        }
      } catch (err) {
        errors.push(`Error processing node ${node.id}: ${err instanceof Error ? err.message : String(err)}`)
        // console.error('Migration error details:', { node, error: err })
      }
    }

    // Establish relationships based on edges
    await establishRelationshipsFromEdges(dump.edges as any[], braindumpId)

  } catch (err) {
    errors.push(`General error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { created, errors }
}

// Helper to transform todo input to database format
function transformTodoInputToDB(input: CreateTodoInput) {
  return {
    title: input.title || 'Untitled Task',
    description: input.description || null,
    type: input.type || 'task',
    status: input.status || 'pending',
    priority_importance: input.priorityImportance ?? 3, // Default to 3 if undefined
    priority_urgency: input.priorityUrgency ?? 3, // Default to 3 if undefined
    due_date: input.dueDate || null,
    scheduled_date: input.scheduledDate || null,
    scheduled_time: input.scheduledTime || null,
    scheduled_duration: input.scheduledDuration || null,
    parent_id: input.parentId || null,
    source_type: input.sourceType || 'manual',
    source_id: input.sourceId || null,
    source_metadata: input.sourceMetadata || null,
  }
}

// Create recurrence from node data
async function createRecurrenceFromNode(todoId: string, node: BrainDumpNode) {
  if (!node.data.recurrencePattern) return

  const pattern = node.data.recurrencePattern
  await supabase.from('todo_recurrence').insert({
    todo_id: todoId,
    pattern_type: pattern.type,
    pattern_config: pattern,
    start_date: pattern.startDate,
    end_date: pattern.endDate,
    is_habit: node.data.taskType === 'habit',
    current_streak: node.data.currentStreak || 0,
    longest_streak: node.data.longestStreak || 0,
  })
}

// Create attempts from node data
async function createAttemptsFromNode(todoId: string, node: BrainDumpNode) {
  if (!node.data.attempts?.length) return

  const attempts = node.data.attempts.map(attempt => ({
    todo_id: todoId,
    attempt_date: new Date(attempt.timestamp).toISOString().split('T')[0],
    started_at: attempt.timestamp,
    outcome: attempt.outcome,
    duration_minutes: attempt.duration,
    notes: attempt.notes,
    next_action: attempt.nextAction,
  }))

  await supabase.from('todo_attempts').insert(attempts)
}

// Create completions from node data
async function createCompletionsFromNode(todoId: string, node: BrainDumpNode) {
  if (!node.data.recurringCompletions?.length) return

  const completions = node.data.recurringCompletions.map(completion => ({
    todo_id: todoId,
    completion_date: completion.date,
    completed_at: completion.completedAt,
    quality: completion.quality,
    duration_minutes: completion.duration,
    notes: completion.notes,
  }))

  await supabase.from('todo_completions').insert(completions)
}

// Establish relationships from brain dump edges
async function establishRelationshipsFromEdges(edges: Array<{ source: string; target: string }>, braindumpId: string) {
  for (const edge of edges) {
    // Find todos for source and target
    const { data: sourceTodo } = await supabase
      .from('braindump_todos')
      .select('todo_id')
      .eq('braindump_id', braindumpId)
      .eq('node_id', edge.source)
      .single()

    const { data: targetTodo } = await supabase
      .from('braindump_todos')
      .select('todo_id')
      .eq('braindump_id', braindumpId)
      .eq('node_id', edge.target)
      .single()

    if (sourceTodo && targetTodo) {
      // Create relationship
      await supabase.from('todo_relationships').insert({
        parent_todo_id: sourceTodo.todo_id,
        child_todo_id: targetTodo.todo_id,
        relationship_type: 'subtask',
        logic_type: 'NONE',
      })

      // Also update parent_id for simpler queries
      await supabase
        .from('todos')
        .update({ parent_id: sourceTodo.todo_id })
        .eq('id', targetTodo.todo_id)
    }
  }
}

// Run full migration for a user
export async function runFullMigration(userId: string): Promise<{
  summary: {
    braindumps: { total: number; migrated: number }
    journal: { total: number; migrated: number }
    routines: { total: number; migrated: number }
    errors: string[]
  }
}> {
  const summary = {
    braindumps: { total: 0, migrated: 0 },
    journal: { total: 0, migrated: 0 },
    routines: { total: 0, migrated: 0 },
    errors: [] as string[],
  }

  try {
    // Migrate BrainDumps
    const { data: dumps } = await supabase
      .from('brain_dumps')
      .select('id')
      .eq('user_id', userId)

    summary.braindumps.total = dumps?.length || 0

    for (const dump of dumps || []) {
      const result = await migrateBrainDumpToTodos(dump.id, userId)
      if (result.created > 0) summary.braindumps.migrated++
      summary.errors.push(...result.errors)
    }

    // Migrate Journal Entries
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .not('daily_quest', 'is', null)

    summary.journal.total = entries?.length || 0

    for (const entry of entries || []) {
      try {
        const todoInput = convertJournalQuestToTodo(entry, userId)
        const { data: todo } = await supabase
          .from('todos')
          .insert({
            user_id: userId,
            ...transformTodoInputToDB(todoInput),
            completed_at: entry.date,
          })
          .select()
          .single()

        if (todo) {
          await supabase.from('journal_todos').insert({
            journal_entry_id: entry.id,
            todo_id: todo.id,
            todo_type: 'daily_quest',
          })
          summary.journal.migrated++
        }
      } catch (err) {
        summary.errors.push(`Journal ${entry.id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Migrate Routine Entries
    const { data: routineEntries } = await supabase
      .from('routine_entries')
      .select('*')
      .eq('user_id', userId)

    summary.routines.total = routineEntries?.length || 0

    for (const entry of routineEntries || []) {
      try {
        let migrated = false

        // MIT
        const mitInput = convertRoutineMITToTodo(entry, userId)
        if (mitInput) {
          const { data: todo } = await supabase
            .from('todos')
            .insert({
              user_id: userId,
              ...transformTodoInputToDB(mitInput),
              completed_at: entry.morningCompleted ? entry.date : null,
            })
            .select()
            .single()

          if (todo) {
            await supabase.from('routine_todos').insert({
              routine_entry_id: entry.id,
              todo_id: todo.id,
              todo_type: 'mit',
            })
            migrated = true
          }
        }

        // Rituals
        const ritualInputs = convertRoutineRitualsToTodos(entry, userId)
        for (const ritualInput of ritualInputs) {
          const { data: todo } = await supabase
            .from('todos')
            .insert({
              user_id: userId,
              ...transformTodoInputToDB(ritualInput),
            })
            .select()
            .single()

          if (todo) {
            await supabase.from('routine_todos').insert({
              routine_entry_id: entry.id,
              todo_id: todo.id,
              todo_type: 'ritual_item',
            })
            migrated = true
          }
        }

        if (migrated) summary.routines.migrated++
      } catch (err) {
        summary.errors.push(`Routine ${entry.id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

  } catch (err) {
    summary.errors.push(`General migration error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { summary }
}

// Check if a user has been migrated
export async function checkMigrationStatus(userId: string): Promise<{
  hasMigrated: boolean
  todoCount: number
  unmigrated: {
    braindumps: number
    journal: number
    routines: number
  }
}> {
  // Check if user has any todos
  const { count: todoCount } = await supabase
    .from('todos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Count unmigrated items
  const { count: braindumpNodes } = await supabase
    .from('brain_dumps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: journalQuests } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('daily_quest', 'is', null)

  const { count: routineItems } = await supabase
    .from('routine_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return {
    hasMigrated: (todoCount || 0) > 0,
    todoCount: todoCount || 0,
    unmigrated: {
      braindumps: braindumpNodes || 0,
      journal: journalQuests || 0,
      routines: routineItems || 0,
    },
  }
}