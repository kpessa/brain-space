import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTodoStore } from '@/store/todos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'
import {
  Calendar,
  CheckSquare,
  Square,
  Filter,
  Plus,
  Target,
  Clock,
  Tag,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  Sun,
  Brain,
} from 'lucide-react'
import type { Todo, TodoFilter, EisenhowerQuadrant } from '@/types/todo'
import { getQuadrantInfo } from '@/types/todo'

export default function UnifiedTodos() {
  const { user } = useAuth()
  const {
    todos,
    isLoading,
    filter,
    fetchTodos,
    completeTodo,
    uncompleteTodo,
    setFilter,
    getTodosByParent,
  } = useTodoStore()

  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set())
  const [selectedQuadrant, setSelectedQuadrant] = useState<EisenhowerQuadrant | 'all'>('all')
  const [selectedSource, setSelectedSource] = useState<TodoFilter['sourceType'] | undefined>()

  useEffect(() => {
    if (user) {
      fetchTodos(user.id)
    }
  }, [user, fetchTodos])

  const toggleExpanded = (todoId: string) => {
    setExpandedTodos(prev => {
      const next = new Set(prev)
      if (next.has(todoId)) {
        next.delete(todoId)
      } else {
        next.add(todoId)
      }
      return next
    })
  }

  const handleToggleComplete = async (todo: Todo) => {
    if (todo.status === 'completed') {
      await uncompleteTodo(todo.id)
    } else {
      await completeTodo(todo.id)
    }
  }

  const handleQuadrantFilter = (quadrant: EisenhowerQuadrant | 'all') => {
    setSelectedQuadrant(quadrant)
    if (quadrant === 'all') {
      setFilter({ eisenhowerQuadrant: undefined })
    } else {
      setFilter({ eisenhowerQuadrant: [quadrant] })
    }
  }

  const handleSourceFilter = (source: TodoFilter['sourceType'] | undefined) => {
    setSelectedSource(source)
    setFilter({ sourceType: source })
  }

  // Group todos by source
  const todosBySource = todos.reduce(
    (acc, todo) => {
      const source = todo.sourceType
      if (!acc[source]) acc[source] = []
      acc[source].push(todo)
      return acc
    },
    {} as Record<string, Todo[]>
  )

  // Source icons and labels
  const sourceInfo = {
    braindump: { icon: Brain, label: 'BrainDump', color: 'text-purple-600' },
    journal: { icon: BookOpen, label: 'Journal', color: 'text-blue-600' },
    routine: { icon: Sun, label: 'Routines', color: 'text-yellow-600' },
    manual: { icon: Plus, label: 'Manual', color: 'text-gray-600' },
    recurring: { icon: Clock, label: 'Recurring', color: 'text-green-600' },
  }

  const renderTodo = (todo: Todo, depth = 0) => {
    const children = getTodosByParent(todo.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedTodos.has(todo.id)
    const quadrantInfo = todo.eisenhowerQuadrant ? getQuadrantInfo(todo.eisenhowerQuadrant) : null
    const SourceIcon = sourceInfo[todo.sourceType]?.icon || Plus

    return (
      <div key={todo.id} style={{ marginLeft: `${depth * 24}px` }}>
        <div
          className={cn(
            'group flex items-start gap-3 p-3 rounded-lg border transition-all',
            'hover:shadow-md',
            todo.status === 'completed' && 'opacity-60',
            quadrantInfo?.color || 'bg-white border-gray-200'
          )}
        >
          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(todo.id)}
              className="mt-0.5 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Checkbox */}
          <button
            onClick={() => handleToggleComplete(todo)}
            className="mt-0.5 text-gray-500 hover:text-gray-700"
          >
            {todo.status === 'completed' ? (
              <CheckSquare className="w-5 h-5" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Priority Icon */}
              {quadrantInfo && (
                <span className="text-lg" title={quadrantInfo.description}>
                  {quadrantInfo.icon}
                </span>
              )}

              {/* Title */}
              <h3 className={cn('font-medium', todo.status === 'completed' && 'line-through')}>
                {todo.title}
              </h3>

              {/* Source Icon */}
              <SourceIcon
                className={cn('w-4 h-4', sourceInfo[todo.sourceType]?.color)}
                title={sourceInfo[todo.sourceType]?.label}
              />

              {/* Type Badge */}
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {todo.type}
              </span>

              {/* Recurring Badge */}
              {todo.recurrence && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  🔁 Recurring
                </span>
              )}
            </div>

            {/* Description */}
            {todo.description && <p className="text-sm text-gray-600 mt-1">{todo.description}</p>}

            {/* Metadata */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {todo.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              )}
              {todo.scheduledDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(todo.scheduledDate).toLocaleDateString()}
                  {todo.scheduledTime && ` at ${todo.scheduledTime}`}
                </span>
              )}
              {todo.tags?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {todo.tags.map(tag => tag.tagName).join(', ')}
                </span>
              )}
              {hasChildren && (
                <span className="text-gray-400">
                  {children.length} subtask{children.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1">{children.map(child => renderTodo(child, depth + 1))}</div>
        )}
      </div>
    )
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
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-brain-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Unified Todos</h1>
            </div>
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Todo
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            All your tasks, quests, and routines in one unified system
          </p>
        </header>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Quadrant Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority Quadrant
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedQuadrant === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleQuadrantFilter('all')}
              >
                All
              </Button>
              {(['do-first', 'schedule', 'delegate', 'eliminate'] as const).map(quadrant => {
                const info = getQuadrantInfo(quadrant)
                return (
                  <Button
                    key={quadrant}
                    variant={selectedQuadrant === quadrant ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleQuadrantFilter(quadrant)}
                    className="flex items-center gap-1"
                  >
                    <span>{info.icon}</span>
                    {info.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedSource ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleSourceFilter(undefined)}
              >
                All Sources
              </Button>
              {Object.entries(sourceInfo).map(([source, info]) => {
                const Icon = info.icon
                return (
                  <Button
                    key={source}
                    variant={selectedSource?.includes(source as any) ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSourceFilter([source as any])}
                    className="flex items-center gap-1"
                  >
                    <Icon className={cn('w-4 h-4', info.color)} />
                    {info.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{todos.length}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">
                    {todos.filter(t => t.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {todos.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <Square className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {todos.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <CheckSquare className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Todo List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtered Todos ({todos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No todos found</p>
                <p className="text-sm mt-1">Create your first todo or adjust filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todos
                  .filter(todo => !todo.parentId) // Only show top-level todos
                  .map(todo => renderTodo(todo))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Todos by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(todosBySource).map(([source, sourceTodos]) => {
                const info = sourceInfo[source as keyof typeof sourceInfo]
                const Icon = info?.icon || Plus
                return (
                  <div key={source} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('w-5 h-5', info?.color)} />
                      <h3 className="font-medium">{info?.label || source}</h3>
                    </div>
                    <p className="text-2xl font-bold">{sourceTodos.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {sourceTodos.filter(t => t.status === 'completed').length} completed
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
