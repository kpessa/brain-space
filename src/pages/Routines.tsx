import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRoutineStore } from '../store/routines'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Sun, Moon, ChevronRight, Calendar, Trophy, Pause, Play } from 'lucide-react'
import { ROUTINE_MILESTONES } from '../types/routines'
import { MorningRoutine } from '../components/routines/MorningRoutine'
import { EveningRoutine } from '../components/routines/EveningRoutine'

export default function Routines() {
  const { user } = useAuth()
  const {
    progress,
    currentEntry,
    isLoading,
    initializeProgress,
    loadEntries,
    advanceDay,
    pauseJourney,
    resumeJourney,
    getMilestoneProgress,
  } = useRoutineStore()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [showMorning, setShowMorning] = useState(false)
  const [showEvening, setShowEvening] = useState(false)

  useEffect(() => {
    if (user) {
      // First initialize progress, then load entries
      initializeProgress(user.id).then(() => {
        loadEntries(user.id)
      })
    }
  }, [user, initializeProgress, loadEntries])

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Determine which routine to show based on time and completion
  useEffect(() => {
    const hour = currentTime.getHours()
    const isEvening = hour >= 18 || hour < 4 // 6 PM to 4 AM
    const isMorning = hour >= 4 && hour < 12 // 4 AM to noon

    if (currentEntry) {
      // Show based on what's not completed
      if (!currentEntry.eveningCompleted && isEvening) {
        setShowEvening(true)
        setShowMorning(false)
      } else if (!currentEntry.morningCompleted && isMorning) {
        setShowMorning(true)
        setShowEvening(false)
      } else {
        // Show next incomplete routine
        if (!currentEntry.eveningCompleted) {
          setShowEvening(true)
          setShowMorning(false)
        } else if (!currentEntry.morningCompleted) {
          setShowMorning(true)
          setShowEvening(false)
        }
      }
    } else if (progress && progress.currentDay > 0) {
      // No entry for today yet
      setShowEvening(isEvening)
      setShowMorning(!isEvening)
    }
  }, [currentTime, currentEntry, progress])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 flex items-center justify-center overflow-x-hidden">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading your routines...</p>
        </div>
      </div>
    )
  }

  if (!progress || progress.currentDay === 0) {
    // Journey not started
    return (
      <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4 overflow-x-hidden">
        <div className="max-w-4xl mx-auto max-w-screen">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Morning & Evening Routines</h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Transform your days with intentional morning and evening routines. 
              This 66-day journey helps you wake up earlier and start each day with purpose.
            </p>
          </header>

          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center gap-4 mb-4">
                <Sun className="w-12 h-12 text-yellow-500" />
                <Moon className="w-12 h-12 text-purple-500" />
              </div>
              <CardTitle className="text-2xl">Begin Your 66-Day Journey</CardTitle>
              <CardDescription className="text-lg mt-2">
                Progress, not perfection. If you miss a day, simply resume when ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What You'll Do:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Moon className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span><strong>Evening:</strong> Set sleep intentions, acknowledge wins, plan tomorrow's ritual</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sun className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span><strong>Morning:</strong> Complete your ritual, define priorities, commit to growth</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => advanceDay()}
              >
                Start Night 0 (Your First Evening)
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const milestoneProgress = getMilestoneProgress()
  const nextMilestone = ROUTINE_MILESTONES.find(m => m.day === milestoneProgress?.next)

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4 overflow-x-hidden touch-pan-y">
      <div className="max-w-4xl mx-auto max-w-screen">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">Your Daily Routines</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => progress.isActive ? pauseJourney() : resumeJourney()}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                {progress.isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-white/80">
            Day {progress.currentDay} of 66 
            {!progress.isActive && <span className="ml-2 text-yellow-400">(Paused)</span>}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <CardTitle>Your Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Day {progress.currentDay} of 66</span>
                  <span>{Math.round((progress.currentDay / 66) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-brain-500 to-space-500 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.currentDay / 66) * 100}%` }}
                  />
                </div>
              </div>

              {milestoneProgress && nextMilestone && (
                <div className="text-sm">
                  <p className="text-gray-600">Next milestone:</p>
                  <p className="font-semibold">{nextMilestone.title} (Day {nextMilestone.day})</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-2xl font-bold text-brain-600">{progress.currentStreak}</p>
                  <p className="text-gray-600">Current Streak</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="text-2xl font-bold text-space-600">{progress.totalDaysCompleted}</p>
                  <p className="text-gray-600">Days Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brain-500" />
                <CardTitle>Today's Routines</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowEvening(true)
                    setShowMorning(false)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    showEvening
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Moon className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold mb-1">Evening Routine</h3>
                  <p className="text-sm text-gray-600">
                    {currentEntry?.eveningCompleted ? '✓ Completed' : 'Not completed'}
                  </p>
                </button>

                <button
                  onClick={() => {
                    setShowMorning(true)
                    setShowEvening(false)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    showMorning
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Sun className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="font-semibold mb-1">Morning Routine</h3>
                  <p className="text-sm text-gray-600">
                    {currentEntry?.morningCompleted ? '✓ Completed' : 'Not completed'}
                  </p>
                </button>
              </div>

              {currentEntry?.eveningCompleted && currentEntry?.morningCompleted && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-green-800 font-semibold">
                    🎉 Both routines completed for Day {progress.currentDay}!
                  </p>
                  {progress.currentDay < 66 && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-2"
                      onClick={() => advanceDay()}
                    >
                      Start Day {progress.currentDay + 1}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Routine Components */}
        {showEvening && <EveningRoutine />}
        {showMorning && <MorningRoutine />}
      </div>
    </div>
  )
}