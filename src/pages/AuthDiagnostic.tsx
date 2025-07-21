import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthDiagnostic() {
  const [logs, setLogs] = useState<string[]>([])
  const [session, setSession] = useState<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[AuthDiag] ${message}`)
  }

  useEffect(() => {
    checkInitialState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state change: ${event}`)
      if (session) {
        addLog(`Session user: ${session.user.email}`)
        setSession(session)
      } else {
        addLog('Session is null')
        setSession(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkInitialState = async () => {
    addLog('Checking initial state...')

    // Check URL hash/params
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)
    addLog(`URL hash: ${hash || 'none'}`)
    addLog(`URL params: ${params.toString() || 'none'}`)

    // Check session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) {
      addLog(`Session error: ${error.message}`)
    } else if (session) {
      addLog(`Existing session: ${session.user.email}`)
      setSession(session)
    } else {
      addLog('No existing session')
    }

    // Check localStorage
    const storageKeys = Object.keys(localStorage).filter(
      key => key.includes('supabase') || key.includes('auth')
    )
    addLog(`Auth storage keys: ${storageKeys.join(', ') || 'none'}`)
  }

  const testGoogleAuth = async () => {
    addLog('Starting Google OAuth...')

    const redirectTo = `${window.location.origin}/auth-callback`
    addLog(`Redirect URL: ${redirectTo}`)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        addLog(`OAuth error: ${error.message}`)
      } else {
        addLog(`OAuth URL: ${data.url}`)
        addLog('Redirecting to Google...')
      }
    } catch (err) {
      addLog(`Exception: ${err}`)
    }
  }

  const exchangeCodeForSession = async () => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      addLog('No code found in URL')
      return
    }

    addLog(`Attempting to exchange code: ${code.substring(0, 10)}...`)

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        addLog(`Exchange error: ${error.message}`)
      } else {
        addLog(`Session established: ${data.session?.user.email}`)
      }
    } catch (err) {
      addLog(`Exchange exception: ${err}`)
    }
  }

  const clearAuth = async () => {
    addLog('Clearing auth state...')
    await supabase.auth.signOut()

    // Clear all auth-related localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
        addLog(`Removed: ${key}`)
      }
    })

    setSession(null)
    addLog('Auth state cleared')
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Auth Diagnostic Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current State */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-3">Current State</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Session:</span> {session ? 'Active' : 'None'}
            </div>
            {session && (
              <>
                <div>
                  <span className="font-medium">User:</span> {session.user.email}
                </div>
                <div>
                  <span className="font-medium">Provider:</span>{' '}
                  {session.user.app_metadata.provider}
                </div>
              </>
            )}
            <div>
              <span className="font-medium">Supabase URL:</span> {import.meta.env.VITE_SUPABASE_URL}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-3">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={testGoogleAuth}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Google OAuth
            </button>
            <button
              onClick={checkInitialState}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh State
            </button>
            <button
              onClick={exchangeCodeForSession}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exchange Code (if in URL)
            </button>
            <button
              onClick={clearAuth}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All Auth
            </button>
          </div>
        </div>
      </div>

      {/* Console */}
      <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4">
        <h2 className="text-white font-semibold mb-2">Diagnostic Logs</h2>
        <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Debugging Steps:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Clear All Auth" to start fresh</li>
          <li>Click "Test Google OAuth" and complete sign-in</li>
          <li>When redirected back, check the logs for any errors</li>
          <li>If you see a code in the URL, click "Exchange Code"</li>
          <li>Check if session is established</li>
        </ol>
      </div>
    </div>
  )
}
