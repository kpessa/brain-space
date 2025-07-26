'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUnifiedTodos, type UnifiedTodo } from '@/services/todoAggregator'
import { useJournalStore } from '@/store/journalStore'
import { useNodesStore } from '@/store/nodeStore'
import { useBrainDumpStore } from '@/store/braindumpStore'
import { useRoutineStore } from '@/store/routineStore'
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertCircle, 
  Clock,
  BookOpen,
  Brain,
  Network,
  SunMoon,
  Filter,
  ChevronDown,
  ChevronRight,
  Star,
  Zap,
  Archive
} from 'lucide-react'
import { format } from 'date-fns'

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
type SourceFilter = 'all' | UnifiedTodo['source']
type PriorityFilter = 'all' | UnifiedTodo['priority']

const sourceIcons = {
  journal: <BookOpen className="w-4 h-4" />,
  node: <Network className="w-4 h-4" />,
  braindump: <Brain className="w-4 h-4" />,
  routine: <SunMoon className="w-4 h-4" />,
}

const priorityColors = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-green-600 bg-green-50 border-green-200',
}

export default function TodosClient({ userId }: { userId: string }) {
  const { 
    todos: allTodos, 
    getTodosBySource, 
    getTodosByPriority, 
    getOverdueTodos, 
    getTodaysTodos,
    getUpcomingTodos 
  } = useUnifiedTodos()
  
  // Load data from all stores
  const { loadEntriesFromFirestore: loadJournal } = useJournalStore()
  const { loadNodes } = useNodesStore()
  const { loadEntries: loadBrainDumps } = useBrainDumpStore()
  const { loadEntries: loadRoutines } = useRoutineStore()
  
  const [filter, setFilter] = useState<FilterType>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['today', 'overdue']))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      loadJournal(userId),
      loadNodes(userId),
      loadBrainDumps(userId),
      loadRoutines(userId),
    ]).finally(() => setIsLoading(false))
  }, [userId, loadJournal, loadNodes, loadBrainDumps, loadRoutines])

  const getFilteredTodos = (): UnifiedTodo[] => {
    let filtered = allTodos

    // Apply time-based filter
    switch (filter) {
      case 'today':
        filtered = getTodaysTodos()
        break
      case 'upcoming':
        filtered = getUpcomingTodos(7)
        break
      case 'overdue':
        filtered = getOverdueTodos()
        break
      case 'completed':
        filtered = allTodos.filter(todo => todo.completed)
        break
      default:
        filtered = showCompleted ? allTodos : allTodos.filter(todo => !todo.completed)
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(todo => todo.source === sourceFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(todo => todo.priority === priorityFilter)
    }

    return filtered
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleToggleTodo = async (todo: UnifiedTodo) => {
    // This would need to be implemented based on the source
    // For now, we'll just update nodes as an example
    if (todo.source === 'node') {
      const { updateNode } = useNodesStore.getState()
      await updateNode(todo.sourceId, { 
        completed: !todo.completed,
        completedAt: !todo.completed ? new Date().toISOString() : undefined
      })
    }
  }

  const stats = {
    total: allTodos.filter(t => !t.completed).length,
    today: getTodaysTodos().filter(t => !t.completed).length,
    overdue: getOverdueTodos().length,
    completed: allTodos.filter(t => t.completed).length,
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600"></div>
        </div>
    )
  }

  const filteredTodos = getFilteredTodos()
  const overdueTodos = getOverdueTodos()
  const todayTodos = getTodaysTodos().filter(t => !t.completed)
  const upcomingTodos = getUpcomingTodos(7).filter(t => !t.completed && !todayTodos.includes(t))

  return (
      <div className="bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 -m-8 p-8 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Unified Todos</h1>
            <p className="text-white/80 text-lg">
              All your tasks from every source in one place
            </p>
          </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setFilter('all')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Circle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setFilter('today')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setFilter('overdue')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setFilter('completed')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <CardTitle>Filters</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilter('all')
                  setSourceFilter('all')
                  setPriorityFilter('all')
                  setShowCompleted(false)
                }}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Time</label>
                <div className="flex gap-2">
                  {(['all', 'today', 'upcoming', 'overdue'] as FilterType[]).map(f => (
                    <Button
                      key={f}
                      variant={filter === f ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Source</label>
                <div className="flex gap-2">
                  {(['all', 'journal', 'node', 'braindump', 'routine'] as SourceFilter[]).map(s => (
                    <Button
                      key={s}
                      variant={sourceFilter === s ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSourceFilter(s)}
                    >
                      {s === 'all' ? 'All' : (
                        <div className="flex items-center gap-1">
                          {sourceIcons[s as keyof typeof sourceIcons]}
                          <span className="capitalize">{s}</span>
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map(p => (
                    <Button
                      key={p}
                      variant={priorityFilter === p ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setPriorityFilter(p)}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Completed</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Todo Sections */}
        <div className="space-y-4">
          {/* Overdue Section */}
          {overdueTodos.length > 0 && filter !== 'today' && filter !== 'upcoming' && (
            <Card className="border-red-200">
              <CardHeader 
                className="cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => toggleSection('overdue')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedSections.has('overdue') ? <ChevronDown /> : <ChevronRight />}
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-red-600">Overdue ({overdueTodos.length})</CardTitle>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.has('overdue') && (
                <CardContent>
                  <TodoList todos={overdueTodos} onToggle={handleToggleTodo} />
                </CardContent>
              )}
            </Card>
          )}

          {/* Today Section */}
          {todayTodos.length > 0 && filter !== 'overdue' && filter !== 'upcoming' && (
            <Card className="border-blue-200">
              <CardHeader 
                className="cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => toggleSection('today')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedSections.has('today') ? <ChevronDown /> : <ChevronRight />}
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-blue-600">Today ({todayTodos.length})</CardTitle>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.has('today') && (
                <CardContent>
                  <TodoList todos={todayTodos} onToggle={handleToggleTodo} />
                </CardContent>
              )}
            </Card>
          )}

          {/* Upcoming Section */}
          {upcomingTodos.length > 0 && filter !== 'overdue' && filter !== 'today' && (
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('upcoming')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedSections.has('upcoming') ? <ChevronDown /> : <ChevronRight />}
                    <Clock className="w-5 h-5 text-gray-600" />
                    <CardTitle>Upcoming ({upcomingTodos.length})</CardTitle>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.has('upcoming') && (
                <CardContent>
                  <TodoList todos={upcomingTodos} onToggle={handleToggleTodo} />
                </CardContent>
              )}
            </Card>
          )}

          {/* All Todos (filtered) */}
          {filter === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle>All Tasks ({filteredTodos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <TodoList todos={filteredTodos} onToggle={handleToggleTodo} />
              </CardContent>
            </Card>
          )}

          {/* Completed */}
          {filter === 'completed' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-gray-600" />
                  <CardTitle>Completed ({filteredTodos.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <TodoList todos={filteredTodos} onToggle={handleToggleTodo} />
              </CardContent>
            </Card>
          )}
        </div>

        {filteredTodos.length === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No tasks found with current filters</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setFilter('all')
                  setSourceFilter('all')
                  setPriorityFilter('all')
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
  )
}

function TodoList({ 
  todos, 
  onToggle 
}: { 
  todos: UnifiedTodo[]
  onToggle: (todo: UnifiedTodo) => void 
}) {
  return (
    <div className="space-y-2">
      {todos.map(todo => (
        <div
          key={todo.id}
          className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
            todo.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
          }`}
        >
          <button
            onClick={() => onToggle(todo)}
            className="mt-0.5 flex-shrink-0"
          >
            {todo.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {todo.title}
              </h4>
              {sourceIcons[todo.source]}
              {todo.priority && (
                <Badge className={`text-xs ${priorityColors[todo.priority]}`}>
                  {todo.priority}
                </Badge>
              )}
            </div>
            
            {todo.description && (
              <p className="text-sm text-gray-600 mb-2">{todo.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {todo.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(todo.dueDate), 'MMM d')}</span>
                </div>
              )}
              {todo.tags && todo.tags.length > 0 && (
                <div className="flex gap-1">
                  {todo.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {todo.tags.length > 3 && (
                    <span className="text-gray-400">+{todo.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}