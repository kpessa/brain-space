import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useJournalStore } from '../store/journal'
import { useAuth } from '../contexts/AuthContext'
import { LEVELS } from '../types/journal'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function RecalculateProgress() {
  const { user } = useAuth()
  const { entries, userProgress, setUserProgress } = useJournalStore()
  const [status, setStatus] = useState<'idle' | 'calculating' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)

  const recalculateProgress = () => {
    if (!user || entries.length === 0) {
      setStatus('error')
      setResult({ message: 'No user or entries found' })
      return
    }

    setStatus('calculating')

    try {
      // Calculate totals from entries
      const totalXP = entries.reduce((sum, entry) => sum + (entry.xpEarned || 0), 0)
      const totalEntries = entries.length

      // Calculate level based on total XP
      let currentLevel = 1
      let currentXP = totalXP

      for (let i = 0; i < LEVELS.length; i++) {
        if (totalXP >= LEVELS[i].minXP && totalXP < LEVELS[i].maxXP) {
          currentLevel = LEVELS[i].level
          currentXP = totalXP - LEVELS[i].minXP
          break
        }
      }

      // If totalXP exceeds all levels, set to max level
      if (totalXP >= LEVELS[LEVELS.length - 1].minXP) {
        currentLevel = LEVELS[LEVELS.length - 1].level
        currentXP = totalXP - LEVELS[LEVELS.length - 1].minXP
      }

      // Calculate streaks (simplified - just checking consecutive days)
      const sortedEntries = [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 1

      for (let i = 0; i < sortedEntries.length - 1; i++) {
        const current = new Date(sortedEntries[i].date)
        const next = new Date(sortedEntries[i + 1].date)
        const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }

      // Check if current streak is still active (last entry was today or yesterday)
      const lastEntryDate = sortedEntries[0] ? new Date(sortedEntries[0].date) : null
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastEntryDate) {
        const lastEntryDateOnly = new Date(lastEntryDate.toDateString())
        const todayDateOnly = new Date(today.toDateString())
        const yesterdayDateOnly = new Date(yesterday.toDateString())

        if (
          lastEntryDateOnly.getTime() === todayDateOnly.getTime() ||
          lastEntryDateOnly.getTime() === yesterdayDateOnly.getTime()
        ) {
          currentStreak = tempStreak
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak)

      const newProgress = {
        ...userProgress,
        userId: user.id,
        level: currentLevel,
        currentXP,
        totalXP,
        currentStreak,
        longestStreak,
        totalEntries,
        lastEntryDate: sortedEntries[0]?.date || null,
      }

      setUserProgress(newProgress)

      setResult({
        oldProgress: {
          level: userProgress.level,
          currentXP: userProgress.currentXP,
          totalXP: userProgress.totalXP,
          currentStreak: userProgress.currentStreak,
          longestStreak: userProgress.longestStreak,
          totalEntries: userProgress.totalEntries,
        },
        newProgress: {
          level: newProgress.level,
          currentXP: newProgress.currentXP,
          totalXP: newProgress.totalXP,
          currentStreak: newProgress.currentStreak,
          longestStreak: newProgress.longestStreak,
          totalEntries: newProgress.totalEntries,
        },
      })

      setStatus('success')
    } catch (error: any) {
      setStatus('error')
      setResult({ message: error.message })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Recalculate Progress</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Total Entries: {entries.length}</p>
              <p>Current Level: {userProgress.level}</p>
              <p>Current XP: {userProgress.currentXP}</p>
              <p>Total XP: {userProgress.totalXP}</p>
              <p>Current Streak: {userProgress.currentStreak}</p>
              <p>Longest Streak: {userProgress.longestStreak}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button
            onClick={recalculateProgress}
            disabled={status === 'calculating'}
            variant="primary"
            className="w-full"
          >
            {status === 'calculating' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              'Recalculate Progress from Entries'
            )}
          </Button>
        </div>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                {status === 'success' ? 'Progress Updated' : 'Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'success' ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Previous Progress:</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(result.oldProgress, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">New Progress:</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(result.newProgress, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">{result.message}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
