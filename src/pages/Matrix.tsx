import { useState, useRef, useEffect } from 'react'
import { useBrainDumpStore } from '@/store/braindump'
import { getQuadrant, getQuadrantInfo, linearToLog } from '@/lib/priorityUtils'
import { cn } from '@/lib/utils'
import { evaluateTaskCompletion } from '@/lib/taskCompletionUtils'
import {
  MoreVertical,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Menu,
  List,
  Network,
} from 'lucide-react'
import type { BrainDumpNode } from '@/types/braindump'
import { TimeboxContextMenu } from '@/components/TimeboxContextMenu'
import { AttemptDialog } from '@/components/AttemptDialog'
import { RecurrenceDialog } from '@/components/RecurrenceDialog'
import { CardDeck, useCardDeck } from '@/components/CardDeck'
import { HierarchicalCard } from '@/components/HierarchicalCard'
import type { HierarchyNode } from '@/lib/hierarchyUtils'

interface MatrixTask extends BrainDumpNode {
  quadrant?: 'do-first' | 'schedule' | 'delegate' | 'eliminate'
}

export function Matrix() {
  const { currentEntry, updateNode, deleteNode } = useBrainDumpStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [draggedTask, setDraggedTask] = useState<MatrixTask | null>(null)
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [useHierarchicalView, setUseHierarchicalView] = useState(false)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())

  // Card deck state management
  const cardDeckState = useCardDeck(currentEntry?.nodes || [], currentEntry?.edges || [])

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    task: MatrixTask
  } | null>(null)

  // Dialog states
  const [attemptDialog, setAttemptDialog] = useState<{
    taskId: string
    taskLabel: string
    attempts: any[]
  } | null>(null)

  const [recurrenceDialog, setRecurrenceDialog] = useState<{
    taskId: string
    taskLabel: string
    currentPattern?: any
    taskType?: 'one-time' | 'recurring' | 'habit'
  } | null>(null)

  // Show loading state if no entry is selected
  if (!currentEntry) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No Brain Dump Selected</h2>
          <p className="text-gray-600">Please select or create a brain dump to view the matrix.</p>
        </div>
      </div>
    )
  }

  // Get nodes from current entry
  const nodes = currentEntry?.nodes || []
  const edges = currentEntry?.edges || []

  // Build parent-child relationships
  const buildParentChildMap = () => {
    const parentMap = new Map<string, string>() // child -> parent
    const childrenMap = new Map<string, string[]>() // parent -> children[]
    
    edges.forEach(edge => {
      parentMap.set(edge.target, edge.source)
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, [])
      }
      childrenMap.get(edge.source)!.push(edge.target)
    })
    
    return { parentMap, childrenMap }
  }

  const { parentMap, childrenMap } = buildParentChildMap()

  // Get all descendant node IDs for a given node (recursively)
  const getDescendants = (nodeId: string): string[] => {
    const children = childrenMap.get(nodeId) || []
    const descendants = [...children]
    children.forEach(childId => {
      descendants.push(...getDescendants(childId))
    })
    return descendants
  }

  // Filter tasks based on collapsed state
  const tasks: MatrixTask[] = nodes
    .filter(node => node.type !== 'root') // Show all nodes except root
    .filter(node => showCompleted || node.data.status !== 'completed')
    .filter(node => selectedCategory === 'all' || node.data.category === selectedCategory)
    .filter(
      node =>
        searchQuery === '' || node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(node => {
      // Hide nodes whose parents are collapsed
      const parent = parentMap.get(node.id)
      if (parent && collapsedNodes.has(parent)) {
        return false
      }
      return true
    })
    .map(node => ({
      ...node,
      quadrant: getQuadrant(node.data.importance ?? 5, node.data.urgency ?? 5),
    }))

  // Get unique categories
  const categories = Array.from(
    new Set(nodes.filter(n => n.type === 'category').map(n => n.data.label))
  )

  // Group tasks by quadrant
  const quadrants = {
    'do-first': tasks.filter(t => t.quadrant === 'do-first'),
    schedule: tasks.filter(t => t.quadrant === 'schedule'),
    delegate: tasks.filter(t => t.quadrant === 'delegate'),
    eliminate: tasks.filter(t => t.quadrant === 'eliminate'),
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: MatrixTask) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverQuadrant(null)
  }

  const handleDragOver = (e: React.DragEvent, quadrant: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverQuadrant(quadrant)
  }

  const handleDragLeave = () => {
    setDragOverQuadrant(null)
  }

  const handleDrop = (e: React.DragEvent, quadrant: string) => {
    e.preventDefault()
    setDragOverQuadrant(null)

    if (!draggedTask) return

    // Map quadrant to importance/urgency values
    const quadrantValues = {
      'do-first': { importance: 8, urgency: 8 },
      schedule: { importance: 8, urgency: 3 },
      delegate: { importance: 3, urgency: 8 },
      eliminate: { importance: 3, urgency: 3 },
    }

    const values = quadrantValues[quadrant as keyof typeof quadrantValues]
    if (values) {
      updateNode(draggedTask.id, {
        ...draggedTask.data,
        importance: linearToLog(values.importance),
        urgency: linearToLog(values.urgency),
      })
    }
  }

  const toggleTaskStatus = (taskId: string, currentStatus?: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    
    // Evaluate smart completion logic
    const completionResult = evaluateTaskCompletion(
      taskId,
      newStatus as any,
      nodes,
      edges
    )
    
    // Update the primary task
    updateNode(taskId, {
      ...task.data,
      taskStatus: newStatus,
    })
    
    // Handle cascading completions
    completionResult.affectedNodeIds.forEach(nodeId => {
      if (nodeId !== taskId) {
        const affectedNode = nodes.find(n => n.id === nodeId)
        if (affectedNode) {
          if (completionResult.shouldCompleteParent || completionResult.shouldCompleteChildren) {
            updateNode(nodeId, {
              ...affectedNode.data,
              taskStatus: newStatus,
            })
          }
        }
      }
    })
    
    // Show message if there were cascading effects
    if (completionResult.message && completionResult.affectedNodeIds.length > 1) {
      console.log(completionResult.message) // Could be replaced with toast notification
    }
  }

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, task: MatrixTask) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
    })
  }

  const handleHierarchicalContextMenu = (e: React.MouseEvent, node: HierarchyNode) => {
    e.preventDefault()
    const task: MatrixTask = {
      ...node,
      quadrant: getQuadrant(node.data.importance, node.data.urgency) as any,
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
    })
  }

  const handleUpdateTask = (taskId: string, updates: { importance?: number; urgency?: number }) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    updateNode(taskId, {
      ...task.data,
      ...updates,
    })
  }

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    toggleTaskStatus(taskId, completed ? 'pending' : 'completed')
  }

  const handleRecordAttempt = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const attempts = task.data.attempts || []
    setAttemptDialog({
      taskId,
      taskLabel: task.data.label,
      attempts,
    })
  }

  const handleViewAttempts = (taskId: string) => {
    handleRecordAttempt(taskId)
  }

  const handleMakeRecurring = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    setRecurrenceDialog({
      taskId: task.id,
      taskLabel: task.data.label,
      currentPattern: task.data.recurrencePattern,
      taskType: task.data.taskType || 'one-time',
    })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteNode(taskId)
  }

  // Collapse/expand handlers
  const handleCollapseChildren = (taskId: string) => {
    setCollapsedNodes(prev => new Set(prev).add(taskId))
  }

  const handleExpandChildren = (taskId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  const handleCollapseToParent = (taskId: string, parentId: string) => {
    setCollapsedNodes(prev => new Set(prev).add(parentId))
  }

  const renderTask = (task: MatrixTask) => {
    const quadrantInfo = getQuadrantInfo(task.quadrant || 'eliminate')
    const children = childrenMap.get(task.id) || []
    const hasChildren = children.length > 0
    const isCollapsed = collapsedNodes.has(task.id)
    const collapsedChildrenCount = isCollapsed ? getDescendants(task.id).length : 0

    return (
      <div
        key={task.id}
        draggable
        onDragStart={e => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        onContextMenu={e => handleContextMenu(e, task)}
        className={cn(
          'p-3 rounded-lg border cursor-move transition-all',
          'hover:shadow-md active:shadow-lg',
          task.data.status === 'completed' && 'opacity-60',
          draggedTask?.id === task.id && 'opacity-50',
          quadrantInfo.color,
          isCollapsed && hasChildren && 'ring-2 ring-blue-200 ring-opacity-50'
        )}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={() => toggleTaskStatus(task.id, task.data.status)}
            className="mt-0.5 text-gray-500 hover:text-gray-700"
          >
            {task.data.status === 'completed' ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-lg">{quadrantInfo.icon}</span>
              <p
                className={cn(
                  'text-sm font-medium',
                  task.data.status === 'completed' && 'line-through'
                )}
              >
                {task.data.label}
              </p>
              {isCollapsed && collapsedChildrenCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {collapsedChildrenCount} hidden
                </span>
              )}
            </div>

            {task.data.category && (
              <span className="text-xs text-gray-500">{task.data.category}</span>
            )}
          </div>

          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderQuadrant = (
    quadrantKey: string,
    title: string,
    description: string,
    icon: string,
    colorClass: string
  ) => {
    const tasks = quadrants[quadrantKey as keyof typeof quadrants]

    return (
      <div
        className={cn(
          'rounded-lg border-2 p-4 min-h-[300px] transition-all',
          dragOverQuadrant === quadrantKey && 'ring-2 ring-blue-400 border-blue-400',
          colorClass
        )}
        onDragOver={e => handleDragOver(e, quadrantKey)}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, quadrantKey)}
      >
        <div className="mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        <div className="space-y-2">
          {tasks.map(task => renderTask(task))}

          {tasks.length === 0 && <p className="text-center text-gray-400 py-8">Drop tasks here</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300',
          'lg:relative lg:translate-x-0',
          'fixed inset-y-0 left-0 z-50',
          isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'
        )}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Tasks</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={e => setShowCompleted(e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm">Show completed</span>
            </label>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No tasks found</p>
                <p className="text-sm text-gray-400">
                  Create tasks in the Brain Dump view to see them here
                </p>
              </div>
            ) : useHierarchicalView ? (
              <CardDeck
                nodes={tasks}
                edges={currentEntry?.edges || []}
                selectedNodeId={cardDeckState.selectedNodeId}
                focusedNodeId={cardDeckState.focusedNodeId}
                showHierarchy={cardDeckState.showHierarchy}
                filterQuery={searchQuery}
                onNodeSelect={cardDeckState.selectNode}
                onNodeFocus={cardDeckState.focusNode}
                onNodeContextMenu={handleHierarchicalContextMenu}
                onNodeStatusToggle={(nodeId, completed) => handleTaskComplete(nodeId, completed)}
                draggable={false}
                className="space-y-1"
                cardClassName="text-sm"
                emptyStateMessage="No tasks match your filters"
              />
            ) : (
              tasks.map(task => renderTask(task))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Eisenhower Matrix</h1>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setUseHierarchicalView(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  !useHierarchicalView
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setUseHierarchicalView(true)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  useHierarchicalView
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Network className="w-4 h-4" />
                Hierarchy
              </button>
            </div>
          </div>

          {/* Matrix Content */}
          {useHierarchicalView ? (
            /* Hierarchical View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Do First Quadrant */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <span className="text-2xl">🔥</span>
                  Do First
                </h3>
                <p className="text-sm text-gray-600 mb-4">Important & Urgent</p>
                <CardDeck
                  nodes={quadrants['do-first']}
                  edges={currentEntry?.edges || []}
                  selectedNodeId={cardDeckState.selectedNodeId}
                  focusedNodeId={cardDeckState.focusedNodeId}
                  showHierarchy={cardDeckState.showHierarchy}
                  filterQuery={cardDeckState.filterQuery}
                  onNodeSelect={cardDeckState.selectNode}
                  onNodeFocus={cardDeckState.focusNode}
                  onNodeContextMenu={handleHierarchicalContextMenu}
                  onNodeStatusToggle={(nodeId, completed) => handleTaskComplete(nodeId, completed)}
                  draggable={true}
                  emptyStateMessage="No urgent & important tasks"
                />
              </div>

              {/* Schedule Quadrant */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <span className="text-2xl">📅</span>
                  Schedule
                </h3>
                <p className="text-sm text-gray-600 mb-4">Important, Not Urgent</p>
                <CardDeck
                  nodes={quadrants['schedule']}
                  edges={currentEntry?.edges || []}
                  selectedNodeId={cardDeckState.selectedNodeId}
                  focusedNodeId={cardDeckState.focusedNodeId}
                  showHierarchy={cardDeckState.showHierarchy}
                  filterQuery={cardDeckState.filterQuery}
                  onNodeSelect={cardDeckState.selectNode}
                  onNodeFocus={cardDeckState.focusNode}
                  onNodeContextMenu={handleHierarchicalContextMenu}
                  onNodeStatusToggle={(nodeId, completed) => handleTaskComplete(nodeId, completed)}
                  draggable={true}
                  emptyStateMessage="No important, non-urgent tasks"
                />
              </div>

              {/* Delegate Quadrant */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <span className="text-2xl">👥</span>
                  Delegate
                </h3>
                <p className="text-sm text-gray-600 mb-4">Urgent, Not Important</p>
                <CardDeck
                  nodes={quadrants['delegate']}
                  edges={currentEntry?.edges || []}
                  selectedNodeId={cardDeckState.selectedNodeId}
                  focusedNodeId={cardDeckState.focusedNodeId}
                  showHierarchy={cardDeckState.showHierarchy}
                  filterQuery={cardDeckState.filterQuery}
                  onNodeSelect={cardDeckState.selectNode}
                  onNodeFocus={cardDeckState.focusNode}
                  onNodeContextMenu={handleHierarchicalContextMenu}
                  onNodeStatusToggle={(nodeId, completed) => handleTaskComplete(nodeId, completed)}
                  draggable={true}
                  emptyStateMessage="No urgent, unimportant tasks"
                />
              </div>

              {/* Eliminate Quadrant */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <span className="text-2xl">🗑️</span>
                  Eliminate
                </h3>
                <p className="text-sm text-gray-600 mb-4">Not Important or Urgent</p>
                <CardDeck
                  nodes={quadrants['eliminate']}
                  edges={currentEntry?.edges || []}
                  selectedNodeId={cardDeckState.selectedNodeId}
                  focusedNodeId={cardDeckState.focusedNodeId}
                  showHierarchy={cardDeckState.showHierarchy}
                  filterQuery={cardDeckState.filterQuery}
                  onNodeSelect={cardDeckState.selectNode}
                  onNodeFocus={cardDeckState.focusNode}
                  onNodeContextMenu={handleHierarchicalContextMenu}
                  onNodeStatusToggle={(nodeId, completed) => handleTaskComplete(nodeId, completed)}
                  draggable={true}
                  emptyStateMessage="No low-priority tasks"
                />
              </div>
            </div>
          ) : (
            /* Traditional Grid View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Important + Urgent */}
              {renderQuadrant(
                'do-first',
                'Do First',
                'Important & Urgent',
                '🔥',
                'bg-red-50 border-red-200'
              )}

              {/* Important + Not Urgent */}
              {renderQuadrant(
                'schedule',
                'Schedule',
                'Important, Not Urgent',
                '📅',
                'bg-blue-50 border-blue-200'
              )}

              {/* Not Important + Urgent */}
              {renderQuadrant(
                'delegate',
                'Delegate',
                'Urgent, Not Important',
                '👥',
                'bg-yellow-50 border-yellow-200'
              )}

              {/* Not Important + Not Urgent */}
              {renderQuadrant(
                'eliminate',
                'Eliminate',
                'Not Important or Urgent',
                '🗑️',
                'bg-gray-50 border-gray-200'
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-2">How to use</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Switch between Grid and Hierarchy views using the toggle above</li>
              <li>
                •{' '}
                {useHierarchicalView
                  ? 'Expand/collapse parent tasks to see subtasks'
                  : 'Drag tasks between quadrants to update their priority'}
              </li>
              <li>
                • Right-click on tasks for more options (set priority, record attempts, make
                recurring)
              </li>
              <li>• Tasks are automatically categorized based on importance and urgency</li>
              <li>• Use the sidebar to filter and search tasks</li>
              <li>• Click the checkbox to mark tasks as completed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <TimeboxContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          task={{
            id: contextMenu.task.id,
            label: contextMenu.task.data.label,
            importance: contextMenu.task.data.importance,
            urgency: contextMenu.task.data.urgency,
            status: contextMenu.task.data.status,
            attempts: contextMenu.task.data.attempts,
            dueDate: contextMenu.task.data.dueDate,
            hasChildren: (childrenMap.get(contextMenu.task.id) || []).length > 0,
            parentId: parentMap.get(contextMenu.task.id),
            parentLabel: parentMap.get(contextMenu.task.id) ? 
              nodes.find(n => n.id === parentMap.get(contextMenu.task.id))?.data.label : undefined,
            isCollapsed: collapsedNodes.has(contextMenu.task.id),
            childrenCount: getDescendants(contextMenu.task.id).length,
          }}
          onUpdateTask={handleUpdateTask}
          onTaskComplete={handleTaskComplete}
          onRecordAttempt={handleRecordAttempt}
          onViewAttempts={handleViewAttempts}
          onMakeRecurring={handleMakeRecurring}
          onDeleteTask={handleDeleteTask}
          onCollapseChildren={handleCollapseChildren}
          onExpandChildren={handleExpandChildren}
          onCollapseToParent={handleCollapseToParent}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Attempt Dialog */}
      {attemptDialog && (
        <AttemptDialog
          taskId={attemptDialog.taskId}
          taskLabel={attemptDialog.taskLabel}
          attempts={attemptDialog.attempts}
          onSave={(taskId, attempt) => {
            const task = tasks.find(t => t.id === taskId)
            if (!task) return

            const attempts = [...(task.data.attempts || []), attempt]
            updateNode(taskId, {
              ...task.data,
              attempts,
              totalAttempts: attempts.length,
              status: attempt.outcome === 'success' ? 'completed' : 'in-progress',
            })

            setAttemptDialog(null)
          }}
          onClose={() => setAttemptDialog(null)}
        />
      )}

      {/* Recurrence Dialog */}
      {recurrenceDialog && (
        <RecurrenceDialog
          taskId={recurrenceDialog.taskId}
          taskLabel={recurrenceDialog.taskLabel}
          currentPattern={recurrenceDialog.currentPattern}
          currentTaskType={recurrenceDialog.taskType}
          onSave={(taskId, pattern, taskType) => {
            const task = tasks.find(t => t.id === taskId)
            if (!task) return

            updateNode(taskId, {
              ...task.data,
              taskType: pattern ? taskType : 'one-time',
              recurrencePattern: pattern,
              recurringCompletions: pattern ? [] : undefined,
              currentStreak: 0,
              longestStreak: 0,
            })

            setRecurrenceDialog(null)
          }}
          onClose={() => setRecurrenceDialog(null)}
        />
      )}
    </div>
  )
}
