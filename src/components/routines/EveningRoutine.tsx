import { useState, useEffect } from 'react'
import { useRoutineStore } from '../../store/routines'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card'
import { Button } from '../Button'
import { Moon, Plus, X, Sparkles } from 'lucide-react'
import { MORNING_RITUAL_SUGGESTIONS } from '../../types/routines'
import { useRoutineAutoSave } from '../../hooks/useRoutineAutoSave'

export function EveningRoutine() {
  const { progress, currentEntry, completeEvening, isSyncing } = useRoutineStore()
  const autoSave = useRoutineAutoSave('evening')
  
  const [sleepTime, setSleepTime] = useState(currentEntry?.sleepIntention || '22:00')
  const [wakeTime, setWakeTime] = useState(currentEntry?.wakeIntention || '06:00')
  const [magicalMoment, setMagicalMoment] = useState(currentEntry?.magicalMoment || '')
  const [rituals, setRituals] = useState<string[]>(
    currentEntry?.morningRitualPlan || []
  )
  const [newRitual, setNewRitual] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Update form when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      setSleepTime(currentEntry.sleepIntention || '22:00')
      setWakeTime(currentEntry.wakeIntention || '06:00')
      setMagicalMoment(currentEntry.magicalMoment || '')
      setRituals(currentEntry.morningRitualPlan || [])
    }
  }, [currentEntry])
  
  // Auto-save when form data changes
  useEffect(() => {
    if (!currentEntry?.eveningCompleted) {
      autoSave({
        sleepIntention: sleepTime,
        wakeIntention: wakeTime,
        magicalMoment,
        morningRitualPlan: rituals,
      })
    }
  }, [sleepTime, wakeTime, magicalMoment, rituals, autoSave, currentEntry?.eveningCompleted])

  const handleAddRitual = () => {
    if (newRitual.trim() && rituals.length < 5) {
      setRituals([...rituals, newRitual.trim()])
      setNewRitual('')
    }
  }

  const handleRemoveRitual = (index: number) => {
    setRituals(rituals.filter((_, i) => i !== index))
  }

  const handleAddSuggestion = (suggestion: string) => {
    if (rituals.length < 5) {
      setRituals([...rituals, suggestion])
    }
  }

  const handleSubmit = async () => {
    if (magicalMoment.trim() && rituals.length >= 3) {
      await completeEvening({
        sleepIntention: sleepTime,
        wakeIntention: wakeTime,
        magicalMoment: magicalMoment.trim(),
        morningRitualPlan: rituals,
      })
    }
  }

  const isValid = magicalMoment.trim() && rituals.length >= 3 && rituals.length <= 5

  if (currentEntry?.eveningCompleted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-500" />
            <CardTitle>Evening Routine - Completed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800 mb-2">
              ✓ You've completed your evening routine for Day {progress?.currentDay}
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Sleep intention:</strong> {currentEntry.sleepIntention}</p>
              <p><strong>Wake intention:</strong> {currentEntry.wakeIntention}</p>
              <p><strong>Magical moment:</strong> {currentEntry.magicalMoment}</p>
              <div>
                <strong>Tomorrow's ritual:</strong>
                <ul className="list-disc list-inside mt-1">
                  {currentEntry.morningRitualPlan?.map((ritual, i) => (
                    <li key={i}>{ritual}</li>
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
          <Moon className="w-5 h-5 text-purple-500" />
          <CardTitle>
            Evening Routine - Day {progress?.currentDay}
            {progress?.currentDay === 0 && ' (Night 0)'}
          </CardTitle>
        </div>
        <CardDescription>
          Reflect on today and prepare for tomorrow's success
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sleep Intentions */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            🌙 Set Your Intention for Rest
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tonight I'll sleep at:</label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tomorrow I'll wake up at:</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Magical Moment */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Acknowledge the Good
          </h3>
          <label className="block text-sm font-medium mb-1">
            What was a magical moment or small win you experienced today?
          </label>
          <textarea
            value={magicalMoment}
            onChange={(e) => setMagicalMoment(e.target.value)}
            placeholder="Describe something that made you smile, a small victory, or a moment of gratitude..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
          />
        </div>

        {/* Morning Ritual Planning */}
        <div>
          <h3 className="font-semibold mb-3">
            📝 Design Tomorrow's Morning Ritual
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            List 3-5 simple actions to start your day. Keep them SMALL and achievable!
          </p>

          {/* Current Rituals */}
          <div className="space-y-2 mb-3">
            {rituals.map((ritual, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">{index + 1}.</span>
                <span className="flex-1">{ritual}</span>
                <button
                  onClick={() => handleRemoveRitual(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Ritual */}
          {rituals.length < 5 && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newRitual}
                onChange={(e) => setNewRitual(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRitual()}
                placeholder="Add a simple morning action..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddRitual}
                disabled={!newRitual.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {rituals.length < 5 && (
            <div>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-sm text-purple-600 hover:text-purple-700 mb-2"
              >
                {showSuggestions ? 'Hide' : 'Show'} suggestions
              </button>
              {showSuggestions && (
                <div className="grid grid-cols-2 gap-2">
                  {MORNING_RITUAL_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAddSuggestion(suggestion)}
                      className="text-left text-sm p-2 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                    >
                      + {suggestion}
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
          {isSyncing ? 'Saving...' : 'Complete Evening Routine'}
        </Button>

        {!isValid && (
          <p className="text-sm text-red-600 text-center">
            Please fill in your magical moment and add 3-5 morning rituals
          </p>
        )}
      </CardContent>
    </Card>
  )
}