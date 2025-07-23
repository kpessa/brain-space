import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { checkMigrationStatus, runFullMigration } from '@/lib/todoService'
import { runDirectMigration } from '@/lib/directTodoMigration'
import { CheckCircle, AlertCircle, Loader2, Database, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MigrationStatus {
  hasMigrated: boolean
  todoCount: number
  unmigrated: {
    braindumps: number
    journal: number
    routines: number
  }
}

interface MigrationResult {
  summary: {
    braindumps: { total: number; migrated: number }
    journal: { total: number; migrated: number }
    routines: { total: number; migrated: number }
    errors: string[]
  }
}

export default function TodoMigration() {
  const { user } = useAuth()
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (user) {
      checkStatus()
    }
  }, [user])

  const checkStatus = async () => {
    if (!user) return
    
    setIsChecking(true)
    try {
      const migrationStatus = await checkMigrationStatus(user.id)
      setStatus(migrationStatus)
    } catch (error) {
      // console.error('Error checking migration status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const runMigration = async () => {
    if (!user) return
    
    setIsMigrating(true)
    try {
      // Use direct migration approach
      const result = await runDirectMigration(user.id)
      
      // Transform result to match expected format
      const transformedResult = {
        summary: {
          braindumps: { 
            total: result.summary.braindumps.success + result.summary.braindumps.errors.length,
            migrated: result.summary.braindumps.success 
          },
          journal: { 
            total: result.summary.journal.success + result.summary.journal.errors.length,
            migrated: result.summary.journal.success 
          },
          routines: { 
            total: result.summary.routines.success + result.summary.routines.errors.length,
            migrated: result.summary.routines.success 
          },
          errors: [
            ...result.summary.braindumps.errors,
            ...result.summary.journal.errors,
            ...result.summary.routines.errors,
          ],
        },
      }
      
      setMigrationResult(transformedResult)
      // Recheck status after migration
      await checkStatus()
    } catch (error) {
      // console.error('Error running migration:', error)
      setMigrationResult({
        summary: {
          braindumps: { total: 0, migrated: 0 },
          journal: { total: 0, migrated: 0 },
          routines: { total: 0, migrated: 0 },
          errors: [`Migration failed: ${error instanceof Error ? error.message : String(error)}`],
        },
      })
    } finally {
      setIsMigrating(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brain-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Checking migration status...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalUnmigrated = status
    ? status.unmigrated.braindumps + status.unmigrated.journal + status.unmigrated.routines
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Todo System Migration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Migrate your existing tasks to the new unified todo system
          </p>
        </header>

        {/* Status Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Migration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Current Todo Count
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Todos in the new unified system
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-brain-600">
                    {status.todoCount}
                  </div>
                </div>

                {status.hasMigrated && totalUnmigrated === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Migration Complete
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        All your data has been migrated to the new todo system
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Items to Migrate:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">BrainDump Tasks</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {status.unmigrated.braindumps}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Journal Quests</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {status.unmigrated.journal}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Routine Items</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {status.unmigrated.routines}
                        </p>
                      </div>
                    </div>

                    {totalUnmigrated > 0 && (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={runMigration}
                        disabled={isMigrating}
                      >
                        {isMigrating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Migrating...
                          </>
                        ) : (
                          <>
                            Migrate {totalUnmigrated} Items
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migration Results */}
        {migrationResult && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Results</CardTitle>
              <CardDescription>
                Summary of the migration process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Success Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">BrainDumps</p>
                    <p className="text-2xl font-bold text-brain-600">
                      {migrationResult.summary.braindumps.migrated}/{migrationResult.summary.braindumps.total}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Journal</p>
                    <p className="text-2xl font-bold text-space-600">
                      {migrationResult.summary.journal.migrated}/{migrationResult.summary.journal.total}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Routines</p>
                    <p className="text-2xl font-bold text-green-600">
                      {migrationResult.summary.routines.migrated}/{migrationResult.summary.routines.total}
                    </p>
                  </div>
                </div>

                {/* Errors */}
                {migrationResult.summary.errors.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {migrationResult.summary.errors.length} errors occurred
                      <span className="text-gray-500">
                        ({showDetails ? 'hide' : 'show'} details)
                      </span>
                    </button>
                    
                    {showDetails && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                          {migrationResult.summary.errors.map((error, index) => (
                            <li key={index} className="break-words">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Success Message */}
                {migrationResult.summary.errors.length === 0 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-green-900 dark:text-green-100">
                      Migration completed successfully!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About the Unified Todo System</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              The new unified todo system brings all your tasks, quests, and routines into one place:
            </p>
            <ul>
              <li>
                <strong>BrainDump tasks</strong> - All thought nodes with importance/urgency ratings
              </li>
              <li>
                <strong>Journal quests</strong> - Your daily quests from journal entries
              </li>
              <li>
                <strong>Routine items</strong> - Morning rituals, MITs, and improvement goals
              </li>
            </ul>
            <p>
              Benefits of migration:
            </p>
            <ul>
              <li>Unified task management across all features</li>
              <li>Consistent prioritization with Eisenhower matrix</li>
              <li>Better recurring task and habit tracking</li>
              <li>Enhanced search and filtering capabilities</li>
              <li>Cross-feature visibility and integration</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}