/**
 * Demo: How to Create Recurring Tasks
 *
 * This file demonstrates how recurring tasks can be created in the Brain Space app.
 * In a full implementation, this would be integrated into the UI components.
 */

import type { BrainDumpNode, RecurrencePattern } from '@/types/braindump'

// Example 1: Daily Habit - Morning Meditation
export const morningMeditationNode: BrainDumpNode = {
  id: 'habit-meditation',
  type: 'thought',
  position: { x: 0, y: 0 },
  data: {
    label: '🧘 Morning Meditation',
    category: 'habits',
    isCollapsed: false,
    children: [],

    // Task type and scheduling
    taskType: 'habit',
    timeboxStartTime: '07:00', // 7 AM
    timeboxDuration: 30, // 30 minutes

    // Recurrence pattern
    recurrencePattern: {
      type: 'daily',
      frequency: 1, // Every day
      startDate: '2024-01-01',
    },

    // Habit tracking
    recurringCompletions: [],
    currentStreak: 0,
    longestStreak: 0,
  },
}

// Example 2: Weekly Recurring Task - Team Meeting
export const teamMeetingNode: BrainDumpNode = {
  id: 'recurring-team-meeting',
  type: 'thought',
  position: { x: 0, y: 0 },
  data: {
    label: '👥 Team Standup Meeting',
    category: 'meetings',
    isCollapsed: false,
    children: [],

    // Task type and scheduling
    taskType: 'recurring',
    timeboxStartTime: '10:00', // 10 AM
    timeboxDuration: 60, // 1 hour

    // Recurrence pattern - Every Monday and Thursday
    recurrencePattern: {
      type: 'weekly',
      frequency: 1,
      daysOfWeek: [1, 4], // Monday and Thursday
      startDate: '2024-01-01',
    },

    // Priority
    importance: 7,
    urgency: 5,

    // Completion tracking
    recurringCompletions: [],
  },
}

// Example 3: Monthly Task - Pay Rent
export const payRentNode: BrainDumpNode = {
  id: 'recurring-pay-rent',
  type: 'thought',
  position: { x: 0, y: 0 },
  data: {
    label: '💰 Pay Rent',
    category: 'finance',
    isCollapsed: false,
    children: [],

    // Task type and scheduling
    taskType: 'recurring',
    timeboxStartTime: '09:00',
    timeboxDuration: 30,

    // Recurrence pattern - 1st of every month
    recurrencePattern: {
      type: 'monthly',
      frequency: 1,
      dayOfMonth: 1,
      startDate: '2024-01-01',
    },

    // High priority
    importance: 10,
    urgency: 8,

    // Completion tracking
    recurringCompletions: [],
  },
}

// Example 4: Exercise Habit - 3 times per week
export const exerciseHabitNode: BrainDumpNode = {
  id: 'habit-exercise',
  type: 'thought',
  position: { x: 0, y: 0 },
  data: {
    label: '🏃 Exercise Session',
    category: 'health',
    isCollapsed: false,
    children: [],

    // Task type and scheduling
    taskType: 'habit',
    timeboxStartTime: '18:00', // 6 PM
    timeboxDuration: 60,

    // Recurrence pattern - Monday, Wednesday, Friday
    recurrencePattern: {
      type: 'weekly',
      frequency: 1,
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      startDate: '2024-01-01',
    },

    // Medium priority
    importance: 8,
    urgency: 6,

    // Habit tracking
    recurringCompletions: [],
    currentStreak: 0,
    longestStreak: 0,
  },
}

/**
 * To use these in your app:
 *
 * 1. Import the node you want to create
 * 2. Add it to your brain dump using the addNode function
 * 3. The recurring instances will automatically appear in the timebox on the appropriate days
 *
 * Example usage in a component:
 *
 * ```typescript
 * import { morningMeditationNode } from './DemoRecurringTasks'
 * import { useBrainDumpStore } from '@/store/braindump'
 *
 * function MyComponent() {
 *   const { addNode } = useBrainDumpStore()
 *
 *   const createMorningMeditationHabit = async () => {
 *     await addNode(morningMeditationNode)
 *   }
 *
 *   return (
 *     <button onClick={createMorningMeditationHabit}>
 *       Create Morning Meditation Habit
 *     </button>
 *   )
 * }
 * ```
 */
