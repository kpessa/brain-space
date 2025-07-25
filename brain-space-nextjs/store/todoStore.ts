import { create } from 'zustand'

export type TodoType = 'task' | 'quest' | 'ritual' | 'habit' | 'routine_item'
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'deferred' | 'cancelled'
export type TodoSourceType = 'braindump' | 'journal' | 'routine' | 'manual' | 'recurring'

export interface Todo {
  id: string
  userId?: string
  
  // Core fields
  title: string
  description?: string
  type: TodoType
  status: TodoStatus
  
  // Priority fields (0-10 scale)
  importance?: number
  urgency?: number
  
  // Scheduling
  dueDate?: string
  scheduledDate?: string
  scheduledTime?: string
  scheduledDuration?: number // minutes
  
  // Hierarchy
  parentId?: string
  position?: number
  
  // Source tracking
  sourceType: TodoSourceType
  sourceId?: string
  
  // Completion
  completedAt?: string
  completionNotes?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
  
  // Relations
  tags?: string[]
  children?: Todo[]
}

interface TodoState {
  todos: Todo[]
  isLoading: boolean
  filter: {
    status?: TodoStatus
    type?: TodoType
    tag?: string
    searchQuery?: string
  }
  
  // Actions
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Todo
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  
  // Bulk actions
  clearCompleted: () => void
  
  // Filtering
  setFilter: (filter: TodoState['filter']) => void
  getFilteredTodos: () => Todo[]
  
  // Source-based creation
  createFromBrainDump: (sourceId: string, todos: Array<{
    title: string
    type?: TodoType
    urgency?: number
    importance?: number
    tags?: string[]
  }>) => void
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoading: false,
  filter: {},
  
  addTodo: (todoData) => {
    const newTodo: Todo = {
      ...todoData,
      id: `todo-${Date.now()}`,
      status: todoData.status || 'pending',
      type: todoData.type || 'task',
      sourceType: todoData.sourceType || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set(state => ({
      todos: [...state.todos, newTodo]
    }))
    
    return newTodo
  },
  
  updateTodo: (id, updates) => {
    set(state => ({
      todos: state.todos.map(todo =>
        todo.id === id
          ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
          : todo
      )
    }))
  },
  
  deleteTodo: (id) => {
    set(state => ({
      todos: state.todos.filter(todo => todo.id !== id && todo.parentId !== id)
    }))
  },
  
  toggleTodo: (id) => {
    const todo = get().todos.find(t => t.id === id)
    if (!todo) return
    
    const newStatus: TodoStatus = todo.status === 'completed' ? 'pending' : 'completed'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined
    
    get().updateTodo(id, { 
      status: newStatus,
      completedAt: completedAt || undefined
    })
  },
  
  clearCompleted: () => {
    set(state => ({
      todos: state.todos.filter(todo => todo.status !== 'completed')
    }))
  },
  
  setFilter: (filter) => {
    set({ filter })
  },
  
  getFilteredTodos: () => {
    const { todos, filter } = get()
    
    return todos.filter(todo => {
      if (filter.status && todo.status !== filter.status) return false
      if (filter.type && todo.type !== filter.type) return false
      if (filter.tag && !todo.tags?.includes(filter.tag)) return false
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        return (
          todo.title.toLowerCase().includes(query) ||
          todo.description?.toLowerCase().includes(query)
        )
      }
      return true
    })
  },
  
  createFromBrainDump: (sourceId, todoItems) => {
    const { addTodo } = get()
    
    todoItems.forEach(item => {
      addTodo({
        title: item.title,
        type: item.type || 'task',
        urgency: item.urgency,
        importance: item.importance,
        tags: item.tags,
        status: 'pending',
        sourceType: 'braindump',
        sourceId,
      })
    })
  },
}))