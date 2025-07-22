import { useState } from 'react'
import { X } from 'lucide-react'
import type { TaskAttempt } from '@/store/useTimeboxStore'

interface AttemptDialogProps {
  taskId: string
  taskLabel: string
  attempts: TaskAttempt[]
  onAddAttempt: (attempt: Omit<TaskAttempt, 'id' | 'timestamp'>) => void
  onClose: () => void
}

export function AttemptDialog({
  taskId,
  taskLabel,
  attempts,
  onAddAttempt,
  onClose,
}: AttemptDialogProps) {
  const [outcome, setOutcome] = useState<TaskAttempt['outcome']>('partial')
  const [duration, setDuration] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [nextAction, setNextAction] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onAddAttempt({
      outcome,
      duration: duration ? parseInt(duration) : undefined,
      notes: notes.trim() || undefined,
      nextAction: nextAction.trim() || undefined,
    })

    // Reset form
    setOutcome('partial')
    setDuration('')
    setNotes('')
    setNextAction('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">Record Attempt</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{taskLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium mb-2">Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    value: 'success',
                    label: '✅ Success',
                    color: 'bg-green-100 border-green-300 text-green-800',
                  },
                  {
                    value: 'partial',
                    label: '🔄 Partial',
                    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                  },
                  {
                    value: 'failed',
                    label: '❌ Failed',
                    color: 'bg-red-100 border-red-300 text-red-800',
                  },
                  {
                    value: 'blocked',
                    label: '🚫 Blocked',
                    color: 'bg-gray-100 border-gray-300 text-gray-800',
                  },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setOutcome(option.value as TaskAttempt['outcome'])}
                    className={`p-2 rounded border-2 transition-all ${
                      outcome === option.value
                        ? `${option.color} border-opacity-100`
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-2">
                Time Spent (minutes)
              </label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="30"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                What did you try?
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe what you attempted..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            {/* Next Action */}
            {outcome !== 'success' && (
              <div>
                <label htmlFor="nextAction" className="block text-sm font-medium mb-2">
                  What to try next?
                </label>
                <textarea
                  id="nextAction"
                  value={nextAction}
                  onChange={e => setNextAction(e.target.value)}
                  placeholder="Next approach or what you need..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            )}
          </div>

          {/* Previous Attempts */}
          {attempts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Previous Attempts ({attempts.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {attempts.map((attempt, index) => (
                  <div key={attempt.id} className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {attempt.outcome === 'success' && '✅'}
                        {attempt.outcome === 'partial' && '🔄'}
                        {attempt.outcome === 'failed' && '❌'}
                        {attempt.outcome === 'blocked' && '🚫'}
                      </span>
                      <span>{new Date(attempt.timestamp).toLocaleDateString()}</span>
                      {attempt.duration && <span>{attempt.duration}min</span>}
                    </div>
                    {attempt.notes && (
                      <p className="mt-1 text-gray-600 dark:text-gray-400">{attempt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-brain-600 text-white rounded hover:bg-brain-700"
          >
            Record Attempt
          </button>
        </div>
      </div>
    </div>
  )
}
