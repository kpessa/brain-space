import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useJournalStore } from '../store/journal'
import { useAuth } from '../contexts/AuthContext'
import { supabaseService } from '../services/supabase'
import { toSnakeCase, toCamelCase } from '../lib/supabaseHelpers'
import { logger } from '../services/logger'

export default function DebugJournal() {
  const { user } = useAuth()
  const { entries, userProgress } = useJournalStore()
  const [dbEntries, setDbEntries] = useState<any[]>([])
  const [testResult, setTestResult] = useState<any>({})

  const testConversion = () => {
    const testObj = {
      currentXP: 100,
      totalXP: 500,
      currentStreak: 7,
      longestStreak: 14,
      lastEntryDate: '2024-01-20',
    }

    const snakeCase = toSnakeCase(testObj)
    const backToCamel = toCamelCase(snakeCase)

    setTestResult({
      original: testObj,
      snakeCase,
      backToCamel,
    })
  }

  const loadDirectFromDB = async () => {
    if (!user) return

    try {
      logger.info('DEBUG', 'Loading entries directly from DB', { userId: user.id })
      const entries = await supabaseService.getJournalEntries(user.id)
      logger.info('DEBUG', 'Loaded entries from DB', { count: entries.length, entries })
      setDbEntries(entries)
    } catch (error) {
      logger.error('DEBUG', 'Error loading entries', error)
      console.error('Error loading entries:', error)
    }
  }

  const handleRecalculateProgress = async () => {
    logger.info('DEBUG', 'Manual recalculate progress triggered')
    try {
      await useJournalStore.getState().recalculateProgress()
      logger.info('DEBUG', 'Recalculate progress completed')
    } catch (error) {
      logger.error('DEBUG', 'Error during recalculate progress', error)
    }
  }

  useEffect(() => {
    testConversion()
    if (user) {
      loadDirectFromDB()
    }

    // Add keyboard shortcut for downloading logs (Ctrl+Shift+L)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault()
        logger.downloadLogs()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Journal Debug</h1>
          <Button onClick={() => logger.downloadLogs()} variant="secondary">
            Download Debug Logs
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(
                {
                  userId: user?.id,
                  email: user?.email,
                  isAuthenticated: !!user,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Conversion Test</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Entries in store: {entries.length}</p>
              <Button onClick={handleRecalculateProgress} variant="secondary" className="mb-2">
                Recalculate Progress
              </Button>
              <p>User Progress:</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(userProgress, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direct DB Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={loadDirectFromDB} variant="primary">
                Reload from DB
              </Button>
              <p>Entries from DB: {dbEntries.length}</p>
              {dbEntries.map((entry, i) => (
                <div key={i} className="p-2 bg-gray-100 rounded text-xs">
                  <pre>{JSON.stringify(entry, null, 2)}</pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
