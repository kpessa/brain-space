import { create } from 'zustand'
import type { BrainDumpNode } from '@/types/braindump'

// Task attempt tracking
export interface TaskAttempt {
  id: string
  timestamp: string
  duration?: number // minutes spent
  notes?: string
  outcome: 'success' | 'partial' | 'failed' | 'blocked'
  nextAction?: string // What to try next
}

// Simplified task type for timebox without React Flow dependencies
export interface TimeboxTask {
  id: string
  label: string
  category?: string
  importance?: number
  urgency?: number
  dueDate?: string
  timeboxStartTime?: string
  timeboxDuration?: number
  timeboxDate?: string
  isTimedTask?: boolean
  // Completion tracking
  status?: 'pending' | 'in-progress' | 'completed' | 'deferred'
  completedAt?: string // ISO timestamp
  attempts?: TaskAttempt[]
  totalAttempts?: number
  // Subtask support
  subtasks?: string[]
  parentTaskId?: string
  subtaskProgress?: { completed: number; total: number }
  // Original node reference
  originalNode?: BrainDumpNode
}

export interface TimeSlot {
  id: string
  startTime: string // "HH:MM" format (24-hour)
  endTime: string // "HH:MM" format (24-hour)
  displayTime: string // "6-8am" format for display
  timeIndex: number // -2, -1, 0, 1, 2, etc. based on 12pm as 0
  period: 'morning' | 'afternoon' | 'evening' | 'night'
  tasks: TimeboxTask[]
}

interface TimeboxState {
  selectedDate: string // YYYY-MM-DD format
  timeSlots: TimeSlot[]
  draggedTask: TimeboxTask | null
  hoveredSlotId: string | null
  
  // Actions
  setSelectedDate: (date: string) => void
  setDraggedTask: (task: TimeboxTask | null) => void
  setHoveredSlotId: (slotId: string | null) => void
  addTaskToSlot: (task: TimeboxTask, slotId: string) => void
  removeTaskFromSlot: (taskId: string, slotId: string) => void
  updateTaskInSlot: (taskId: string, updates: Partial<TimeboxTask>) => void
  moveTaskBetweenSlots: (taskId: string, fromSlotId: string, toSlotId: string) => void
  initializeTimeSlots: () => void
}

// Helper function to generate time slots
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const hours = [
    // Morning (6am - 12pm)
    { start: '06:00', end: '08:00', display: '6-8am', index: -3, period: 'morning' },
    { start: '08:00', end: '10:00', display: '8-10am', index: -2, period: 'morning' },
    { start: '10:00', end: '12:00', display: '10am-12pm', index: -1, period: 'morning' },
    
    // Afternoon (12pm - 6pm)
    { start: '12:00', end: '14:00', display: '12-2pm', index: 0, period: 'afternoon' },
    { start: '14:00', end: '16:00', display: '2-4pm', index: 1, period: 'afternoon' },
    { start: '16:00', end: '18:00', display: '4-6pm', index: 2, period: 'afternoon' },
    
    // Evening (6pm - 12am)
    { start: '18:00', end: '20:00', display: '6-8pm', index: 3, period: 'evening' },
    { start: '20:00', end: '22:00', display: '8-10pm', index: 4, period: 'evening' },
    { start: '22:00', end: '00:00', display: '10pm-12am', index: 5, period: 'evening' },
    
    // Late night/Early morning (12am - 6am)
    { start: '00:00', end: '02:00', display: '12-2am', index: -6, period: 'night' },
    { start: '02:00', end: '04:00', display: '2-4am', index: -5, period: 'night' },
    { start: '04:00', end: '06:00', display: '4-6am', index: -4, period: 'night' },
  ]
  
  hours.forEach(({ start, end, display, index, period }) => {
    slots.push({
      id: `slot-${start.replace(':', '')}`,
      startTime: start,
      endTime: end,
      displayTime: display,
      timeIndex: index,
      period,
      tasks: []
    })
  })
  
  return slots
}

export const useTimeboxStore = create<TimeboxState>((set, get) => ({
  selectedDate: (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })(),
  timeSlots: generateTimeSlots(),
  draggedTask: null,
  hoveredSlotId: null,
  
  setSelectedDate: (date) => {
    // Ensure date is always a string
    if (typeof date === 'string') {
      set({ selectedDate: date })
    } else {
      // Fallback to today if invalid date provided
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      set({ selectedDate: todayStr })
    }
  },
  
  setDraggedTask: (task) => set({ draggedTask: task }),
  
  setHoveredSlotId: (slotId) => set({ hoveredSlotId: slotId }),
  
  addTaskToSlot: (task, slotId) => set((state) => {
    const slot = state.timeSlots.find(s => s.id === slotId)
    if (!slot) return state
    
    // Create updated task with timebox info
    const updatedTask = {
      ...task,
      isTimedTask: true,
      timeboxDate: state.selectedDate,
      timeboxStartTime: slot.startTime,
      timeboxDuration: 120 // Default 2 hours
    }
    
    return {
      timeSlots: state.timeSlots.map(s => 
        s.id === slotId
          ? { ...s, tasks: [...s.tasks, updatedTask] }
          : s
      )
    }
  }),
  
  removeTaskFromSlot: (taskId, slotId) => set((state) => ({
    timeSlots: state.timeSlots.map(slot =>
      slot.id === slotId
        ? { ...slot, tasks: slot.tasks.filter(task => task.id !== taskId) }
        : slot
    )
  })),
  
  updateTaskInSlot: (taskId, updates) => set((state) => {
    // Also update originalNode if it exists
    return {
      timeSlots: state.timeSlots.map(slot => ({
        ...slot,
        tasks: slot.tasks.map(task =>
          task.id === taskId
            ? { 
                ...task, 
                ...updates,
                originalNode: task.originalNode ? {
                  ...task.originalNode,
                  data: { ...task.originalNode.data, ...updates }
                } : undefined
              }
            : task
        )
      }))
    }
  }),
  
  moveTaskBetweenSlots: (taskId, fromSlotId, toSlotId) => {
    const state = get()
    const fromSlot = state.timeSlots.find(s => s.id === fromSlotId)
    const task = fromSlot?.tasks.find(t => t.id === taskId)
    
    if (!task) return
    
    set((state) => ({
      timeSlots: state.timeSlots.map(slot => {
        if (slot.id === fromSlotId) {
          return { ...slot, tasks: slot.tasks.filter(t => t.id !== taskId) }
        }
        if (slot.id === toSlotId) {
          return { 
            ...slot, 
            tasks: [...slot.tasks, {
              ...task,
              timeboxStartTime: slot.startTime,
            }] 
          }
        }
        return slot
      })
    }))
  },
  
  initializeTimeSlots: () => set({ timeSlots: generateTimeSlots() })
}))