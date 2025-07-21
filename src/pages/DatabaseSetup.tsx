import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function DatabaseSetup() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<string[]>([])

  const runMigrations = async () => {
    setStatus('running')
    setMessage('Running database migrations...')
    setDetails([])

    try {
      // Check if tables exist
      const { data: tables } = await supabase.rpc('get_table_names', {})

      const tableNames = tables?.map((t: any) => t.table_name) || []
      setDetails(prev => [...prev, `Found tables: ${tableNames.join(', ') || 'none'}`])

      // Create tables if they don't exist
      if (!tableNames.includes('journal_entries')) {
        setDetails(prev => [...prev, 'Creating journal_entries table...'])

        // For local development, you would run the SQL migration manually
        // In production, use Supabase migrations
        setDetails(prev => [...prev, '⚠️ Please run the migration SQL in your Supabase dashboard:'])
        setDetails(prev => [...prev, 'supabase/migrations/002_journal_tables.sql'])
      }

      if (!tableNames.includes('user_progress')) {
        setDetails(prev => [...prev, 'Creating user_progress table...'])
        setDetails(prev => [...prev, '⚠️ Please run the migration SQL in your Supabase dashboard'])
      }

      setStatus('success')
      setMessage('Database check complete!')
    } catch (error: any) {
      console.error('Migration error:', error)
      setStatus('error')
      setMessage('Error during database setup')
      setDetails(prev => [...prev, `Error: ${error.message}`])
    }
  }

  const testConnection = async () => {
    setStatus('running')
    setMessage('Testing database connection...')
    setDetails([])

    try {
      // Test connection
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`)
      }

      setDetails(prev => [...prev, `✓ Connected as: ${user?.email || 'anonymous'}`])

      // Try to query tables
      const { error: journalError } = await supabase
        .from('journal_entries')
        .select('count')
        .limit(1)

      if (journalError) {
        if (journalError.code === '42P01') {
          setDetails(prev => [...prev, '❌ journal_entries table not found'])
        } else {
          setDetails(prev => [...prev, `❌ Journal query error: ${journalError.message}`])
        }
      } else {
        setDetails(prev => [...prev, '✓ journal_entries table accessible'])
      }

      const { error: progressError } = await supabase.from('user_progress').select('count').limit(1)

      if (progressError) {
        if (progressError.code === '42P01') {
          setDetails(prev => [...prev, '❌ user_progress table not found'])
        } else {
          setDetails(prev => [...prev, `❌ Progress query error: ${progressError.message}`])
        }
      } else {
        setDetails(prev => [...prev, '✓ user_progress table accessible'])
      }

      setStatus('success')
      setMessage('Connection test complete!')
    } catch (error: any) {
      console.error('Connection test error:', error)
      setStatus('error')
      setMessage('Connection test failed')
      setDetails(prev => [...prev, `Error: ${error.message}`])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Database Setup</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Migration Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open your Supabase dashboard</li>
              <li>Go to SQL Editor</li>
              <li>
                Copy and run the contents of:{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  supabase/migrations/002_journal_tables.sql
                </code>
              </li>
              <li>Come back here and test the connection</li>
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button
            onClick={testConnection}
            disabled={status === 'running'}
            variant="primary"
            className="w-full"
          >
            {status === 'running' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Test Database Connection
          </Button>

          <Button
            onClick={runMigrations}
            disabled={status === 'running'}
            variant="outline"
            className="w-full text-white border-white/20 hover:bg-white/10"
          >
            Check Database Status
          </Button>
        </div>

        {message && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                {status === 'running' && <Loader2 className="w-5 h-5 animate-spin" />}
                {message}
              </CardTitle>
            </CardHeader>
            {details.length > 0 && (
              <CardContent>
                <div className="space-y-1">
                  {details.map((detail, i) => (
                    <p key={i} className="text-sm font-mono">
                      {detail}
                    </p>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
