import { useState, useEffect, useCallback } from 'react'
import { useTimeboxStore, type TimeboxTask, type TimeSlot } from '@/store/useTimeboxStore'
import { useBrainDumpStore } from '@/store/braindump'
import type { BrainDumpNode } from '@/types/braindump'
import { getQuadrant, getQuadrantInfo, logToLinear } from '@/lib/priorityUtils'
import { cn } from '@/lib/utils'
import { evaluateTaskCompletion } from '@/lib/taskCompletionUtils'
import { Calendar, Clock, ChevronLeft, ChevronRight, ArrowUpDown, Menu, X } from 'lucide-react'
import { format, addDays, subDays } from '@/lib/dateUtils'
import {
  generateRecurringTaskInstances,
  isRecurringTaskCompletedForDate,
  calculateCurrentStreak,
} from '@/lib/recurringTasks'
import type { RecurringCompletion } from '@/types/braindump'
import { TimeboxContextMenu } from '@/components/TimeboxContextMenu'
import { TimeboxSlotContextMenu } from '@/components/TimeboxSlotContextMenu'
import { AttemptDialog } from '@/components/AttemptDialog'
import { RecurrenceDialog } from '@/components/RecurrenceDialog'
import { useOrientation } from '@/hooks/useOrientation'

type SortOption = 'priority' | 'eisenhower' | 'importance' | 'urgency' | 'dueDate' | 'alphabetical'

