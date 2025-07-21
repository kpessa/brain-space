import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function TestAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[TestAuth] ${message}`)
  }

  const testGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    addLog('Starting Google OAuth flow...')

    try {
      const redirectTo = `${window.location.origin}/auth-callback`
      addLog(`Redirect URL: ${redirectTo}`)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        setError(error.message)
        addLog(`Error: ${error.message}`)
      } else {
        addLog('OAuth request successful')
        addLog(`Provider: ${data.provider}`)
        addLog(`URL: ${data.url}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      addLog(`Caught error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    addLog('Checking current session...')
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      addLog(`Session error: ${error.message}`)
    } else if (data.session) {
      addLog(`Session found: ${data.session.user.email}`)
      addLog(`Provider: ${data.session.user.app_metadata.provider}`)
    } else {
      addLog('No active session')
    }
  }

  const signOut = async () => {
    addLog('Signing out...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      addLog(`Sign out error: ${error.message}`)
    } else {
      addLog('Signed out successfully')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Google Auth Test</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">Setup Checklist:</h2>
        <ul className="space-y-1 text-sm">
          <li>✓ Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</li>
          <li>✓ Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</li>
          <li>✓ Redirect URLs configured in Google Console:</li>
          <li className="ml-4">- http://127.0.0.1:54321/auth/v1/callback</li>
          <li className="ml-4">- http://localhost:54321/auth/v1/callback</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={testGoogleAuth}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Google Sign In'}
        </button>

        <button
          onClick={checkSession}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Check Session
        </button>

        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
        <h3 className="text-white font-semibold mb-2">Console:</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  )
}
