import { useState, useEffect } from 'react'
import { useTimeboxStore, type TimeboxTask } from '@/store/useTimeboxStore'
import { useBrainDumpStore } from '@/store/braindump'
import type { BrainDumpNode } from '@/types/braindump'
import { getQuadrant, getQuadrantInfo, logToLinear } from '@/lib/priorityUtils'
import { cn } from '@/lib/utils'
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { format, addDays, subDays } from '@/lib/dateUtils'
import { TimeboxContextMenu } from '@/components/TimeboxContextMenu'
import { AttemptDialog } from '@/components/AttemptDialog'

type SortOption = 'priority' | 'eisenhower' | 'importance' | 'urgency' | 'dueDate' | 'alphabetical'

// Helper functions for priority visualization
function getPriorityColor(importance?: number, urgency?: number) {
  // If either importance or urgency is undefined, return neutral styling
  if (importance === undefined || urgency === undefined) {
    return {
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      borderColor: 'border-gray-300 dark:border-gray-600',
      textColor: 'text-gray-700 dark:text-gray-300'
    }
  }
  
  const quadrant = getQuadrant(importance, urgency)
  const info = getQuadrantInfo(quadrant)
  const colors = info.color.split(' ')
  
  return {
    bgColor: colors.find(c => c.startsWith('bg-')) || 'bg-gray-100',
    borderColor: colors.find(c => c.startsWith('border-')) || 'border-gray-300',
    textColor: colors.find(c => c.startsWith('text-')) || 'text-gray-900'
  }
}

function getPriorityIcon(importance?: number, urgency?: number) {
  // If either importance or urgency is undefined, return a question mark to indicate unset priority
  if (importance === undefined || urgency === undefined) {
    return '❓'
  }
  
  const quadrant = getQuadrant(importance, urgency)
  const info = getQuadrantInfo(quadrant)
  return info.icon
}

// Sorting function
function sortTasks(tasks: TimeboxTask[], sortBy: SortOption): TimeboxTask[] {
  return [...tasks].sort((a, b) => {
    // Put tasks without priorities at the bottom for priority-based sorts
    const hasAPriority = a.importance !== undefined && a.urgency !== undefined
    const hasBPriority = b.importance !== undefined && b.urgency !== undefined
    
    if (!hasAPriority && !hasBPriority) {
      return a.label.localeCompare(b.label) // Alphabetical for both undefined
    }
    if (!hasAPriority) return 1 // a goes to bottom
    if (!hasBPriority) return -1 // b goes to bottom
    
    switch (sortBy) {
      case 'priority':
        // Combined score: importance + urgency (higher is better)
        const scoreA = (a.importance ?? 0) + (a.urgency ?? 0)
        const scoreB = (b.importance ?? 0) + (b.urgency ?? 0)
        return scoreB - scoreA
        
      case 'eisenhower':
        // Sort by quadrant order
        const quadrantOrder: Record<string, number> = { 
          'do-first': 0, 
          'schedule': 1, 
          'delegate': 2, 
          'eliminate': 3 
        }
        const quadA = getQuadrant(a.importance, a.urgency)
        const quadB = getQuadrant(b.importance, b.urgency)
        const orderDiff = quadrantOrder[quadA] - quadrantOrder[quadB]
        // If same quadrant, sort by combined score
        if (orderDiff === 0) {
          const scoreA = (a.importance ?? 0) + (a.urgency ?? 0)
          const scoreB = (b.importance ?? 0) + (b.urgency ?? 0)
          return scoreB - scoreA
        }
        return orderDiff
        
      case 'importance':
        const impDiff = (b.importance ?? 0) - (a.importance ?? 0)
        return impDiff !== 0 ? impDiff : a.label.localeCompare(b.label)
        
      case 'urgency':
        const urgDiff = (b.urgency ?? 0) - (a.urgency ?? 0)
        return urgDiff !== 0 ? urgDiff : a.label.localeCompare(b.label)
        
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return a.label.localeCompare(b.label)
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        
      case 'alphabetical':
        return a.label.localeCompare(b.label)
        
      default:
        return 0
    }
  })
}