// Helper functions for priority visualization
function getPriorityColor(importance?: number, urgency?: number) {
  // If either importance or urgency is undefined, return neutral styling
  if (importance === undefined || urgency === undefined) {
    return {
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      borderColor: 'border-gray-300 dark:border-gray-600',
      textColor: 'text-gray-700 dark:text-gray-300',
    }
  }

  const quadrant = getQuadrant(importance, urgency)
  const info = getQuadrantInfo(quadrant)
  const colors = info.color.split(' ')

  return {
    bgColor: colors.find(c => c.startsWith('bg-')) || 'bg-gray-100',
    borderColor: colors.find(c => c.startsWith('border-')) || 'border-gray-300',
    textColor: colors.find(c => c.startsWith('text-')) || 'text-gray-900',
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
      case 'priority': {
        // Combined score: importance + urgency (higher is better)
        const scoreA = (a.importance ?? 0) + (a.urgency ?? 0)
        const scoreB = (b.importance ?? 0) + (b.urgency ?? 0)
        return scoreB - scoreA
      }

      case 'eisenhower': {
        // Sort by quadrant order
        const quadrantOrder: Record<string, number> = {
          'do-first': 0,
          schedule: 1,
          delegate: 2,
          eliminate: 3,
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
      }

      case 'importance': {
        const impDiff = (b.importance ?? 0) - (a.importance ?? 0)
        return impDiff !== 0 ? impDiff : a.label.localeCompare(b.label)
      }

      case 'urgency': {
        const urgDiff = (b.urgency ?? 0) - (a.urgency ?? 0)
        return urgDiff !== 0 ? urgDiff : a.label.localeCompare(b.label)
      }

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
    hoveredSlotId,
  } = useTimeboxStore()

  const { entries, updateNode, addNode, currentEntry, deleteNode } = useBrainDumpStore()

  // Ensure selectedDate is always a valid string
  useEffect(() => {
    if (!selectedDate || typeof selectedDate !== 'string') {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      setSelectedDate(todayStr)
    }
  }, [selectedDate, setSelectedDate])

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    task: TimeboxTask
    slotId?: string
  } | null>(null)

  // Slot context menu state
  const [slotContextMenu, setSlotContextMenu] = useState<{
    x: number
    y: number
    slot: TimeSlot
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

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isMobileLandscape } = useOrientation()

  // Show in-progress state
  const [showInProgress, setShowInProgress] = useState(() => {
    const saved = localStorage.getItem('timebox-show-in-progress')
    return saved !== 'false' // Default to true
  })

  // Attempt dialog state
  const [attemptDialog, setAttemptDialog] = useState<{
    taskId: string
    taskLabel: string
    attempts: any[]
  } | null>(null)

  // Recurrence dialog state
  const [recurrenceDialog, setRecurrenceDialog] = useState<{
    taskId: string
    taskLabel: string
    currentPattern?: RecurrencePattern
    taskType?: 'one-time' | 'recurring' | 'habit'
  } | null>(null)

  // Force refresh state for recurring task updates
  const [refreshKey, setRefreshKey] = useState(0)

  // Analyze nodes for task extraction
  const allNodes = entries.flatMap(entry => entry.nodes)
  const thoughtNodes = allNodes.filter(node => node.type === 'thought')

  // Separate nodes by priority status
  const nodesWithPriority = thoughtNodes.filter(
    node => node.data.importance !== undefined && node.data.urgency !== undefined
  )
  const nodesWithoutPriority = thoughtNodes.filter(
    node => node.data.importance === undefined || node.data.urgency === undefined
  )

  // Group by quadrant for analysis
  const nodesByQuadrant = nodesWithPriority.reduce(
    (acc, node) => {
      const quadrant = getQuadrant(node.data.importance, node.data.urgency)
      if (!acc[quadrant]) acc[quadrant] = []
      acc[quadrant].push(node)
      return acc
    },
    {} as Record<string, typeof thoughtNodes>
  )

  // Extract all tasks from brain dumps and convert to TimeboxTask
  const allTasks: TimeboxTask[] = entries.flatMap(entry =>
    entry.nodes
      .filter(node => {
        // Show thought nodes that:
        // 1. Are not subtasks
        // 2. Are either not timed OR are timed for a different date
        const isScheduledForToday = node.data.isTimedTask && node.data.timeboxDate === selectedDate

        return (
          (node.type === 'thought' || node.data.category === 'tasks') &&
          !isScheduledForToday && // Show if not scheduled for today
          !node.data.parentTaskId
        ) // Don't show subtasks in the main list
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
        originalNode: node,
      }))
  )

  // Apply filtering and sorting to tasks
  const filteredTasks = allTasks.filter(task => {
    if (!showCompleted && task.status === 'completed') return false
    if (!showInProgress && task.status === 'in-progress') return false
    return true
  })
  const sortedTasks = sortTasks(filteredTasks, sortBy)

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('timebox-sort', sortBy)
  }, [sortBy])

  useEffect(() => {
    localStorage.setItem('timebox-show-completed', showCompleted.toString())
  }, [showCompleted])

  useEffect(() => {
    localStorage.setItem('timebox-show-in-progress', showInProgress.toString())
  }, [showInProgress])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
      if (window.innerWidth >= 768 && !isMobileLandscape) {
        setSidebarOpen(true) // Keep sidebar open on desktop (but not mobile landscape)
      } else if (isMobileLandscape) {
        setSidebarOpen(false) // Auto-close in mobile landscape
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobileLandscape])

  // Load scheduled tasks into time slots
  useEffect(() => {
    // Initialize time slots for the selected date
    initializeTimeSlots()

    // Find all one-time tasks scheduled for the selected date
    const scheduledTasks = entries.flatMap(entry =>
      entry.nodes
        .filter(node => node.data.isTimedTask && node.data.timeboxDate === selectedDate)
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
          originalNode: node,
        }))
    )

    // Generate recurring task instances for the selected date
    const allNodes = entries.flatMap(entry => entry.nodes)
    const recurringInstances = generateRecurringTaskInstances(allNodes, selectedDate)

    // Convert recurring instances to timebox tasks
    const recurringTasks = recurringInstances
      .filter(instance => instance.node.data.timeboxStartTime) // Only include if it has a scheduled time
      .map(instance => ({
        id: `${instance.node.id}-${selectedDate}`, // Unique ID for this instance
        label: instance.node.data.label,
        category: instance.node.data.category || 'uncategorized',
        importance: instance.node.data.importance,
        urgency: instance.node.data.urgency,
        dueDate: instance.node.data.dueDate,
        status: instance.isCompleted ? ('completed' as const) : ('pending' as const),
        completedAt: instance.completion?.completedAt,
        attempts: [], // Recurring tasks don't use attempts
        totalAttempts: 0,
        timeboxStartTime: instance.node.data.timeboxStartTime,
        timeboxDuration: instance.node.data.timeboxDuration || 60, // Default to 1 hour
        timeboxDate: selectedDate,
        isTimedTask: true,
        isRecurring: true,
        recurringCompletion: instance.completion,
        originalNode: instance.node,
      }))

    // Combine all tasks and add to appropriate slots
    const allTasks = [...scheduledTasks, ...recurringTasks]

    // Use a Set to track task IDs and prevent duplicates
    const addedTaskIds = new Set<string>()

    allTasks.forEach(task => {
      if (!addedTaskIds.has(task.id) && task.timeboxStartTime) {
        const slotId = `slot-${task.timeboxStartTime.replace(':', '')}`
        addTaskToSlot(task, slotId)
        addedTaskIds.add(task.id)
      }
    })
  }, [selectedDate, entries, addTaskToSlot, initializeTimeSlots, refreshKey]) // Re-run when date, entries or refreshKey change

  const handleDateChange = useCallback(
    (days: number) => {
      // Get current date from the store
      let currentDate = selectedDate

      // Ensure we have a valid date string
      if (!currentDate || typeof currentDate !== 'string') {
        const today = new Date()
        currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      }

      const parts = currentDate.split('-')
      if (parts.length !== 3) {
        const today = new Date()
        currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        parts.length = 0
        parts.push(...currentDate.split('-'))
      }

      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1 // JavaScript months are 0-indexed
      const day = parseInt(parts[2], 10)

      const dateObj = new Date(year, month, day)
      dateObj.setDate(dateObj.getDate() + days)

      const newYear = dateObj.getFullYear()
      const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
      const newDay = String(dateObj.getDate()).padStart(2, '0')

      const newDateStr = `${newYear}-${newMonth}-${newDay}`
      setSelectedDate(newDateStr)
    },
    [selectedDate, setSelectedDate]
  )

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
          // For recurring tasks, update the original node ID, not the instance ID
          const nodeIdToUpdate = task.isRecurring ? task.originalNode.id : task.id

          updateNode(nodeIdToUpdate, {
            ...task.originalNode.data,
            timeboxStartTime: slot.startTime,
            // Don't update timeboxDate for recurring tasks - they appear on multiple dates
            ...(task.isRecurring ? {} : { timeboxDate: selectedDate }),
          })
        }
      } else {
        // Adding new task from sidebar

        // Check if this is a recurring task
        if (
          task.originalNode?.data.taskType === 'recurring' ||
          task.originalNode?.data.taskType === 'habit'
        ) {
          // For recurring tasks, only update the timebox time info, not the date
          // The useEffect will generate the correct instance
          if (task.originalNode) {
            updateNode(task.id, {
              ...task.originalNode.data,
              timeboxStartTime: slot.startTime,
              timeboxDuration: 120,
              // Don't set isTimedTask or timeboxDate for recurring tasks
            })
          }
          // Don't manually add to slot - let the useEffect handle it
        } else {
          // For one-time tasks, proceed as normal
          addTaskToSlot(task, slotId)

          // Update the brain dump node to mark it as scheduled
          if (task.originalNode) {
            updateNode(task.id, {
              ...task.originalNode.data,
              isTimedTask: true,
              timeboxDate: selectedDate,
              timeboxStartTime: slot.startTime,
              timeboxDuration: 120,
            })
          }
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
      slotId,
    })
  }

  const handleSlotRightClick = (e: React.MouseEvent, slot: TimeSlot) => {
    e.preventDefault()
    // Only show menu if clicking on empty area, not on a task
    if ((e.target as HTMLElement).closest('[draggable="true"]')) {
      return
    }
    setSlotContextMenu({
      x: e.clientX,
      y: e.clientY,
      slot,
    })
  }

  const handleAddNodeFromSlot = async (
    text: string,
    type: string,
    category: string,
    timeboxInfo: {
      isTimedTask: true
      timeboxDate: string
      timeboxStartTime: string
      timeboxDuration: number
    }
  ) => {
    if (!currentEntry) return

    // Create a new node with full BrainDumpNode structure
    const newNode: BrainDumpNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as 'thought' | 'category' | 'root',
      position: { x: 0, y: 0 }, // Position doesn't matter for timebox view
      data: {
        label: text,
        category,
        isCollapsed: false,
        children: [],
        // Add timebox properties
        ...timeboxInfo,
        // Task tracking properties
        taskStatus: 'pending',
        attempts: [],
        totalAttempts: 0,
      },
    }

    // Add the node to the brain dump store
    await addNode(newNode)

    // Close the context menu
    setSlotContextMenu(null)

    // The task will be automatically added to the timebox slot by the useEffect
    // that watches for entry changes and loads scheduled tasks
  }

  const handleDeleteTask = (taskId: string) => {
    // Handle recurring task instances differently
    if (taskId.includes('-') && taskId.split('-').length > 2) {
      // This is a recurring task instance - we can't delete individual instances
      alert(
        'You cannot delete individual occurrences of recurring tasks. Delete the recurring task from the BrainFlow view to remove all occurrences.'
      )
      return
    }

    // For regular tasks, delete the node entirely
    deleteNode(taskId)

    // Also remove from any time slots
    timeSlots.forEach(slot => {
      if (slot.tasks.some(t => t.id === taskId)) {
        removeTaskFromSlot(taskId, slot.id)
      }
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
        ...updates,
      })
    }

    // Update the task in our local array
    const taskIndex = allTasks.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates }
    }
  }

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    // Check if this is a recurring task instance
    // Format: originalId-YYYY-MM-DD (need at least 4 parts when split)
    const parts = taskId.split('-')
    const isRecurringInstance = parts.length >= 4 && /^\d{4}$/.test(parts[parts.length - 3])

    if (isRecurringInstance) {
      // This is a recurring task instance
      // Extract the date part (last 3 segments: YYYY-MM-DD)
      const dateStr = parts.slice(-3).join('-')
      const originalId = parts.slice(0, -3).join('-')
      const task = timeSlots.flatMap(s => s.tasks).find(t => t.id === taskId)

      if (!task?.originalNode) return

      // Find which slot contains this task and update it for visual feedback
      const slotWithTask = timeSlots.find(slot => slot.tasks.some(t => t.id === taskId))
      if (slotWithTask) {
        updateTaskInSlot(taskId, {
          status: completed ? 'completed' : 'pending',
          completedAt: completed ? new Date().toISOString() : undefined,
        })
      }

      if (completed) {
        // Add a completion record for this date
        const newCompletion: RecurringCompletion = {
          date: dateStr,
          completedAt: new Date().toISOString(),
          duration: undefined, // Could be tracked separately
          notes: undefined,
          quality: undefined, // Could be set via UI
        }

        const existingCompletions = task.originalNode.data.recurringCompletions || []
        const updatedCompletions = existingCompletions.filter(c => c.date !== dateStr)
        updatedCompletions.push(newCompletion)

        updateNode(originalId, {
          ...task.originalNode.data,
          recurringCompletions: updatedCompletions,
          lastRecurringCompletionDate: dateStr,
          // Update streak if it's a habit
          ...(task.originalNode.data.taskType === 'habit' && {
            currentStreak: calculateCurrentStreak(
              updatedCompletions,
              task.originalNode.data.recurrencePattern!
            ),
          }),
        })

        // Trigger a refresh to update the UI
        setRefreshKey(prev => prev + 1)
      } else {
        // Remove completion record for this date
        const existingCompletions = task.originalNode.data.recurringCompletions || []
        const updatedCompletions = existingCompletions.filter(c => c.date !== dateStr)

        updateNode(originalId, {
          ...task.originalNode.data,
          recurringCompletions: updatedCompletions,
          // Update streak if it's a habit
          ...(task.originalNode.data.taskType === 'habit' && {
            currentStreak: calculateCurrentStreak(
              updatedCompletions,
              task.originalNode.data.recurrencePattern!
            ),
          }),
        })

        // Trigger a refresh to update the UI
        setRefreshKey(prev => prev + 1)
      }
    } else {
      // Regular one-time task
      const task =
        allTasks.find(t => t.id === taskId) ||
        timeSlots.flatMap(s => s.tasks).find(t => t.id === taskId)
      if (!task) return

      const newStatus = completed ? 'completed' : 'pending'
      const updates = {
        taskStatus: newStatus as const,
        completedAt: completed ? new Date().toISOString() : undefined,
      }

      // Evaluate smart completion logic
      const { currentEntry } = useBrainDumpStore.getState()
      if (currentEntry) {
        const completionResult = evaluateTaskCompletion(
          taskId,
          newStatus as any,
          currentEntry.nodes,
          currentEntry.edges
        )

        // Handle cascading completions
        completionResult.affectedNodeIds.forEach(nodeId => {
          if (nodeId !== taskId) {
            const affectedNode = currentEntry.nodes.find(n => n.id === nodeId)
            if (affectedNode) {
              if (completionResult.shouldCompleteParent || completionResult.shouldCompleteChildren) {
                updateNode(nodeId, {
                  ...affectedNode.data,
                  taskStatus: newStatus as any,
                  completedAt: completed ? new Date().toISOString() : undefined,
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

      // Find which slot contains this task and update it for visual feedback
      const slotWithTask = timeSlots.find(slot => slot.tasks.some(t => t.id === taskId))
      if (slotWithTask) {
        updateTaskInSlot(taskId, {
          status: updates.taskStatus,
          completedAt: updates.completedAt,
        })
      }

      // Update the original node
      if (task.originalNode) {
        updateNode(taskId, {
          ...task.originalNode.data,
          ...updates,
        })
      }
    }
  }

  const handleRecordAttempt = (taskId: string) => {
    const task =
      allTasks.find(t => t.id === taskId) ||
      timeSlots.flatMap(s => s.tasks).find(t => t.id === taskId)
    if (!task) return

    setAttemptDialog({
      taskId: task.id,
      taskLabel: task.label,
      attempts: task.attempts || [],
    })
  }

  const handleAddAttempt = (taskId: string, attempt: any) => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return

    const newAttempt = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...attempt,
    }

    const updates = {
      attempts: [...(task.attempts || []), newAttempt],
      totalAttempts: (task.totalAttempts || 0) + 1,
      taskStatus: attempt.outcome === 'success' ? ('completed' as const) : ('in-progress' as const),
      completedAt: attempt.outcome === 'success' ? new Date().toISOString() : undefined,
    }

    // Update the original node
    if (task.originalNode) {
      updateNode(taskId, {
        ...task.originalNode.data,
        ...updates,
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
        urgency: parentTask.urgency,
      },
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
          total: updatedSubtasks.length,
        },
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
        const subtaskNodes = allTasks.filter(t => parentTask.subtasks?.includes(t.id))
        const completedCount = subtaskNodes.filter(t => t.status === 'completed').length

        updateNode(subtask.parentTaskId, {
          ...parentTask.originalNode!.data,
          subtaskProgress: {
            completed: completedCount,
            total: parentTask.subtasks.length,
          },
        })
      }
    }
  }

  const getSubtasksForTask = (taskId: string): TimeboxTask[] => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task?.subtasks) return []

    return allTasks.filter(t => task.subtasks?.includes(t.id) || t.parentTaskId === taskId)
  }

  const handleMakeRecurring = (taskId: string) => {
    // Find the task to get its current state
    const task =
      allTasks.find(t => t.id === taskId) ||
      timeSlots.flatMap(s => s.tasks).find(t => t.id === taskId)

    if (!task) return

    setRecurrenceDialog({
      taskId: task.id,
      taskLabel: task.label,
      currentPattern: task.originalNode?.data.recurrencePattern,
      taskType: task.originalNode?.data.taskType || 'one-time',
    })
  }

  const handleSaveRecurrence = (
    taskId: string,
    pattern: RecurrencePattern | undefined,
    taskType: 'recurring' | 'habit'
  ) => {
    const task =
      allTasks.find(t => t.id === taskId) ||
      timeSlots.flatMap(s => s.tasks).find(t => t.id === taskId)

    if (!task?.originalNode) return

    // Update the node with recurrence information
    updateNode(taskId, {
      ...task.originalNode.data,
      taskType: pattern ? taskType : 'one-time',
      recurrencePattern: pattern,
      // Reset recurring completions when pattern changes
      recurringCompletions: pattern ? [] : undefined,
      currentStreak: 0,
      longestStreak: 0,
    })

    // Close the dialog
    setRecurrenceDialog(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="flex h-screen relative overflow-x-hidden">
        {/* Mobile menu button */}
        {(isMobile || isMobileLandscape) && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              'fixed z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg md:hidden',
              isMobileLandscape ? 'top-20 left-2' : 'top-24 left-4'
            )}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* Overlay for mobile */}
        {(isMobile || isMobileLandscape) && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar with unscheduled tasks */}
        <div
          className={cn(
            'fixed md:relative inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto transform transition-transform duration-300 ease-in-out',
            'w-80 mobile-landscape:w-64', // Narrower in landscape
            (isMobile || isMobileLandscape) && !sidebarOpen && '-translate-x-full',
            'md:translate-x-0'
          )}
        >
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
                onChange={e => setSortBy(e.target.value as SortOption)}
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

            {/* Filter checkboxes */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-completed"
                  checked={showCompleted}
                  onChange={e => setShowCompleted(e.target.checked)}
                  className="rounded border-gray-300 text-brain-600 focus:ring-brain-500"
                />
                <label
                  htmlFor="show-completed"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Show completed tasks
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-in-progress"
                  checked={showInProgress}
                  onChange={e => setShowInProgress(e.target.checked)}
                  className="rounded border-gray-300 text-brain-600 focus:ring-brain-500"
                />
                <label
                  htmlFor="show-in-progress"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Show in-progress tasks
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {sortedTasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No unscheduled tasks found
              </p>
            ) : (
              sortedTasks.map(task => {
                const { bgColor, borderColor } = getPriorityColor(task.importance, task.urgency)
                const priorityIcon = getPriorityIcon(task.importance, task.urgency)

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={e => handleRightClick(e, task)}
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
                        onChange={e => {
                          e.stopPropagation()
                          handleTaskComplete(task.id, e.target.checked)
                        }}
                        className="mt-1 rounded border-gray-300 text-brain-600 focus:ring-brain-500"
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="text-lg">{priorityIcon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'font-medium',
                              task.status === 'completed'
                                ? 'line-through text-gray-500 dark:text-gray-500'
                                : 'text-gray-900 dark:text-gray-100'
                            )}
                          >
                            {task.label}
                          </p>
                          {task.isRecurring && (
                            <span
                              className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full"
                              title="Recurring task"
                            >
                              🔁
                            </span>
                          )}
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
                                Subtasks: {task.subtaskProgress.completed}/
                                {task.subtaskProgress.total}
                              </span>
                              <div className="flex-1 max-w-[100px] h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 transition-all duration-300"
                                  style={{
                                    width: `${(task.subtaskProgress.completed / task.subtaskProgress.total) * 100}%`,
                                  }}
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
        <div
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full',
            isMobileLandscape && 'pl-12' // Extra padding for mobile menu button
          )}
        >
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
                      // Ensure selectedDate is a valid string
                      if (!selectedDate || typeof selectedDate !== 'string') {
                        const today = new Date()
                        return format(today, 'EEEE, MMMM d')
                      }

                      // Parse the date in local time zone to avoid UTC conversion issues
                      const parts = selectedDate.split('-')
                      if (parts.length !== 3) {
                        const today = new Date()
                        return format(today, 'EEEE, MMMM d')
                      }

                      const [year, month, day] = parts.map(Number)
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
                night: 'Night (12am - 6am)',
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
                          onDrop={e => handleDrop(e, slot.id)}
                          onContextMenu={e => handleSlotRightClick(e, slot)}
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
                                (Block {slot.timeIndex >= 0 ? '+' : ''}
                                {slot.timeIndex})
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
                                    onDragStart={e => handleTaskDragStart(e, task, slot.id)}
                                    onDragEnd={handleDragEnd}
                                    onContextMenu={e => handleRightClick(e, task, slot.id)}
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
                                        onChange={e => {
                                          e.stopPropagation()
                                          handleTaskComplete(task.id, e.target.checked)
                                        }}
                                        className="mt-1 rounded border-gray-300 text-brain-600 focus:ring-brain-500"
                                        onClick={e => e.stopPropagation()}
                                      />
                                      <span className="text-lg">{priorityIcon}</span>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p
                                            className={cn(
                                              'font-medium',
                                              task.status === 'completed'
                                                ? 'line-through text-gray-500 dark:text-gray-500'
                                                : 'text-gray-900 dark:text-gray-100'
                                            )}
                                          >
                                            {task.label}
                                          </p>
                                          {task.isRecurring && (
                                            <span
                                              className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full"
                                              title="Recurring task"
                                            >
                                              🔁
                                            </span>
                                          )}
                                          {task.originalNode?.data.currentStreak &&
                                            task.originalNode.data.currentStreak > 0 && (
                                              <span
                                                className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full"
                                                title={`${task.originalNode.data.currentStreak} day streak`}
                                              >
                                                🔥{task.originalNode.data.currentStreak}
                                              </span>
                                            )}
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
                                        {(task.importance === undefined ||
                                          task.urgency === undefined) && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                                            Right-click to set priority
                                          </p>
                                        )}
                                        <button
                                          onClick={() => {
                                            removeTaskFromSlot(task.id, slot.id)

                                            // For recurring tasks, don't update the original node
                                            // For one-time tasks, clear timebox properties
                                            if (task.originalNode && !task.isRecurring) {
                                              updateNode(task.originalNode.id, {
                                                ...task.originalNode.data,
                                                isTimedTask: false,
                                                timeboxDate: undefined,
                                                timeboxStartTime: undefined,
                                                timeboxDuration: undefined,
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
          onAddSubtask={taskId => {
            const label = prompt('Enter subtask description:')
            if (label) {
              handleAddSubtask(taskId, label)
            }
          }}
          onMakeRecurring={handleMakeRecurring}
          onDeleteTask={handleDeleteTask}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Attempt Dialog */}
      {attemptDialog && (
        <AttemptDialog
          taskId={attemptDialog.taskId}
          taskLabel={attemptDialog.taskLabel}
          attempts={attemptDialog.attempts}
          onAddAttempt={attempt => handleAddAttempt(attemptDialog.taskId, attempt)}
          onClose={() => setAttemptDialog(null)}
        />
      )}

      {/* Slot Context Menu */}
      {slotContextMenu && (
        <TimeboxSlotContextMenu
          isOpen={true}
          position={{ x: slotContextMenu.x, y: slotContextMenu.y }}
          slot={slotContextMenu.slot}
          selectedDate={selectedDate}
          onClose={() => setSlotContextMenu(null)}
          onAddNode={handleAddNodeFromSlot}
        />
      )}

      {/* Recurrence Dialog */}
      {recurrenceDialog && (
        <RecurrenceDialog
          taskId={recurrenceDialog.taskId}
          taskLabel={recurrenceDialog.taskLabel}
          currentPattern={recurrenceDialog.currentPattern}
          currentTaskType={recurrenceDialog.taskType}
          onSave={handleSaveRecurrence}
          onClose={() => setRecurrenceDialog(null)}
        />
      )}
    </div>
  )
}
