import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthDebug() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    addLog('Component mounted, checking session...')

    // Check current session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        addLog(`Error getting session: ${error.message}`)
      } else {
        addLog(`Session check: ${data.session ? 'Found' : 'Not found'}`)
        setSession(data.session)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth event: ${event}`)
      if (session) {
        addLog(`Session user: ${session.user.email}`)
      }
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleSignIn = async () => {
    addLog('Starting Google sign in...')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      addLog(`Error: ${error.message}`)
    } else {
      addLog(`Redirecting to Google...`)
      console.log('OAuth response:', data)
    }
  }

  const handleSignOut = async () => {
    addLog('Signing out...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      addLog(`Sign out error: ${error.message}`)
    } else {
      addLog('Signed out successfully')
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Auth Debug Panel</h2>

      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Current Status:</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p>Session: {session ? 'Active' : 'None'}</p>
            {session && (
              <>
                <p>User: {session.user.email}</p>
                <p>Provider: {session.user.app_metadata.provider}</p>
              </>
            )}
          </>
        )}
      </div>

      <div className="mb-4 space-x-2">
        {!session ? (
          <button
            onClick={handleGoogleSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign in with Google
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        )}
      </div>

      <div className="p-4 bg-gray-900 text-gray-100 rounded">
        <h3 className="font-semibold mb-2">Logs:</h3>
        <div className="text-xs font-mono space-y-1">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <h3 className="font-semibold mb-2">Important:</h3>
        <p className="text-sm">Make sure these redirect URIs are in your Google Console:</p>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>http://127.0.0.1:54321/auth/v1/callback</li>
          <li>http://localhost:54321/auth/v1/callback</li>
        </ul>
      </div>
    </div>
  )
}
