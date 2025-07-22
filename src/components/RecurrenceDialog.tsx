import { useState } from 'react'
import { X } from 'lucide-react'
import { RecurrenceSelector } from './RecurrenceSelector'
import type { RecurrencePattern } from '@/types/braindump'

interface RecurrenceDialogProps {
  taskId: string
  taskLabel: string
  currentPattern?: RecurrencePattern
  currentTaskType?: 'one-time' | 'recurring' | 'habit'
  onSave: (
    taskId: string,
    pattern: RecurrencePattern | undefined,
    taskType: 'recurring' | 'habit'
  ) => void
  onClose: () => void
}

export function RecurrenceDialog({
  taskId,
  taskLabel,
  currentPattern,
  currentTaskType = 'one-time',
  onSave,
  onClose,
}: RecurrenceDialogProps) {
  const [taskType, setTaskType] = useState<'recurring' | 'habit'>(
    currentTaskType === 'habit' ? 'habit' : 'recurring'
  )

  const handleSave = (pattern: RecurrencePattern | undefined) => {
    onSave(taskId, pattern, taskType)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">Make Task Recurring</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{taskLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Type Selection */}
        <div className="p-4 border-b dark:border-gray-700">
          <label className="block text-sm font-medium mb-2">Task Type</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="recurring"
                checked={taskType === 'recurring'}
                onChange={e => setTaskType(e.target.value as 'recurring' | 'habit')}
                className="mr-2"
              />
              <span className="text-sm">Recurring Task</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="habit"
                checked={taskType === 'habit'}
                onChange={e => setTaskType(e.target.value as 'recurring' | 'habit')}
                className="mr-2"
              />
              <span className="text-sm">Habit (with streak tracking)</span>
            </label>
          </div>
          {taskType === 'habit' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Habits track completion streaks to help build consistency
            </p>
          )}
        </div>

        {/* Recurrence Pattern Selector */}
        <RecurrenceSelector pattern={currentPattern} onChange={handleSave} onClose={onClose} />
      </div>
    </div>
  )
}
