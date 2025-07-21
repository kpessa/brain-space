import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the error and error_description from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        if (error) {
          setError(`${error}: ${errorDescription}`)
          return
        }

        // Check if we have a session after OAuth callback
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          setError(sessionError.message)
          return
        }

        if (session) {
          console.log('Auth callback: Session established', session.user.email)
          // Small delay to ensure auth state is propagated
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 100)
        } else {
          setError('No session found after authentication')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error during auth callback')
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brain-900 via-space-900 to-brain-800">
        <div className="bg-red-50 p-6 rounded-lg max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Authentication Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brain-900 via-space-900 to-brain-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">Completing sign in...</p>
      </div>
    </div>
  )
}
