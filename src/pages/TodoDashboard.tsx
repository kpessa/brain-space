import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTodoStore } from '@/store/todos'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Calendar,
  Target,
  Brain,
  BookOpen,
  Moon,
  Plus,
  Filter,
  LayoutGrid
} from 'lucide-react'
import type { Todo, TodoFilter, EisenhowerQuadrant } from '@/types/todo'
import { getQuadrantInfo } from '@/types/todo'

// Todo Item Component
function TodoItem({ todo, onToggle, onUpdate }: { 
  todo: Todo
  onToggle: (id: string) => void
  onUpdate: (id: string, updates: any) => void
}) {
  const sourceIcon = {
    braindump: <Brain className="w-4 h-4" />,
    journal: <BookOpen className="w-4 h-4" />,
    routine: <Moon className="w-4 h-4" />,
    manual: <Plus className="w-4 h-4" />,
    recurring: <Clock className="w-4 h-4" />
  }[todo.sourceType]

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border transition-colors",
      todo.status === 'completed' 
        ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75"
        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
    )}>
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          "mt-0.5 transition-colors",
          todo.status === 'completed'
            ? "text-green-600 dark:text-green-400"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        )}
      >
        {todo.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium",
            todo.status === 'completed' && "line-through text-gray-500 dark:text-gray-400"
          )}>
            {todo.title}
          </span>
          {sourceIcon && (
            <span className="text-gray-400 dark:text-gray-500">
              {sourceIcon}
            </span>
          )}
        </div>
        
        {todo.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {todo.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {todo.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Due {new Date(todo.dueDate).toLocaleDateString()}
            </span>
          )}
          {todo.scheduledTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {todo.scheduledTime}
            </span>
          )}
          {todo.eisenhowerQuadrant && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              getQuadrantInfo(todo.eisenhowerQuadrant).color
            )}>
              {getQuadrantInfo(todo.eisenhowerQuadrant).label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Filter Bar Component
function FilterBar({ filter, onFilterChange }: {
  filter: TodoFilter
  onFilterChange: (filter: Partial<TodoFilter>) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={filter.status?.includes('pending') ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onFilterChange({ 
          status: filter.status?.includes('pending') 
            ? filter.status.filter(s => s !== 'pending')
            : [...(filter.status || []), 'pending']
        })}
      >
        Pending
      </Button>
      <Button
        variant={filter.status?.includes('in_progress') ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onFilterChange({ 
          status: filter.status?.includes('in_progress')
            ? filter.status.filter(s => s !== 'in_progress')
            : [...(filter.status || []), 'in_progress']
        })}
      >
        In Progress
      </Button>
      <Button
        variant={filter.status?.includes('completed') ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onFilterChange({ 
          status: filter.status?.includes('completed')
            ? filter.status.filter(s => s !== 'completed')
            : [...(filter.status || []), 'completed']
        })}
      >
        Completed
      </Button>
      
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange({ searchQuery: '' })}
        >
          <Filter className="w-4 h-4 mr-1" />
          Clear Filters
        </Button>
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function TodoDashboard() {
  const { user } = useAuth()
  const {
    todos,
    isLoading,
    error,
    filter,
    fetchTodos,
    completeTodo,
    uncompleteTodo,
    updateTodo,
    setFilter,
    clearFilter,
    getTodoStats
  } = useTodoStore()
  
  const [stats, setStats] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'list' | 'quadrant'>('list')

  useEffect(() => {
    if (user) {
      fetchTodos(user.id)
      getTodoStats(user.id).then(setStats)
    }
  }, [user])

  const handleToggle = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (!todo) return
    
    if (todo.status === 'completed') {
      await uncompleteTodo(todoId)
    } else {
      await completeTodo(todoId)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading todos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Todo Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            All your tasks from BrainDump, Journal, and Routines in one place
          </p>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold">{stats.totalTodos}</p>
                  </div>
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingTodos}</p>
                  </div>
                  <Circle className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedTodos}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <FilterBar filter={filter} onFilterChange={setFilter} />
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'quadrant' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('quadrant')}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Matrix
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No todos found. Start by creating tasks in BrainDump, Journal, or Routines!
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {todos.map(todo => (
                  <TodoItem 
                    key={todo.id} 
                    todo={todo} 
                    onToggle={handleToggle}
                    onUpdate={updateTodo}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {(['do-first', 'schedule', 'delegate', 'eliminate'] as EisenhowerQuadrant[]).map(quadrant => {
                  const quadrantInfo = getQuadrantInfo(quadrant)
                  const quadrantTodos = todos.filter(t => t.eisenhowerQuadrant === quadrant)
                  
                  return (
                    <div key={quadrant} className={cn(
                      "p-4 rounded-lg border-2",
                      quadrantInfo.color
                    )}>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <span>{quadrantInfo.icon}</span>
                        {quadrantInfo.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {quadrantInfo.description}
                      </p>
                      <div className="space-y-2">
                        {quadrantTodos.map(todo => (
                          <TodoItem 
                            key={todo.id} 
                            todo={todo} 
                            onToggle={handleToggle}
                            onUpdate={updateTodo}
                          />
                        ))}
                        {quadrantTodos.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No tasks in this quadrant
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}