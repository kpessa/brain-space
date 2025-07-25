import { create } from 'zustand'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

// Task attempt tracking
export interface TaskAttempt {
  id: string
  timestamp: string
  duration?: number // minutes spent
  notes?: string
  outcome: 'success' | 'partial' | 'failed' | 'blocked'
  nextAction?: string // What to try next
}

// Timebox task type
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
  // Node reference
  nodeId?: string
  // User reference
  userId?: string
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

interface TimeboxData {
  userId: string
  date: string
  slots: Record<string, TimeboxTask[]>
  createdAt?: any
  updatedAt?: any
}

interface TimeboxState {
  selectedDate: string // YYYY-MM-DD format
  timeSlots: TimeSlot[]
  draggedTask: TimeboxTask | null
  hoveredSlotId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setSelectedDate: (date: string) => void
  setDraggedTask: (task: TimeboxTask | null) => void
  setHoveredSlotId: (slotId: string | null) => void
  addTaskToSlot: (task: TimeboxTask, slotId: string) => Promise<void>
  removeTaskFromSlot: (taskId: string, slotId: string) => Promise<void>
  updateTaskInSlot: (taskId: string, updates: Partial<TimeboxTask>) => Promise<void>
  moveTaskBetweenSlots: (taskId: string, fromSlotId: string, toSlotId: string) => Promise<void>
  initializeTimeSlots: () => void
  
  // Firebase actions
  loadTimeboxData: (userId: string, date: string) => Promise<void>
  saveTimeboxData: (userId: string) => Promise<void>
}

// Helper function to generate time slots
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const hours = [
    // Morning (6am - 12pm)
    { start: '06:00', end: '08:00', display: '6-8am', index: -3, period: 'morning' as const },
    { start: '08:00', end: '10:00', display: '8-10am', index: -2, period: 'morning' as const },
    { start: '10:00', end: '12:00', display: '10am-12pm', index: -1, period: 'morning' as const },

    // Afternoon (12pm - 6pm)
    { start: '12:00', end: '14:00', display: '12-2pm', index: 0, period: 'afternoon' as const },
    { start: '14:00', end: '16:00', display: '2-4pm', index: 1, period: 'afternoon' as const },
    { start: '16:00', end: '18:00', display: '4-6pm', index: 2, period: 'afternoon' as const },

    // Evening (6pm - 10pm)
    { start: '18:00', end: '20:00', display: '6-8pm', index: 3, period: 'evening' as const },
    { start: '20:00', end: '22:00', display: '8-10pm', index: 4, period: 'evening' as const },
  ]

  hours.forEach(({ start, end, display, index, period }) => {
    slots.push({
      id: `slot-${start.replace(':', '')}`,
      startTime: start,
      endTime: end,
      displayTime: display,
      timeIndex: index,
      period: period,
      tasks: [],
    })
  })

  return slots
}

