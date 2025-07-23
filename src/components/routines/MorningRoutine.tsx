import { useState } from 'react'
import { useRoutineStore } from '../../store/routines'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card'
import { Button } from '../Button'
import { Sun, Plus, X, Target, TrendingUp, AlertCircle } from 'lucide-react'
import { DISTRACTION_CATEGORIES } from '../../types/routines'

export function MorningRoutine() {
  const { progress, currentEntry, completeMorning, isSyncing } = useRoutineStore()
  
  const [actualSleepTime, setActualSleepTime] = useState(
    currentEntry?.actualSleepTime || currentEntry?.sleepIntention || '22:00'
  )
  const [actualWakeTime, setActualWakeTime] = useState(
    currentEntry?.actualWakeTime || new Date().toTimeString().slice(0, 5)
  )
  const [ritualCompleted, setRitualCompleted] = useState<boolean[]>(
    currentEntry?.ritualCompleted || 
    new Array(currentEntry?.morningRitualPlan?.length || 0).fill(false)
  )
  const [mit, setMit] = useState(currentEntry?.mit || '')
  const [onePercent, setOnePercent] = useState(currentEntry?.onePercentImprovement || '')
  const [distractions, setDistractions] = useState<{ distraction: string; limit: string }[]>(
    currentEntry?.distractionsToMinimize || []
  )
  const [newDistraction, setNewDistraction] = useState('')
  const [newLimit, setNewLimit] = useState('')
  const [showDistSuggestions, setShowDistSuggestions] = useState(false)

  const rituals = currentEntry?.morningRitualPlan || []

  const toggleRitual = (index: number) => {
    const updated = [...ritualCompleted]
    updated[index] = !updated[index]
    setRitualCompleted(updated)
  }

  const addDistraction = () => {
    if (newDistraction.trim() && newLimit.trim() && distractions.length < 2) {
      setDistractions([...distractions, { 
        distraction: newDistraction.trim(), 
        limit: newLimit.trim() 
      }])
      setNewDistraction('')
      setNewLimit('')
    }
  }

  const removeDistraction = (index: number) => {
    setDistractions(distractions.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (mit.trim() && onePercent.trim() && distractions.length >= 1) {
      await completeMorning({
        actualSleepTime,
        actualWakeTime,
        ritualCompleted,
        mit: mit.trim(),
        onePercentImprovement: onePercent.trim(),
        distractionsToMinimize: distractions,
      })
    }
  }

  const isValid = mit.trim() && onePercent.trim() && distractions.length >= 1

  if (currentEntry?.morningCompleted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-yellow-500" />
            <CardTitle>Morning Routine - Completed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              ✓ You've completed your morning routine for Day {progress?.currentDay}
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Wake time:</strong> {currentEntry.actualWakeTime}</p>
              <p><strong>MIT:</strong> {currentEntry.mit}</p>
              <p><strong>1% improvement:</strong> {currentEntry.onePercentImprovement}</p>
              <div>
                <strong>Distractions minimized:</strong>
                <ul className="list-disc list-inside mt-1">
                  {currentEntry.distractionsToMinimize?.map((d, i) => (
                    <li key={i}>{d.distraction} ({d.limit})</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-500" />
          <CardTitle>Morning Routine - Day {progress?.currentDay}</CardTitle>
        </div>
        <CardDescription>
          Complete your ritual and set your intentions for the day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Morning Ritual Checklist */}
        <div>
          <h3 className="font-semibold mb-3">☀️ Complete Your Ritual & Check It Off</h3>
          <p className="text-sm text-gray-600 mb-3">
            First, perform the morning ritual you planned last night.
          </p>
          <div className="space-y-2">
            {rituals.map((ritual, index) => (
              <label
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={ritualCompleted[index] || false}
                  onChange={() => toggleRitual(index)}
                  className="w-5 h-5 text-yellow-500"
                />
                <span className={ritualCompleted[index] ? 'line-through text-gray-500' : ''}>
                  {ritual}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sleep Review */}
        <div>
          <h3 className="font-semibold mb-3">😴 Review Your Sleep</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Last night I slept at:</label>
              <input
                type="time"
                value={actualSleepTime}
                onChange={(e) => setActualSleepTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">I woke up today at:</label>
              <input
                type="time"
                value={actualWakeTime}
                onChange={(e) => setActualWakeTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Most Important Task */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-500" />
            Define Your Priority
          </h3>
          <label className="block text-sm font-medium mb-1">
            What is your Most Important Task (MIT) for today?
          </label>
          <textarea
            value={mit}
            onChange={(e) => setMit(e.target.value)}
            placeholder="The one task that, if completed, would make today a success..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
          />
        </div>

        {/* 1% Improvement */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Commit to 1% Improvement
          </h3>
          <label className="block text-sm font-medium mb-1">
            What is one small way you can improve your life today?
          </label>
          <input
            type="text"
            value={onePercent}
            onChange={(e) => setOnePercent(e.target.value)}
            placeholder="A tiny step towards a better version of yourself..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Distractions to Minimize */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Protect Your Evening
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            What are the top two distractions to minimize tonight? Set generous yet strict time limits.
          </p>

          {/* Current Distractions */}
          <div className="space-y-2 mb-3">
            {distractions.map((d, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="flex-1">{d.distraction}</span>
                <span className="text-sm font-medium text-gray-600">Limit: {d.limit}</span>
                <button
                  onClick={() => removeDistraction(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Distraction */}
          {distractions.length < 2 && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newDistraction}
                onChange={(e) => setNewDistraction(e.target.value)}
                placeholder="Distraction to minimize..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <input
                type="text"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="Time limit..."
                className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={addDistraction}
                disabled={!newDistraction.trim() || !newLimit.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {distractions.length < 2 && (
            <div>
              <button
                onClick={() => setShowDistSuggestions(!showDistSuggestions)}
                className="text-sm text-yellow-600 hover:text-yellow-700 mb-2"
              >
                {showDistSuggestions ? 'Hide' : 'Show'} common distractions
              </button>
              {showDistSuggestions && (
                <div className="grid grid-cols-2 gap-2">
                  {DISTRACTION_CATEGORIES.map((distraction) => (
                    <button
                      key={distraction}
                      onClick={() => setNewDistraction(distraction)}
                      className="text-left text-sm p-2 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors"
                    >
                      {distraction}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={!isValid || isSyncing}
        >
          {isSyncing ? 'Saving...' : 'Complete Morning Routine'}
        </Button>

        {!isValid && (
          <p className="text-sm text-red-600 text-center">
            Please complete all fields and add at least one distraction to minimize
          </p>
        )}
      </CardContent>
    </Card>
  )
}