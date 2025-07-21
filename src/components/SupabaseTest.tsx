import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function SupabaseTest() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        // Test the connection by checking if we can get the current user
        const { data, error } = await supabase.auth.getUser()

        if (error && error.message !== 'Auth session missing!') {
          throw error
        }

        setStatus('connected')
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Test</h3>
      {status === 'checking' && <p className="text-gray-500">Checking connection...</p>}
      {status === 'connected' && <p className="text-green-600">✓ Connected to Supabase</p>}
      {status === 'error' && (
        <div>
          <p className="text-red-600">✗ Connection failed</p>
          {error && <p className="text-sm text-gray-600 mt-1">{error}</p>}
        </div>
      )}
    </div>
  )
}
