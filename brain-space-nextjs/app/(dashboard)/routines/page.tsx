'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { SunMoon, Sun, Moon, Target, Calendar, TrendingUp, CheckCircle, Circle, Play, Pause, ChevronRight } from 'lucide-react'
import { useRoutineStore } from '@/store/routineStore'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTINE_MILESTONES, MORNING_RITUAL_SUGGESTIONS, DISTRACTION_CATEGORIES } from '@/types/routines'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { X } from 'lucide-react'




export default function Routines() {
  const { user } = useAuth()
  const {
    progress,
    currentEntry,
    entries,
    isLoading,
    initializeProgress,
    loadEntries,
    advanceDay,
    pauseJourney,
    resumeJourney,
    completeEvening,
    completeMorning,
    getMilestoneProgress,
  } = useRoutineStore()
  
  const [showStartJourney, setShowStartJourney] = useState(false)
  const [showEveningModal, setShowEveningModal] = useState(false)
  const [showMorningModal, setShowMorningModal] = useState(false)
  
  // Evening routine form state
  const [sleepIntention, setSleepIntention] = useState('22:30')
  const [wakeIntention, setWakeIntention] = useState('06:00')
  const [magicalMoment, setMagicalMoment] = useState('')
  const [morningRitualPlan, setMorningRitualPlan] = useState<string[]>([])
  
  // Morning routine form state
  const [actualSleepTime, setActualSleepTime] = useState('22:30')
  const [actualWakeTime, setActualWakeTime] = useState('06:00')
  const [ritualCompleted, setRitualCompleted] = useState<boolean[]>([])
  const [mit, setMit] = useState('')
  const [onePercentImprovement, setOnePercentImprovement] = useState('')
  const [distractionsToMinimize, setDistractionsToMinimize] = useState<{ distraction: string; limit: string }[]>([])
  
  useEffect(() => {
    if (user) {
      initializeProgress(user.uid).then(() => {
        loadEntries(user.uid)
      })
    }
  }, [user, initializeProgress, loadEntries])
  
  const progressPercentage = progress ? (progress.currentDay / 66) * 100 : 0
  const completionRate = progress && progress.totalDaysCompleted > 0 
    ? Math.round((progress.totalDaysCompleted / progress.currentDay) * 100) 
    : 0
  const milestoneProgress = getMilestoneProgress()
  
  // Get last 7 days of progress for the chart
  const getWeeklyProgress = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weekEntries = entries.slice(0, 7).reverse()
    
    return days.map((day, index) => {
      const entry = weekEntries[index]
      return {
        day,
        morning: entry?.morningCompleted ? 100 : 0,
        evening: entry?.eveningCompleted ? 100 : 0,
      }
    })
  }
  
  const startJourney = async () => {
    if (!user) return
    await advanceDay(user.uid)
    setShowStartJourney(false)
  }
  
  const handleCompleteEvening = async () => {
    if (!user) return
    await completeEvening(user.uid, {
      sleepIntention,
      wakeIntention,
      magicalMoment,
      morningRitualPlan,
    })
    setShowEveningModal(false)
  }
  
  const handleCompleteMorning = async () => {
    if (!user) return
    await completeMorning(user.uid, {
      actualSleepTime,
      actualWakeTime,
      ritualCompleted,
      mit,
      onePercentImprovement,
      distractionsToMinimize,
    })
    setShowMorningModal(false)
    
    // Advance to next day if both routines completed
    if (currentEntry?.eveningCompleted) {
      await advanceDay(user.uid)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading your routines...</p>
        </div>
      </div>
    )
  }
  
  if (!progress || progress.currentDay === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Morning & Evening Routines</h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Transform your days with intentional morning and evening routines. This 66-day journey
              helps you wake up earlier and start each day with purpose.
            </p>
          </header>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Start Your 66-Day Journey</CardTitle>
              <CardDescription>
                Build life-changing habits with science-backed routines
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={startJourney}
              >
                <Play className="w-5 h-5 mr-2" />
                Begin Journey
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SunMoon className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white">Daily Routines</h1>
          </div>
          <p className="text-white/80 text-lg">
            Transform your life with the power of morning and evening rituals
          </p>
        </header>

        {/* 66-Day Challenge Progress */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">66-Day Transformation Challenge</CardTitle>
            <CardDescription>
              Building habits that stick - you're {progress?.currentDay || 0} days into your journey!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Day {progress?.currentDay || 0}</span>
                <span>66 days total</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{progress?.currentStreak || 0}</div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{progress?.longestStreak || 0}</div>
                <div className="text-sm text-gray-600">Longest Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">{completionRate}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">{progress ? 66 - progress.currentDay : 66}</div>
                <div className="text-sm text-gray-600">Days Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Morning Routine */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Morning Routine</CardTitle>
                    <CardDescription>Start your day like a hero</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">
                    {currentEntry?.morningCompleted ? '100%' : '0%'}
                  </div>
                  <div className="text-xs text-gray-500">Today's Progress</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentEntry?.morningRitualPlan && currentEntry.morningRitualPlan.length > 0 ? (
                <div className="space-y-3">
                  {currentEntry.morningRitualPlan.map((ritual, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                      <button className="flex-shrink-0">
                        {currentEntry.ritualCompleted?.[index] ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium ${currentEntry.ritualCompleted?.[index] ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {ritual}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">Complete your evening routine first to plan tomorrow's morning ritual</p>
                </div>
              )}
              <Button 
                variant="primary" 
                className="w-full mt-4"
                onClick={() => setShowMorningModal(true)}
                disabled={!currentEntry?.eveningCompleted || currentEntry?.morningCompleted}
              >
                <Target className="w-4 h-4 mr-2" />
                {currentEntry?.morningCompleted ? 'Morning Routine Completed' : 'Complete Morning Routine'}
              </Button>
            </CardContent>
          </Card>

          {/* Evening Routine */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Moon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Evening Routine</CardTitle>
                    <CardDescription>Wind down and prepare for tomorrow</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentEntry?.eveningCompleted ? '100%' : '0%'}
                  </div>
                  <div className="text-xs text-gray-500">Today's Progress</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-600">
                  Plan tomorrow's morning ritual, set sleep intentions, and capture today's magical moment.
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="w-full mt-4"
                onClick={() => setShowEveningModal(true)}
                disabled={currentEntry?.eveningCompleted}
              >
                <Moon className="w-4 h-4 mr-2" />
                {currentEntry?.eveningCompleted ? 'Evening Routine Completed' : 'Start Evening Routine'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <div>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>Track your consistency across the week</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {getWeeklyProgress().map((day) => (
                <div key={day.day} className="text-center">
                  <div className="font-semibold text-gray-700 mb-2">{day.day}</div>
                  
                  {/* Morning progress */}
                  <div className="mb-2">
                    <div className="text-xs text-yellow-600 mb-1">Morning</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                        style={{ width: `${day.morning}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{day.morning}%</div>
                  </div>
                  
                  {/* Evening progress */}
                  <div>
                    <div className="text-xs text-purple-600 mb-1">Evening</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${day.evening}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{day.evening}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evening Routine Modal */}
      <Modal
        isOpen={showEveningModal}
        onClose={() => setShowEveningModal(false)}
        title="Evening Routine"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Prepare for tomorrow by setting intentions and planning your morning ritual.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What time do you intend to go to sleep?
            </label>
            <input
              type="time"
              value={sleepIntention}
              onChange={(e) => setSleepIntention(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What time do you intend to wake up?
            </label>
            <input
              type="time"
              value={wakeIntention}
              onChange={(e) => setWakeIntention(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What was your magical moment today?
            </label>
            <textarea
              value={magicalMoment}
              onChange={(e) => setMagicalMoment(e.target.value)}
              placeholder="Describe a moment that made you smile, feel grateful, or brought joy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500 h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan your morning ritual (3-5 simple actions)
            </label>
            <div className="space-y-2 mb-2">
              {morningRitualPlan.map((ritual, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ritual}
                    onChange={(e) => {
                      const updated = [...morningRitualPlan]
                      updated[index] = e.target.value
                      setMorningRitualPlan(updated)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
                  />
                  <button
                    onClick={() => {
                      setMorningRitualPlan(morningRitualPlan.filter((_, i) => i !== index))
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {morningRitualPlan.length < 5 && (
              <div className="flex flex-wrap gap-2">
                <p className="text-sm text-gray-500 w-full mb-2">Suggestions:</p>
                {MORNING_RITUAL_SUGGESTIONS.filter(
                  s => !morningRitualPlan.includes(s)
                ).slice(0, 5).map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => setMorningRitualPlan([...morningRitualPlan, suggestion])}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowEveningModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCompleteEvening}>
              <Moon className="w-4 h-4 mr-2" />
              Complete Evening Routine
            </Button>
          </div>
        </div>
      </Modal>

      {/* Morning Routine Modal */}
      <Modal
        isOpen={showMorningModal}
        onClose={() => setShowMorningModal(false)}
        title="Morning Routine"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Start your day strong by completing your morning ritual and setting intentions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What time did you go to sleep?
              </label>
              <input
                type="time"
                value={actualSleepTime}
                onChange={(e) => setActualSleepTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What time did you wake up?
              </label>
              <input
                type="time"
                value={actualWakeTime}
                onChange={(e) => setActualWakeTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
              />
            </div>
          </div>

          {currentEntry?.morningRitualPlan && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Morning Ritual Checklist
              </label>
              <div className="space-y-2">
                {currentEntry.morningRitualPlan.map((ritual, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={ritualCompleted[index] || false}
                      onChange={(e) => {
                        const updated = [...ritualCompleted]
                        updated[index] = e.target.checked
                        setRitualCompleted(updated)
                      }}
                      className="w-5 h-5 text-brain-600 rounded focus:ring-brain-500"
                    />
                    <span className={ritualCompleted[index] ? 'line-through text-gray-500' : ''}>
                      {ritual}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your Most Important Task (MIT) for today?
            </label>
            <input
              type="text"
              value={mit}
              onChange={(e) => setMit(e.target.value)}
              placeholder="The one thing that must get done today..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your 1% improvement for today?
            </label>
            <input
              type="text"
              value={onePercentImprovement}
              onChange={(e) => setOnePercentImprovement(e.target.value)}
              placeholder="One small way you'll get better today..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What distractions will you minimize today?
            </label>
            <div className="space-y-2 mb-2">
              {distractionsToMinimize.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.distraction}
                    onChange={(e) => {
                      const updated = [...distractionsToMinimize]
                      updated[index] = { ...item, distraction: e.target.value }
                      setDistractionsToMinimize(updated)
                    }}
                    placeholder="Distraction"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
                  />
                  <input
                    type="text"
                    value={item.limit}
                    onChange={(e) => {
                      const updated = [...distractionsToMinimize]
                      updated[index] = { ...item, limit: e.target.value }
                      setDistractionsToMinimize(updated)
                    }}
                    placeholder="Limit (e.g., 30 min)"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
                  />
                  <button
                    onClick={() => {
                      setDistractionsToMinimize(distractionsToMinimize.filter((_, i) => i !== index))
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {distractionsToMinimize.length < 3 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDistractionsToMinimize([...distractionsToMinimize, { distraction: '', limit: '' }])}
              >
                Add Distraction
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowMorningModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCompleteMorning}>
              <Sun className="w-4 h-4 mr-2" />
              Complete Morning Routine
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}