import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type {
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
  TodoFilter,
  TodoSortOptions,
  TodoRecurrence,
  TodoCompletion,
  TodoAttempt,
  TodoTag,
  TodoStats,
  AttemptOutcome,
  CompletionQuality,
  RecurrencePatternType,
  RecurrencePatternConfig,
  TodoRelationship,
} from '@/types/todo'

// Database row types
type TodoRow = Database['public']['Tables']['todos']['Row']
type RecurrenceRow = Database['public']['Tables']['todo_recurrence']['Row']
type CompletionRow = Database['public']['Tables']['todo_completions']['Row']
type AttemptRow = Database['public']['Tables']['todo_attempts']['Row']
type TagRow = Database['public']['Tables']['todo_tags']['Row']
type RelationshipRow = Database['public']['Tables']['todo_relationships']['Row']

// Database response type with relations
type TodoWithRelations = TodoRow & {
  recurrence?: RecurrenceRow[]
  completions?: CompletionRow[]
  attempts?: AttemptRow[]
  tags?: TagRow[]
  relationships?: RelationshipRow[]
}

interface TodoStore {
  // State
  todos: Todo[]
  isLoading: boolean
  error: string | null
  filter: TodoFilter
  sort: TodoSortOptions
  
  // Basic CRUD
  fetchTodos: (userId: string) => Promise<void>
  createTodo: (userId: string, input: CreateTodoInput) => Promise<Todo | null>
  updateTodo: (todoId: string, updates: UpdateTodoInput) => Promise<void>
  deleteTodo: (todoId: string) => Promise<void>
  
  // Batch operations
  batchUpdateTodos: (updates: { id: string; changes: UpdateTodoInput }[]) => Promise<void>
  batchDeleteTodos: (todoIds: string[]) => Promise<void>
  
  // Status management
  completeTodo: (todoId: string, notes?: string) => Promise<void>
  uncompleteTodo: (todoId: string) => Promise<void>
  updateTodoStatus: (todoId: string, status: Todo['status']) => Promise<void>
  
  // Priority management
  updateTodoPriority: (todoId: string, importance: number, urgency: number) => Promise<void>
  
  // Scheduling
  scheduleTodo: (todoId: string, date: string, time?: string, duration?: number) => Promise<void>
  unscheduleTodo: (todoId: string) => Promise<void>
  
  // Hierarchy
  addSubtask: (parentId: string, subtask: CreateTodoInput) => Promise<Todo | null>
  moveToParent: (todoId: string, newParentId: string | null) => Promise<void>
  reorderSubtasks: (parentId: string, todoIds: string[]) => Promise<void>
  
  // Recurrence
  makeRecurring: (todoId: string, pattern: RecurrencePatternType, config: RecurrencePatternConfig) => Promise<void>
  updateRecurrence: (todoId: string, recurrence: Partial<TodoRecurrence>) => Promise<void>
  removeRecurrence: (todoId: string) => Promise<void>
  completeRecurringInstance: (todoId: string, date: string, quality?: CompletionQuality, notes?: string) => Promise<void>
  
  // Attempts
  recordAttempt: (todoId: string, attempt: Omit<TodoAttempt, 'id' | 'todoId' | 'createdAt'>) => Promise<void>
  
  // Tags
  addTag: (todoId: string, tagName: string, category?: TodoTag['tagCategory']) => Promise<void>
  removeTag: (todoId: string, tagName: string) => Promise<void>
  
  // Filtering and sorting
  setFilter: (filter: Partial<TodoFilter>) => void
  clearFilter: () => void
  setSort: (sort: TodoSortOptions) => void
  
  // Utilities
  getTodoById: (todoId: string) => Todo | undefined
  getTodosByParent: (parentId: string | null) => Todo[]
  getTodoStats: (userId: string) => Promise<TodoStats>
  
  // Source integration
  linkToBrainDump: (todoId: string, braindumpId: string, nodeId: string) => Promise<void>
  linkToJournal: (todoId: string, journalEntryId: string, type: string) => Promise<void>
  linkToRoutine: (todoId: string, routineEntryId: string, type: string) => Promise<void>
}

