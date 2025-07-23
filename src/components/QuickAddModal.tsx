import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuickAdd } from '@/hooks/useQuickAdd'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [label, setLabel] = useState('')
  const [showScheduling, setShowScheduling] = useState(false)
  const [timeboxDate, setTimeboxDate] = useState('')
  const [timeboxStartTime, setTimeboxStartTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { context, addTask } = useQuickAdd()

  // Set default date when modal opens
  useEffect(() => {
    if (isOpen && context.defaultDate) {
      setTimeboxDate(context.defaultDate)
      setShowScheduling(context.defaultTimedTask)
    }
  }, [isOpen, context])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLabel('')
      setTimeboxDate('')
      setTimeboxStartTime('')
      setShowScheduling(false)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    setIsLoading(true)
    try {
      await addTask({
        label: label.trim(),
        isTimedTask: Boolean(showScheduling && (timeboxDate || timeboxStartTime)),
        timeboxDate: showScheduling ? timeboxDate : undefined,
        timeboxStartTime: showScheduling ? timeboxStartTime : undefined,
        importance: context.defaultImportance,
        urgency: context.defaultUrgency,
      })
      onClose()
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getQuickTimeOptions = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentHour = now.getHours()

    return [
      { label: 'Now', date: today, time: `${currentHour}:00` },
      { label: 'In 1 hour', date: today, time: `${currentHour + 1}:00` },
      { label: 'This afternoon', date: today, time: '14:00' },
      { label: 'Tomorrow', date: getDateOffset(1), time: '09:00' },
    ]
  }

  const getDateOffset = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const handleQuickTime = (date: string, time: string) => {
    setTimeboxDate(date)
    setTimeboxStartTime(time)
    setShowScheduling(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Task</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Context indicator */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Adding to: <span className="font-medium capitalize">{context.page}</span>
              {context.defaultTimedTask && ' (scheduled)'}
            </div>

            {/* Task input */}
            <div>
              <label htmlFor="task-label" className="sr-only">
                Task description
              </label>
              <textarea
                id="task-label"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brain-500 focus:border-transparent resize-none"
                rows={2}
                autoFocus
              />
            </div>

            {/* Quick time options */}
            {!showScheduling && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowScheduling(true)}
                  className="flex items-center gap-2 text-sm text-brain-600 dark:text-brain-400 hover:text-brain-700 dark:hover:text-brain-300"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule this task
                </button>

                <div className="flex flex-wrap gap-2">
                  {getQuickTimeOptions().map(option => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleQuickTime(option.date, option.time)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduling details */}
            {showScheduling && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  Schedule
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={timeboxDate}
                      onChange={e => setTimeboxDate(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="time"
                      className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Time
                    </label>
                    <input
                      id="time"
                      type="time"
                      value={timeboxStartTime}
                      onChange={e => setTimeboxStartTime(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScheduling(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Remove scheduling
                </button>
              </div>
            )}

            {/* Priority indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Zap className="w-4 h-4" />
              <span>
                {context.defaultImportance >= 7
                  ? 'High'
                  : context.defaultImportance >= 5
                    ? 'Medium'
                    : 'Low'}{' '}
                priority
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim() || isLoading}
              className={cn(
                'px-4 py-2 text-sm text-white rounded-lg transition-colors',
                'bg-brain-600 hover:bg-brain-700 disabled:bg-gray-400'
              )}
            >
              {isLoading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