export default function Timebox() {
  const { 
    selectedDate, 
    timeSlots, 
    setSelectedDate, 
    initializeTimeSlots,
    addTaskToSlot,
    removeTaskFromSlot,
    moveTaskBetweenSlots,
    updateTaskInSlot,
    setDraggedTask,
    setHoveredSlotId,
    hoveredSlotId
  } = useTimeboxStore()
  
  
  const { entries, updateNode } = useBrainDumpStore()
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    task: TimeboxTask
    slotId?: string
  } | null>(null)
  
  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('timebox-sort')
    return (saved as SortOption) || 'priority'
  })
  
  // Show completed state
  const [showCompleted, setShowCompleted] = useState(() => {
    const saved = localStorage.getItem('timebox-show-completed')
    return saved !== 'false' // Default to true
  })
  
  // Attempt dialog state
  const [attemptDialog, setAttemptDialog] = useState<{
    taskId: string
    taskLabel: string
    attempts: any[]
  } | null>(null)
  
  // Analyze nodes for task extraction
  const allNodes = entries.flatMap(entry => entry.nodes)
  const thoughtNodes = allNodes.filter(node => node.type === 'thought')
  
  // Separate nodes by priority status
  const nodesWithPriority = thoughtNodes.filter(node => 
    node.data.importance !== undefined && node.data.urgency !== undefined
  )
  const nodesWithoutPriority = thoughtNodes.filter(node => 
    node.data.importance === undefined || node.data.urgency === undefined
  )
  
  // Group by quadrant for analysis
  const nodesByQuadrant = nodesWithPriority.reduce((acc, node) => {
    const quadrant = getQuadrant(node.data.importance, node.data.urgency)
    if (!acc[quadrant]) acc[quadrant] = []
    acc[quadrant].push(node)
    return acc
  }, {} as Record<string, typeof thoughtNodes>)
  
  // Extract all tasks from brain dumps and convert to TimeboxTask
  // Temporarily show all nodes that aren't category nodes to debug
  const allTasks: TimeboxTask[] = entries.flatMap(entry => 
    entry.nodes
      .filter(node => {
        // Show thought nodes that aren't already timed and aren't subtasks
        // We'll refine this once we understand the data better
        return (node.type === 'thought' || node.data.category === 'tasks') && 
               !node.data.isTimedTask &&
               !node.data.parentTaskId // Don't show subtasks in the main list
      })
      .map(node => ({
        id: node.id,
        label: node.data.label,
        category: node.data.category || 'uncategorized',
        importance: node.data.importance,
        urgency: node.data.urgency,
        dueDate: node.data.dueDate,
        status: node.data.taskStatus || 'pending',
        completedAt: node.data.completedAt,
        attempts: node.data.attempts || [],
        totalAttempts: node.data.totalAttempts || 0,
        originalNode: node
      }))
  )
  
  // Apply filtering and sorting to tasks
  const filteredTasks = showCompleted 
    ? allTasks 
    : allTasks.filter(task => task.status !== 'completed')
  const sortedTasks = sortTasks(filteredTasks, sortBy)
  
  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('timebox-sort', sortBy)
  }, [sortBy])
  
  useEffect(() => {
    localStorage.setItem('timebox-show-completed', showCompleted.toString())
  }, [showCompleted])
  
  useEffect(() => {
    initializeTimeSlots()
  }, [initializeTimeSlots])
  
  // Load scheduled tasks into time slots
  useEffect(() => {
    // First, initialize empty time slots
    initializeTimeSlots()
    
    // Find all tasks scheduled for the selected date
    const scheduledTasks = entries.flatMap(entry =>
      entry.nodes
        .filter(node => 
          node.data.isTimedTask && 
          node.data.timeboxDate === selectedDate
        )
        .map(node => ({
          id: node.id,
          label: node.data.label,
          category: node.data.category || 'uncategorized',
          importance: node.data.importance,
          urgency: node.data.urgency,
          dueDate: node.data.dueDate,
          status: node.data.taskStatus || 'pending',
          completedAt: node.data.completedAt,
          attempts: node.data.attempts || [],
          totalAttempts: node.data.totalAttempts || 0,
          timeboxStartTime: node.data.timeboxStartTime,
          timeboxDuration: node.data.timeboxDuration,
          timeboxDate: node.data.timeboxDate,
          isTimedTask: true,
          originalNode: node
        }))
    )
    
    // Add scheduled tasks to appropriate slots
    scheduledTasks.forEach(task => {
      const slotId = `slot-${task.timeboxStartTime?.replace(':', '')}`
      if (task.timeboxStartTime) {
        addTaskToSlot(task, slotId)
      }
    })
  }, [selectedDate, entries, initializeTimeSlots, addTaskToSlot]) // Re-run when date or entries change
  
  const handleDateChange = (days: number) => {
    const currentDate = new Date(selectedDate)
    const newDate = days > 0 ? addDays(currentDate, days) : subDays(currentDate, Math.abs(days))
    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
  }
  
  const handleDragStart = (e: React.DragEvent, task: TimeboxTask) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('taskData', JSON.stringify(task))
    setDraggedTask(task)
  }
  
  const handleDragEnd = () => {
    setDraggedTask(null)
    setHoveredSlotId(null)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDragEnter = (slotId: string) => {
    setHoveredSlotId(slotId)
  }
  
  const handleDragLeave = () => {
    setHoveredSlotId(null)
  }
  
  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault()
    const taskData = e.dataTransfer.getData('taskData')
    const fromSlotId = e.dataTransfer.getData('fromSlotId')
    
    if (taskData) {
      const task = JSON.parse(taskData) as TimeboxTask
      const slot = timeSlots.find(s => s.id === slotId)
      
      if (!slot) return
      
      if (fromSlotId) {
        // Moving between slots
        moveTaskBetweenSlots(task.id, fromSlotId, slotId)
        
        // Update the brain dump node
        if (task.originalNode) {
          updateNode(task.id, {
            ...task.originalNode.data,
            timeboxStartTime: slot.startTime,
            timeboxDate: selectedDate
          })
        }
      } else {
        // Adding new task from sidebar
        addTaskToSlot(task, slotId)
        
        // Update the brain dump node to mark it as scheduled
        if (task.originalNode) {
          updateNode(task.id, {
            ...task.originalNode.data,
            isTimedTask: true,
            timeboxDate: selectedDate,
            timeboxStartTime: slot.startTime,
            timeboxDuration: 120
          })
        }
      }
    }
    
    setHoveredSlotId(null)
  }
  
  const handleTaskDragStart = (e: React.DragEvent, task: TimeboxTask, slotId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('taskData', JSON.stringify(task))
    e.dataTransfer.setData('fromSlotId', slotId)
    setDraggedTask(task)
  }
  
  const handleRightClick = (e: React.MouseEvent, task: TimeboxTask, slotId?: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
      slotId
    })
  }
  
  const handleUpdateTask = (taskId: string, updates: { importance?: number; urgency?: number }) => {
    // Update the task in the timebox store
    if (contextMenu?.slotId) {
      updateTaskInSlot(taskId, updates)
    }
    
    // Also update the original node in the brain dump
    const task = allTasks.find(t => t.id === taskId)
    if (task?.originalNode) {
      updateNode(taskId, {
        ...task.originalNode.data,
        ...updates
      })
    }
    
    // Update the task in our local array
    const taskIndex = allTasks.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates }
    }
  }
  
  const handleTaskComplete = (taskId: string, completed: boolean) => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    
    const updates = {
      taskStatus: completed ? 'completed' as const : 'pending' as const,
      completedAt: completed ? new Date().toISOString() : undefined
    }
    
    // Update the original node
    if (task.originalNode) {
      updateNode(taskId, {
        ...task.originalNode.data,
        ...updates
      })
    }
  }
  
  const handleRecordAttempt = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId) || 
                timeSlots.flatMap(s => s.tasks).find(t => t.id === taskId)
    if (!task) return
    
    setAttemptDialog({
      taskId: task.id,
      taskLabel: task.label,
      attempts: task.attempts || []
    })
  }
  
  const handleAddAttempt = (taskId: string, attempt: any) => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    
    const newAttempt = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...attempt
    }
    
    const updates = {
      attempts: [...(task.attempts || []), newAttempt],
      totalAttempts: (task.totalAttempts || 0) + 1,
      taskStatus: attempt.outcome === 'success' ? 'completed' as const : 'in-progress' as const,
      completedAt: attempt.outcome === 'success' ? new Date().toISOString() : undefined
    }
    
    // Update the original node
    if (task.originalNode) {
      updateNode(taskId, {
        ...task.originalNode.data,
        ...updates
      })
    }
    
    setAttemptDialog(null)
  }
  
  // Subtask handling functions
  const handleAddSubtask = (parentId: string, label: string) => {
    const parentTask = allTasks.find(t => t.id === parentId)
    if (!parentTask) return
    
    // Create a new node for the subtask
    const subtaskId = `subtask-${Date.now()}`
    const subtaskNode: BrainDumpNode = {
      id: subtaskId,
      type: 'thought',
      position: { x: 0, y: 0 },
      data: {
        label,
        category: parentTask.category,
        parentTaskId: parentId,
        taskStatus: 'pending',
        importance: parentTask.importance, // Inherit parent's priority
        urgency: parentTask.urgency
      }
    }
    
    // Add the subtask node to the brain dump
    const entryId = entries[0]?.id // Use the first entry for now
    if (entryId) {
      // This would need to be implemented in the brain dump store
      // For now, we'll just update the parent task
      const updatedSubtasks = [...(parentTask.subtasks || []), subtaskId]
      updateNode(parentId, {
        ...parentTask.originalNode!.data,
        subtasks: updatedSubtasks,
        subtaskProgress: {
          completed: 0,
          total: updatedSubtasks.length
        }
      })
    }
  }
  
  const handleToggleSubtask = (taskId: string, completed: boolean) => {
    handleTaskComplete(taskId, completed)
    
    // Update parent task's subtask progress
    const subtask = allTasks.find(t => t.id === taskId)
    if (subtask?.parentTaskId) {
      const parentTask = allTasks.find(t => t.id === subtask.parentTaskId)
      if (parentTask && parentTask.subtasks) {
        const subtaskNodes = allTasks.filter(t => 
          parentTask.subtasks?.includes(t.id)
        )
        const completedCount = subtaskNodes.filter(t => 
          t.status === 'completed'
        ).length
        
        updateNode(subtask.parentTaskId, {
          ...parentTask.originalNode!.data,
          subtaskProgress: {
            completed: completedCount,
            total: parentTask.subtasks.length
          }
        })
      }
    }
  }
  
  const getSubtasksForTask = (taskId: string): TimeboxTask[] => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task?.subtasks) return []
    
    return allTasks.filter(t => 
      task.subtasks?.includes(t.id) || t.parentTaskId === taskId
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar with unscheduled tasks */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Unscheduled Tasks
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Drag tasks to time slots
            </p>
            
            {/* Sort selector */}
            <div className="mt-3 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 text-sm px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brain-500"
              >
                <option value="priority">Priority (High → Low)</option>
                <option value="eisenhower">Do First → Eliminate</option>
                <option value="importance">Importance Only</option>
                <option value="urgency">Urgency Only</option>
                <option value="dueDate">Due Date</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
            
            {/* Show completed checkbox */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="show-completed"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-brain-600 focus:ring-brain-500"
              />
              <label htmlFor="show-completed" className="text-sm text-gray-600 dark:text-gray-400">
                Show completed tasks
              </label>
            </div>
          </div>
          
          <div className="p-4 space-y-2">
            
            {sortedTasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No unscheduled tasks found
              </p>
            ) : (
              sortedTasks.map(task => {
                const { bgColor, borderColor } = getPriorityColor(
                  task.importance,
                  task.urgency
                )
                const priorityIcon = getPriorityIcon(task.importance, task.urgency)
                
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleRightClick(e, task)}
                    className={cn(
                      'p-3 rounded-lg cursor-move transition-all',
                      'hover:shadow-md hover:scale-[1.02]',
                      bgColor,
                      borderColor,
                      'border-2'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleTaskComplete(task.id, e.target.checked)
                        }}
                        className="mt-1 rounded border-gray-300 text-brain-600 focus:ring-brain-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-lg">{priorityIcon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium",
                            task.status === 'completed' 
                              ? "line-through text-gray-500 dark:text-gray-500" 
                              : "text-gray-900 dark:text-gray-100"
                          )}>
                            {task.label}
                          </p>
                          {task.totalAttempts > 0 && (
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                              🔄{task.totalAttempts}
                            </span>
                          )}
                          {task.status === 'in-progress' && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                              In Progress
                            </span>
                          )}
                        </div>
                        {(task.importance === undefined || task.urgency === undefined) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            Right-click to set priority
                          </p>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Due: {format(new Date(task.dueDate), 'MMM d')}
                          </p>
                        )}
                        {task.subtaskProgress && task.subtaskProgress.total > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Subtasks: {task.subtaskProgress.completed}/{task.subtaskProgress.total}
                              </span>
                              <div className="flex-1 max-w-[100px] h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 transition-all duration-300"
                                  style={{ width: `${(task.subtaskProgress.completed / task.subtaskProgress.total) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        
        {/* Main timebox grid */}
        <div className="flex-1 overflow-y-auto">
          {/* Date navigation */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Timebox Schedule
              </h1>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDateChange(-1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {(() => {
                      // Parse the date in local time zone to avoid UTC conversion issues
                      const [year, month, day] = selectedDate.split('-').map(Number)
                      const localDate = new Date(year, month - 1, day)
                      return format(localDate, 'EEEE, MMMM d')
                    })()}
                  </span>
                </div>
                
                <button
                  onClick={() => handleDateChange(1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => {
                    const today = new Date()
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                    setSelectedDate(todayStr)
                  }}
                  className="px-3 py-1 text-sm bg-brain-100 text-brain-800 dark:bg-brain-900 dark:text-brain-200 rounded-lg hover:bg-brain-200 dark:hover:bg-brain-800 transition-colors"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
          
          {/* Time slots grid */}
          <div className="p-4">
            {/* Group slots by period */}
            {['morning', 'afternoon', 'evening', 'night'].map(period => {
              const periodSlots = timeSlots.filter(slot => slot.period === period)
              const periodTitles = {
                morning: 'Morning (6am - 12pm)',
                afternoon: 'Afternoon (12pm - 6pm)', 
                evening: 'Evening (6pm - 12am)',
                night: 'Night (12am - 6am)'
              }
              
              return (
                <div key={period} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 capitalize">
                    {periodTitles[period as keyof typeof periodTitles]}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {periodSlots.map(slot => {
                const isHovered = hoveredSlotId === slot.id
                const isCurrentTime = () => {
                  const now = new Date()
                  const currentHour = now.getHours()
                  const slotStartHour = parseInt(slot.startTime.split(':')[0])
                  const slotEndHour = parseInt(slot.endTime.split(':')[0]) || 24
                  return currentHour >= slotStartHour && currentHour < slotEndHour
                }
                
                return (
                  <div
                    key={slot.id}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(slot.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, slot.id)}
                    className={cn(
                      'min-h-[100px] rounded-lg border-2 transition-all',
                      isHovered 
                        ? 'border-brain-500 bg-brain-50 dark:bg-brain-900/20 scale-[1.01]' 
                        : 'border-gray-200 dark:border-gray-700',
                      isCurrentTime() && selectedDate === format(new Date(), 'yyyy-MM-dd')
                        ? 'bg-space-50 dark:bg-space-900/20' 
                        : 'bg-white dark:bg-gray-800'
                    )}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {slot.displayTime}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          (Block {slot.timeIndex >= 0 ? '+' : ''}{slot.timeIndex})
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {slot.tasks.map(task => {
                          const { bgColor, borderColor } = getPriorityColor(
                            task.importance,
                            task.urgency
                          )
                          const priorityIcon = getPriorityIcon(task.importance, task.urgency)
                          
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleTaskDragStart(e, task, slot.id)}
                              onDragEnd={handleDragEnd}
                              onContextMenu={(e) => handleRightClick(e, task, slot.id)}
                              className={cn(
                                'p-3 rounded-lg cursor-move transition-all',
                                'hover:shadow-md hover:scale-[1.02]',
                                bgColor,
                                borderColor,
                                'border-2'
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={task.status === 'completed'}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    handleTaskComplete(task.id, e.target.checked)
                                  }}
                                  className="mt-1 rounded border-gray-300 text-brain-600 focus:ring-brain-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-lg">{priorityIcon}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={cn(
                                      "font-medium",
                                      task.status === 'completed' 
                                        ? "line-through text-gray-500 dark:text-gray-500" 
                                        : "text-gray-900 dark:text-gray-100"
                                    )}>
                                      {task.label}
                                    </p>
                                    {task.totalAttempts > 0 && (
                                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                        🔄{task.totalAttempts}
                                      </span>
                                    )}
                                    {task.status === 'in-progress' && (
                                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                  {(task.importance === undefined || task.urgency === undefined) && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                                      Right-click to set priority
                                    </p>
                                  )}
                                  <button
                                    onClick={() => {
                                      removeTaskFromSlot(task.id, slot.id)
                                      // Clear timebox properties from brain dump node
                                      if (task.originalNode) {
                                        updateNode(task.id, {
                                          ...task.originalNode.data,
                                          isTimedTask: false,
                                          timeboxDate: undefined,
                                          timeboxStartTime: undefined,
                                          timeboxDuration: undefined
                                        })
                                      }
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 mt-1"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <TimeboxContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          task={contextMenu.task}
          onUpdateTask={handleUpdateTask}
          onTaskComplete={handleTaskComplete}
          onRecordAttempt={handleRecordAttempt}
          onAddSubtask={(taskId) => {
            const label = prompt('Enter subtask description:')
            if (label) {
              handleAddSubtask(taskId, label)
            }
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      {/* Attempt Dialog */}
      {attemptDialog && (
        <AttemptDialog
          taskId={attemptDialog.taskId}
          taskLabel={attemptDialog.taskLabel}
          attempts={attemptDialog.attempts}
          onAddAttempt={(attempt) => handleAddAttempt(attemptDialog.taskId, attempt)}
          onClose={() => setAttemptDialog(null)}
        />
      )}
    </div>
  )
}