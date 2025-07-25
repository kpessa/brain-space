'use client'

import { useState } from 'react'
import { RecurrencePattern } from '@/types/recurrence'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Calendar, Clock, Repeat } from 'lucide-react'

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
  const [startDate, setStartDate] = useState(
    pattern?.startDate || format(new Date(), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(pattern?.endDate || '')

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const handleSave = () => {
    const newPattern: RecurrencePattern = {
      type,
      frequency,
      startDate,
      endDate: endDate || undefined,
    }

    if (type === 'weekly' && daysOfWeek.length > 0) {
      newPattern.daysOfWeek = daysOfWeek
    }

    if (type === 'monthly') {
      newPattern.dayOfMonth = dayOfMonth
    }

    onChange(newPattern)
  }

  const handleRemove = () => {
    onChange(undefined)
  }

  return (
    <div className="p-4">
      {/* Pattern Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Recurrence Pattern</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('daily')}
            className={`p-2 text-sm rounded-lg border transition-colors ${
              type === 'daily'
                ? 'bg-brain-600 text-white border-brain-600'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setType('weekly')}
            className={`p-2 text-sm rounded-lg border transition-colors ${
              type === 'weekly'
                ? 'bg-brain-600 text-white border-brain-600'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setType('monthly')}
            className={`p-2 text-sm rounded-lg border transition-colors ${
              type === 'monthly'
                ? 'bg-brain-600 text-white border-brain-600'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setType('custom')}
            disabled
            className="p-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed"
          >
            Custom (Soon)
          </button>
        </div>
      </div>

      {/* Frequency */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          {type === 'daily' && 'Repeat every'}
          {type === 'weekly' && 'Repeat every'}
          {type === 'monthly' && 'Repeat every'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="30"
            value={frequency}
            onChange={e => setFrequency(parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <span className="text-sm">
            {type === 'daily' && (frequency === 1 ? 'day' : 'days')}
            {type === 'weekly' && (frequency === 1 ? 'week' : 'weeks')}
            {type === 'monthly' && (frequency === 1 ? 'month' : 'months')}
          </span>
        </div>
      </div>

      {/* Days of Week (for weekly) */}
      {type === 'weekly' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">On these days</label>
          <div className="flex gap-1">
            {weekDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDayOfWeek(index)}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  daysOfWeek.includes(index)
                    ? 'bg-brain-600 text-white border-brain-600'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day of Month (for monthly) */}
      {type === 'monthly' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">On day</label>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={e => setDayOfMonth(parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
        </div>
      )}

      {/* Date Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Date Range</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">Start:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">End:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-4 border-t dark:border-gray-700">
        <div>
          {pattern && (
            <Button variant="ghost" onClick={handleRemove} className="text-red-600">
              Remove Recurrence
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Repeat className="w-4 h-4 mr-2" />
            Save Pattern
          </Button>
        </div>
      </div>
    </div>
  )
}