import { useState } from 'react'
import type { RecurrencePattern } from '@/types/braindump'
import { formatRecurrencePattern } from '@/lib/recurringTasks'

interface RecurrenceSelectorProps {
  pattern?: RecurrencePattern
  onChange: (pattern: RecurrencePattern | undefined) => void
  onClose: () => void
}

export function RecurrenceSelector({ pattern, onChange, onClose }: RecurrenceSelectorProps) {
  const [type, setType] = useState<RecurrencePattern['type']>(pattern?.type || 'daily')
  const [frequency, setFrequency] = useState(pattern?.frequency || 1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(pattern?.daysOfWeek || [])
  const [dayOfMonth, setDayOfMonth] = useState(pattern?.dayOfMonth || 1)

  const handleSave = () => {
    const newPattern: RecurrencePattern = {
      type,
      frequency,
      startDate: new Date().toISOString().split('T')[0], // Today
      ...(type === 'weekly' && daysOfWeek.length > 0 && { daysOfWeek }),
      ...(type === 'monthly' && { dayOfMonth }),
    }
    onChange(newPattern)
    onClose()
  }

  const handleRemove = () => {
    onChange(undefined)
    onClose()
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold">Set Recurrence</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Pattern</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as RecurrencePattern['type'])}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Every {type === 'daily' ? 'X days' : type === 'weekly' ? 'X weeks' : 'X months'}
        </label>
        <input
          type="number"
          min="1"
          value={frequency}
          onChange={e => setFrequency(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {type === 'weekly' && (
        <div>
          <label className="block text-sm font-medium mb-1">Days of Week</label>
          <div className="flex gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <button
                key={index}
                onClick={() => {
                  setDaysOfWeek(prev =>
                    prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
                  )
                }}
                className={`w-8 h-8 rounded ${
                  daysOfWeek.includes(index)
                    ? 'bg-brain-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === 'monthly' && (
        <div>
          <label className="block text-sm font-medium mb-1">Day of Month</label>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={e => setDayOfMonth(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-brain-600 text-white rounded hover:bg-brain-700"
        >
          Save
        </button>
        {pattern && (
          <button
            onClick={handleRemove}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Remove
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