const defaultFilter: TodoFilter = {
  status: ['pending', 'in_progress'],
  parentId: null, // Show only top-level by default
}

const defaultSort: TodoSortOptions = {
  field: 'priority',
  direction: 'desc',
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  // Initial state
  todos: [],
  isLoading: false,
  error: null,
  filter: defaultFilter,
  sort: defaultSort,
  
  // Fetch all todos for a user
  fetchTodos: async (userId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // Build query with joins for related data
      let query = supabase
        .from('todos')
        .select(`
          *,
          recurrence:todo_recurrence(*),
          completions:todo_completions(*),
          attempts:todo_attempts(*),
          tags:todo_tags(*),
          relationships:todo_relationships!parent_todo_id(*)
        `)
        .eq('user_id', userId)
      
      // Apply filters
      const { filter } = get()
      if (filter.status?.length) {
        query = query.in('status', filter.status)
      }
      if (filter.type?.length) {
        query = query.in('type', filter.type)
      }
      if (filter.eisenhowerQuadrant?.length) {
        query = query.in('eisenhower_quadrant', filter.eisenhowerQuadrant)
      }
      if (filter.scheduledDate) {
        query = query.eq('scheduled_date', filter.scheduledDate)
      }
      if (filter.dueDate) {
        query = query.eq('due_date', filter.dueDate)
      }
      if (filter.parentId !== undefined) {
        if (filter.parentId === null) {
          query = query.is('parent_id', null)
        } else {
          query = query.eq('parent_id', filter.parentId)
        }
      }
      if (filter.sourceType?.length) {
        query = query.in('source_type', filter.sourceType)
      }
      if (filter.searchQuery) {
        query = query.or(`title.ilike.%${filter.searchQuery}%,description.ilike.%${filter.searchQuery}%`)
      }
      
      // Apply sorting
      const { sort } = get()
      if (sort.field === 'priority') {
        // Custom priority sort: importance + urgency
        query = query.order('priority_importance', { ascending: sort.direction === 'asc', nullsFirst: false })
                     .order('priority_urgency', { ascending: sort.direction === 'asc', nullsFirst: false })
      } else {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' })
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Transform snake_case to camelCase
      const todos = data?.map(transformTodoFromDB) ?? []
      
      set({ todos, isLoading: false })
    } catch (error) {
      // console.error('Error fetching todos:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred', isLoading: false })
    }
  },
  
  // Create a new todo
  createTodo: async (userId: string, input: CreateTodoInput) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description,
          type: input.type ?? 'task',
          status: input.status ?? 'pending',
          priority_importance: input.priorityImportance ?? 3, // Default to middle priority
          priority_urgency: input.priorityUrgency ?? 3, // Default to middle urgency
          due_date: input.dueDate,
          scheduled_date: input.scheduledDate,
          scheduled_time: input.scheduledTime,
          scheduled_duration: input.scheduledDuration,
          parent_id: input.parentId,
          source_type: input.sourceType ?? 'manual',
          source_id: input.sourceId,
          source_metadata: input.sourceMetadata,
        })
        .select('*')
        .single()
      
      if (error) throw error
      
      // Check if data is returned
      if (!data) {
        // console.error('No data returned from todo insert operation')
        throw new Error('Failed to create todo: No data returned from database')
      }
      
      const newTodo = transformTodoFromDB(data)
      
      // Add tags if provided
      if (input.tags?.length) {
        for (const tag of input.tags) {
          await get().addTag(newTodo.id, tag)
        }
      }
      
      // Update local state
      set(state => ({ todos: [...state.todos, newTodo] }))
      
      return newTodo
    } catch (error) {
      // console.error('Error creating todo:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      return null
    }
  },
  
  // Update a todo
  updateTodo: async (todoId: string, updates: UpdateTodoInput) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({
          title: updates.title,
          description: updates.description,
          type: updates.type,
          status: updates.status,
          priority_importance: updates.priorityImportance,
          priority_urgency: updates.priorityUrgency,
          due_date: updates.dueDate,
          scheduled_date: updates.scheduledDate,
          scheduled_time: updates.scheduledTime,
          scheduled_duration: updates.scheduledDuration,
          completed_at: updates.completedAt,
          completion_notes: updates.completionNotes,
        })
        .eq('id', todoId)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        todos: state.todos.map(todo =>
          todo.id === todoId
            ? { ...todo, ...transformUpdateInput(updates) }
            : todo
        ),
      }))
    } catch (error) {
      // console.error('Error updating todo:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Delete a todo
  deleteTodo: async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        todos: state.todos.filter(todo => todo.id !== todoId),
      }))
    } catch (error) {
      // console.error('Error deleting todo:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Batch update todos
  batchUpdateTodos: async (updates) => {
    try {
      // Perform updates in parallel
      await Promise.all(
        updates.map(({ id, changes }) => get().updateTodo(id, changes))
      )
    } catch (error) {
      // console.error('Error batch updating todos:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Batch delete todos
  batchDeleteTodos: async (todoIds) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .in('id', todoIds)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        todos: state.todos.filter(todo => !todoIds.includes(todo.id)),
      }))
    } catch (error) {
      // console.error('Error batch deleting todos:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Complete a todo
  completeTodo: async (todoId: string, notes?: string) => {
    await get().updateTodo(todoId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      completionNotes: notes,
    })
  },
  
  // Uncomplete a todo
  uncompleteTodo: async (todoId: string) => {
    await get().updateTodo(todoId, {
      status: 'pending',
      completedAt: undefined,
      completionNotes: undefined,
    })
  },
  
  // Update todo status
  updateTodoStatus: async (todoId: string, status: Todo['status']) => {
    await get().updateTodo(todoId, { status })
  },
  
  // Update todo priority
  updateTodoPriority: async (todoId: string, importance: number, urgency: number) => {
    await get().updateTodo(todoId, {
      priorityImportance: importance,
      priorityUrgency: urgency,
    })
  },
  
  // Schedule a todo
  scheduleTodo: async (todoId: string, date: string, time?: string, duration?: number) => {
    await get().updateTodo(todoId, {
      scheduledDate: date,
      scheduledTime: time,
      scheduledDuration: duration,
    })
  },
  
  // Unschedule a todo
  unscheduleTodo: async (todoId: string) => {
    await get().updateTodo(todoId, {
      scheduledDate: undefined,
      scheduledTime: undefined,
      scheduledDuration: undefined,
    })
  },
  
  // Add a subtask
  addSubtask: async (parentId: string, subtask: CreateTodoInput) => {
    const parent = get().getTodoById(parentId)
    if (!parent) return null
    
    return get().createTodo(parent.userId, {
      ...subtask,
      parentId,
      // Inherit some properties from parent
      priorityImportance: subtask.priorityImportance ?? parent.priorityImportance,
      priorityUrgency: subtask.priorityUrgency ?? parent.priorityUrgency,
      scheduledDate: subtask.scheduledDate ?? parent.scheduledDate,
    })
  },
  
  // Move todo to new parent
  moveToParent: async (todoId: string, newParentId: string | null) => {
    await get().updateTodo(todoId, { parentId: newParentId })
  },
  
  // Reorder subtasks
  reorderSubtasks: async (parentId: string, todoIds: string[]) => {
    const updates = todoIds.map((id, index) => ({
      id,
      changes: { position: index } as UpdateTodoInput,
    }))
    await get().batchUpdateTodos(updates)
  },
  
  // Make todo recurring
  makeRecurring: async (todoId: string, pattern: RecurrencePatternType, config: RecurrencePatternConfig) => {
    try {
      const { error } = await supabase
        .from('todo_recurrence')
        .insert({
          todo_id: todoId,
          pattern_type: pattern,
          pattern_config: config,
          start_date: new Date().toISOString().split('T')[0],
          is_habit: get().getTodoById(todoId)?.type === 'habit',
        })
      
      if (error) throw error
      
      // Refresh todo to get recurrence data
      const todo = get().getTodoById(todoId)
      if (todo) {
        await get().fetchTodos(todo.userId)
      }
    } catch (error) {
      // console.error('Error making todo recurring:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Update recurrence
  updateRecurrence: async (todoId: string, recurrence: Partial<TodoRecurrence>) => {
    try {
      const { error } = await supabase
        .from('todo_recurrence')
        .update({
          pattern_type: recurrence.patternType,
          pattern_config: recurrence.patternConfig,
          start_date: recurrence.startDate,
          end_date: recurrence.endDate,
          is_habit: recurrence.isHabit,
        })
        .eq('todo_id', todoId)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        todos: state.todos.map(todo =>
          todo.id === todoId
            ? { ...todo, recurrence: { ...todo.recurrence!, ...recurrence } }
            : todo
        ),
      }))
    } catch (error) {
      // console.error('Error updating recurrence:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Remove recurrence
  removeRecurrence: async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('todo_recurrence')
        .delete()
        .eq('todo_id', todoId)
      
      if (error) throw error
      
      // Update local state
      set(state => ({
        todos: state.todos.map(todo =>
          todo.id === todoId
            ? { ...todo, recurrence: undefined }
            : todo
        ),
      }))
    } catch (error) {
      // console.error('Error removing recurrence:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Complete recurring instance
  completeRecurringInstance: async (todoId: string, date: string, quality?: CompletionQuality, notes?: string) => {
    try {
      const { error } = await supabase
        .from('todo_completions')
        .insert({
          todo_id: todoId,
          completion_date: date,
          quality,
          notes,
        })
      
      if (error) throw error
      
      // Update streak if it's a habit
      const todo = get().getTodoById(todoId)
      if (todo?.recurrence?.isHabit) {
        // This would need a more complex implementation to calculate streaks
        // console.log('Update habit streak')
      }
    } catch (error) {
      // console.error('Error completing recurring instance:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Record attempt
  recordAttempt: async (todoId: string, attempt: Omit<TodoAttempt, 'id' | 'todoId' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('todo_attempts')
        .insert({
          todo_id: todoId,
          attempt_date: attempt.attemptDate,
          started_at: attempt.startedAt,
          outcome: attempt.outcome,
          duration_minutes: attempt.durationMinutes,
          notes: attempt.notes,
          next_action: attempt.nextAction,
        })
      
      if (error) throw error
      
      // Update status based on outcome
      if (attempt.outcome === 'success') {
        await get().completeTodo(todoId)
      } else if (attempt.outcome === 'partial' || attempt.outcome === 'failed') {
        await get().updateTodoStatus(todoId, 'in_progress')
      }
    } catch (error) {
      // console.error('Error recording attempt:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Add tag
  addTag: async (todoId: string, tagName: string, category?: TodoTag['tagCategory']) => {
    try {
      const { error } = await supabase
        .from('todo_tags')
        .insert({
          todo_id: todoId,
          tag_name: tagName,
          tag_category: category,
        })
      
      if (error) throw error
    } catch (error) {
      // console.error('Error adding tag:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Remove tag
  removeTag: async (todoId: string, tagName: string) => {
    try {
      const { error } = await supabase
        .from('todo_tags')
        .delete()
        .eq('todo_id', todoId)
        .eq('tag_name', tagName)
      
      if (error) throw error
    } catch (error) {
      // console.error('Error removing tag:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Set filter
  setFilter: (filter: Partial<TodoFilter>) => {
    set(state => ({ filter: { ...state.filter, ...filter } }))
  },
  
  // Clear filter
  clearFilter: () => {
    set({ filter: defaultFilter })
  },
  
  // Set sort
  setSort: (sort: TodoSortOptions) => {
    set({ sort })
  },
  
  // Get todo by ID
  getTodoById: (todoId: string) => {
    return get().todos.find(todo => todo.id === todoId)
  },
  
  // Get todos by parent
  getTodosByParent: (parentId: string | null) => {
    return get().todos.filter(todo => todo.parentId === parentId)
  },
  
  // Get todo stats
  getTodoStats: async (userId: string) => {
    try {
      // This would be a more complex query in production
      const todos = get().todos
      
      const stats: TodoStats = {
        totalTodos: todos.length,
        completedTodos: todos.filter(t => t.status === 'completed').length,
        pendingTodos: todos.filter(t => t.status === 'pending').length,
        overdueCount: todos.filter(t => 
          t.status === 'pending' && 
          t.dueDate && 
          new Date(t.dueDate) < new Date()
        ).length,
        todayCount: todos.filter(t => 
          t.scheduledDate === new Date().toISOString().split('T')[0]
        ).length,
        weekCount: todos.filter(t => {
          if (!t.scheduledDate) return false
          const date = new Date(t.scheduledDate)
          const weekFromNow = new Date()
          weekFromNow.setDate(weekFromNow.getDate() + 7)
          return date <= weekFromNow
        }).length,
        
        byType: todos.reduce((acc, todo) => {
          acc[todo.type] = (acc[todo.type] || 0) + 1
          return acc
        }, {} as Record<Todo['type'], number>),
        
        byQuadrant: todos.reduce((acc, todo) => {
          if (todo.eisenhowerQuadrant) {
            acc[todo.eisenhowerQuadrant] = (acc[todo.eisenhowerQuadrant] || 0) + 1
          }
          return acc
        }, {} as Record<Todo['eisenhowerQuadrant'], number>),
        
        habitsActive: todos.filter(t => t.type === 'habit' && t.status !== 'completed').length,
        averageCompletionTime: 0, // Would calculate from attempts
        streakData: {
          currentStreak: 0, // Would calculate from completions
          longestStreak: 0,
        },
      }
      
      return stats
    } catch (error) {
      // console.error('Error getting todo stats:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },
  
  // Link to BrainDump
  linkToBrainDump: async (todoId: string, braindumpId: string, nodeId: string) => {
    try {
      const { error } = await supabase
        .from('braindump_todos')
        .insert({
          todo_id: todoId,
          braindump_id: braindumpId,
          node_id: nodeId,
        })
      
      if (error) throw error
    } catch (error) {
      // console.error('Error linking to braindump:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Link to Journal
  linkToJournal: async (todoId: string, journalEntryId: string, type: string) => {
    try {
      const { error } = await supabase
        .from('journal_todos')
        .insert({
          todo_id: todoId,
          journal_entry_id: journalEntryId,
          todo_type: type,
        })
      
      if (error) throw error
    } catch (error) {
      // console.error('Error linking to journal:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
  
  // Link to Routine
  linkToRoutine: async (todoId: string, routineEntryId: string, type: string) => {
    try {
      const { error } = await supabase
        .from('routine_todos')
        .insert({
          todo_id: todoId,
          routine_entry_id: routineEntryId,
          todo_type: type,
        })
      
      if (error) throw error
    } catch (error) {
      // console.error('Error linking to routine:', error)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  },
}))

// Helper functions for data transformation
function transformTodoFromDB(dbTodo: TodoWithRelations): Todo {
  if (!dbTodo) {
    throw new Error('transformTodoFromDB: dbTodo is null or undefined')
  }
  
  return {
    id: dbTodo.id,
    userId: dbTodo.user_id,
    title: dbTodo.title,
    description: dbTodo.description,
    type: dbTodo.type,
    status: dbTodo.status,
    priorityImportance: dbTodo.priority_importance,
    priorityUrgency: dbTodo.priority_urgency,
    dueDate: dbTodo.due_date,
    scheduledDate: dbTodo.scheduled_date,
    scheduledTime: dbTodo.scheduled_time,
    scheduledDuration: dbTodo.scheduled_duration,
    parentId: dbTodo.parent_id,
    position: dbTodo.position,
    sourceType: dbTodo.source_type,
    sourceId: dbTodo.source_id,
    sourceMetadata: dbTodo.source_metadata,
    completedAt: dbTodo.completed_at,
    completionNotes: dbTodo.completion_notes,
    createdAt: dbTodo.created_at,
    updatedAt: dbTodo.updated_at,
    eisenhowerQuadrant: dbTodo.eisenhower_quadrant,
    
    // Relations
    recurrence: dbTodo.recurrence?.[0] ? transformRecurrenceFromDB(dbTodo.recurrence[0]) : undefined,
    completions: dbTodo.completions?.map(transformCompletionFromDB) ?? [],
    attempts: dbTodo.attempts?.map(transformAttemptFromDB) ?? [],
    tags: dbTodo.tags?.map(transformTagFromDB) ?? [],
    relationships: dbTodo.relationships?.map(transformRelationshipFromDB) ?? [],
  }
}

function transformRecurrenceFromDB(dbRecurrence: RecurrenceRow): TodoRecurrence {
  return {
    id: dbRecurrence.id,
    todoId: dbRecurrence.todo_id,
    patternType: dbRecurrence.pattern_type,
    patternConfig: dbRecurrence.pattern_config,
    startDate: dbRecurrence.start_date,
    endDate: dbRecurrence.end_date,
    nextOccurrenceDate: dbRecurrence.next_occurrence_date,
    lastGeneratedDate: dbRecurrence.last_generated_date,
    isHabit: dbRecurrence.is_habit,
    currentStreak: dbRecurrence.current_streak,
    longestStreak: dbRecurrence.longest_streak,
    createdAt: dbRecurrence.created_at,
    updatedAt: dbRecurrence.updated_at,
  }
}

function transformCompletionFromDB(dbCompletion: CompletionRow): TodoCompletion {
  return {
    id: dbCompletion.id,
    todoId: dbCompletion.todo_id,
    completionDate: dbCompletion.completion_date,
    completedAt: dbCompletion.completed_at,
    quality: dbCompletion.quality,
    durationMinutes: dbCompletion.duration_minutes,
    notes: dbCompletion.notes,
    streakCount: dbCompletion.streak_count,
    createdAt: dbCompletion.created_at,
  }
}

function transformAttemptFromDB(dbAttempt: AttemptRow): TodoAttempt {
  return {
    id: dbAttempt.id,
    todoId: dbAttempt.todo_id,
    attemptDate: dbAttempt.attempt_date,
    startedAt: dbAttempt.started_at,
    outcome: dbAttempt.outcome,
    durationMinutes: dbAttempt.duration_minutes,
    notes: dbAttempt.notes,
    nextAction: dbAttempt.next_action,
    createdAt: dbAttempt.created_at,
  }
}

function transformTagFromDB(dbTag: TagRow): TodoTag {
  return {
    id: dbTag.id,
    todoId: dbTag.todo_id,
    tagName: dbTag.tag_name,
    tagCategory: dbTag.tag_category,
    createdAt: dbTag.created_at,
  }
}

function transformRelationshipFromDB(dbRel: RelationshipRow): TodoRelationship {
  return {
    id: dbRel.id,
    parentTodoId: dbRel.parent_todo_id,
    childTodoId: dbRel.child_todo_id,
    relationshipType: dbRel.relationship_type,
    logicType: dbRel.logic_type,
    isOptional: dbRel.is_optional,
    createdAt: dbRel.created_at,
  }
}

function transformUpdateInput(updates: UpdateTodoInput): Partial<Todo> {
  return {
    title: updates.title,
    description: updates.description,
    type: updates.type,
    status: updates.status,
    priorityImportance: updates.priorityImportance,
    priorityUrgency: updates.priorityUrgency,
    dueDate: updates.dueDate,
    scheduledDate: updates.scheduledDate,
    scheduledTime: updates.scheduledTime,
    scheduledDuration: updates.scheduledDuration,
    completedAt: updates.completedAt,
    completionNotes: updates.completionNotes,
  }
}