import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Zap, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuickAdd } from '@/hooks/useQuickAdd'
import { NodeCategorySelector } from './NodeCategorySelector'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<string | undefined>()
  const [urgency, setUrgency] = useState(5)
  const [importance, setImportance] = useState(5)
  const [reasoning, setReasoning] = useState('')
  const [showScheduling, setShowScheduling] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { context, addNode } = useQuickAdd()

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (context.defaultDate) {
        setDueDate(context.defaultDate)
        setShowScheduling(context.defaultScheduled)
      }
      setUrgency(context.defaultUrgency)
      setImportance(context.defaultImportance)
    }
  }, [isOpen, context])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setText('')
      setCategory(undefined)
      setUrgency(5)
      setImportance(5)
      setReasoning('')
      setDueDate('')
      setScheduledTime('')
      setShowScheduling(false)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsLoading(true)
    try {
      await addNode({
        type: 'thought',
        text: text.trim(),
        category,
        urgency,
        importance,
        reasoning:
          reasoning.trim() ||
          `${context.page} context: urgency ${urgency}/10, importance ${importance}/10`,
        dueDate: showScheduling && dueDate ? dueDate : undefined,
        scheduledTime: showScheduling && scheduledTime ? scheduledTime : undefined,
      })
      onClose()
    } catch (error) {
      console.error('Failed to add node:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getQuickTimeOptions = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentHour = now.getHours()

    return [
      { label: 'Today', date: today, time: '' },
      { label: 'Tomorrow', date: getDateOffset(1), time: '' },
      { label: 'Next week', date: getDateOffset(7), time: '' },
      { label: 'In 2 weeks', date: getDateOffset(14), time: '' },
    ]
  }

  const getDateOffset = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const handleQuickTime = (date: string, time: string) => {
    setDueDate(date)
    setScheduledTime(time)
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Node</h2>
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
              Context: <span className="font-medium capitalize">{context.page}</span>
              {context.defaultScheduled && ' (scheduled)'}
            </div>

            {/* Thought input */}
            <div>
              <label htmlFor="node-text" className="sr-only">
                Thought description
              </label>
              <textarea
                id="node-text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brain-500 focus:border-transparent resize-none"
                rows={2}
                autoFocus
              />
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <NodeCategorySelector value={category} onChange={setCategory} />
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
                  Add due date
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
                  <Calendar className="w-4 h-4" />
                  Due Date
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Due Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="time"
                      className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Time (optional)
                    </label>
                    <input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScheduling(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Remove due date
                </button>
              </div>
            )}

            {/* Priority controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Brain className="w-4 h-4" />
                Priority Assessment
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Urgency: {urgency}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={urgency}
                    onChange={e => setUrgency(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Importance: {importance}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={importance}
                    onChange={e => setImportance(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Reasoning (optional)
                </label>
                <textarea
                  value={reasoning}
                  onChange={e => setReasoning(e.target.value)}
                  placeholder="Why this priority level?"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={2}
                />
              </div>
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
              disabled={!text.trim() || isLoading}
              className={cn(
                'px-4 py-2 text-sm text-white rounded-lg transition-colors',
                'bg-brain-600 hover:bg-brain-700 disabled:bg-gray-400'
              )}
            >
              {isLoading ? 'Adding...' : 'Add Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
