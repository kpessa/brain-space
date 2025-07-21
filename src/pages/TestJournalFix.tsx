import { useJournalStore } from '../store/journal'
import { Button } from '../components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'

export default function TestJournalFix() {
  const { userProgress, setUserProgress } = useJournalStore()

  const testNaNScenarios = () => {
    // Test scenario 1: Setting NaN values directly
    console.log('Testing NaN scenario...')
    setUserProgress({
      ...userProgress,
      totalXP: NaN,
      currentXP: NaN,
      level: NaN as any,
    })
  }

  const testInfinityScenario = () => {
    // Test scenario 2: Setting very high XP that would reach the Infinity level
    console.log('Testing Infinity scenario...')
    setUserProgress({
      ...userProgress,
      totalXP: 2000, // Beyond level 5
      currentXP: 1000,
      level: 5,
    })
  }

  const resetProgress = () => {
    setUserProgress({
      userId: 'demo-user',
      level: 1,
      currentXP: 0,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      achievements: [],
      lastEntryDate: null,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Journal NaN Fix Test</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current User Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                Level: {userProgress.level} (Valid: {!isNaN(userProgress.level)})
              </p>
              <p>
                Current XP: {userProgress.currentXP} (Valid: {!isNaN(userProgress.currentXP)})
              </p>
              <p>
                Total XP: {userProgress.totalXP} (Valid: {!isNaN(userProgress.totalXP)})
              </p>
              <p>
                Current Streak: {userProgress.currentStreak} (Valid:{' '}
                {!isNaN(userProgress.currentStreak)})
              </p>
              <p>
                Longest Streak: {userProgress.longestStreak} (Valid:{' '}
                {!isNaN(userProgress.longestStreak)})
              </p>
              <p>
                Total Entries: {userProgress.totalEntries} (Valid:{' '}
                {!isNaN(userProgress.totalEntries)})
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button onClick={testNaNScenarios} variant="primary">
            Test NaN Scenario
          </Button>

          <Button onClick={testInfinityScenario} variant="primary">
            Test Infinity Level Scenario
          </Button>

          <Button
            onClick={resetProgress}
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
          >
            Reset Progress
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Click the test buttons above and observe that the values remain valid numbers, not
              NaN. The fix ensures that any NaN values are converted to 0, and the Infinity level
              calculations are handled correctly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