export const useTimeboxStore = create<TimeboxState>((set, get) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  timeSlots: generateTimeSlots(),
  draggedTask: null,
  hoveredSlotId: null,
  isLoading: false,
  error: null,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date })
  },

  setDraggedTask: (task: TimeboxTask | null) => {
    set({ draggedTask: task })
  },

  setHoveredSlotId: (slotId: string | null) => {
    set({ hoveredSlotId: slotId })
  },

  addTaskToSlot: async (task: TimeboxTask, slotId: string) => {
    const { timeSlots } = get()
    const updatedSlots = timeSlots.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          tasks: [...slot.tasks, { ...task, timeboxDate: get().selectedDate }],
        }
      }
      return slot
    })
    set({ timeSlots: updatedSlots })
    
    // Save to Firebase
    if (task.userId) {
      await get().saveTimeboxData(task.userId)
    }
  },

  removeTaskFromSlot: async (taskId: string, slotId: string) => {
    const { timeSlots } = get()
    const updatedSlots = timeSlots.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          tasks: slot.tasks.filter(task => task.id !== taskId),
        }
      }
      return slot
    })
    set({ timeSlots: updatedSlots })
    
    // Save to Firebase
    const task = timeSlots.find(s => s.id === slotId)?.tasks.find(t => t.id === taskId)
    if (task?.userId) {
      await get().saveTimeboxData(task.userId)
    }
  },

  updateTaskInSlot: async (taskId: string, updates: Partial<TimeboxTask>) => {
    const { timeSlots } = get()
    let userId: string | undefined
    
    const updatedSlots = timeSlots.map(slot => ({
      ...slot,
      tasks: slot.tasks.map(task => {
        if (task.id === taskId) {
          userId = task.userId
          return { ...task, ...updates }
        }
        return task
      }),
    }))
    set({ timeSlots: updatedSlots })
    
    // Save to Firebase
    if (userId) {
      await get().saveTimeboxData(userId)
    }
  },

  moveTaskBetweenSlots: async (taskId: string, fromSlotId: string, toSlotId: string) => {
    const { timeSlots } = get()
    let movedTask: TimeboxTask | undefined
    let userId: string | undefined

    const updatedSlots = timeSlots.map(slot => {
      if (slot.id === fromSlotId) {
        const task = slot.tasks.find(t => t.id === taskId)
        if (task) {
          movedTask = task
          userId = task.userId
        }
        return {
          ...slot,
          tasks: slot.tasks.filter(t => t.id !== taskId),
        }
      }
      if (slot.id === toSlotId && movedTask) {
        return {
          ...slot,
          tasks: [...slot.tasks, movedTask],
        }
      }
      return slot
    })
    
    set({ timeSlots: updatedSlots })
    
    // Save to Firebase
    if (userId) {
      await get().saveTimeboxData(userId)
    }
  },

  initializeTimeSlots: () => {
    set({ timeSlots: generateTimeSlots() })
  },

  loadTimeboxData: async (userId: string, date: string) => {
    if (!userId) return

    set({ isLoading: true, error: null })
    try {
      const timeboxDoc = await getDocs(
        query(
          collection(db, 'users', userId, 'timeboxes'),
          where('date', '==', date)
        )
      )

      if (!timeboxDoc.empty) {
        const data = timeboxDoc.docs[0].data() as TimeboxData
        const slots = generateTimeSlots()
        
        // Populate slots with tasks from Firebase
        Object.entries(data.slots || {}).forEach(([slotId, tasks]) => {
          const slot = slots.find(s => s.id === slotId)
          if (slot) {
            slot.tasks = tasks
          }
        })
        
        set({ timeSlots: slots, isLoading: false })
      } else {
        // No data for this date, use empty slots
        set({ timeSlots: generateTimeSlots(), isLoading: false })
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      })
    }
  },

  saveTimeboxData: async (userId: string) => {
    if (!userId) return

    const { selectedDate, timeSlots } = get()
    
    try {
      // Convert timeSlots to a simple object for storage
      const slotsData: Record<string, TimeboxTask[]> = {}
      timeSlots.forEach(slot => {
        if (slot.tasks.length > 0) {
          slotsData[slot.id] = slot.tasks
        }
      })

      const timeboxData: TimeboxData = {
        userId,
        date: selectedDate,
        slots: slotsData,
        updatedAt: serverTimestamp(),
      }

      // Use date as document ID for easy retrieval
      const docId = `${userId}-${selectedDate}`
      const docRef = doc(db, 'users', userId, 'timeboxes', docId)
      
      const existingDoc = await getDocs(
        query(
          collection(db, 'users', userId, 'timeboxes'),
          where('date', '==', selectedDate)
        )
      )

      if (existingDoc.empty) {
        await setDoc(docRef, {
          ...timeboxData,
          createdAt: serverTimestamp()
        })
      } else {
        await updateDoc(docRef, {
          userId,
          date: selectedDate,
          slots: slotsData,
          updatedAt: serverTimestamp(),
        })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
}))