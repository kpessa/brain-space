'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function FirebaseAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Completing sign in...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let handled = false

    const handleAuthCompletion = async () => {
      console.log('[Auth Handler] Starting auth completion process', {
        timestamp: new Date().toISOString(),
      })

      try {
        // First, check for redirect result
        const result = await getRedirectResult(auth)
        console.log('[Auth Handler] Redirect result:', {
          hasResult: !!result,
          hasUser: !!result?.user,
          timestamp: new Date().toISOString(),
        })

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (handled) return
          
          console.log('[Auth Handler] Auth state changed:', {
            hasUser: !!user,
            userEmail: user?.email,
            timestamp: new Date().toISOString(),
          })

          if (user) {
            handled = true
            setStatus('Setting up your session...')
            
            try {
              // Get fresh ID token
              const idToken = await user.getIdToken(true)
              console.log('[Auth Handler] Got ID token, setting cookie...')
              
              // Set auth cookie via API
              const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken }),
              })
              
              console.log('[Auth Handler] Cookie response:', {
                ok: response.ok,
                status: response.status,
                timestamp: new Date().toISOString(),
              })
              
              if (response.ok) {
                setStatus('Redirecting...')
                
                // Get redirect URL from params or default to journal
                const redirect = searchParams.get('redirect') || '/journal'
                console.log('[Auth Handler] Redirecting to:', redirect)
                
                // Use window.location for a full page reload to ensure middleware runs
                window.location.href = redirect
              } else {
                const data = await response.json()
                throw new Error(data.error || 'Failed to set session')
              }
            } catch (error) {
              console.error('[Auth Handler] Error setting cookie:', error)
              setError('Failed to complete sign in. Please try again.')
              handled = false
            }
          } else {
            // No user after waiting, redirect to login
            if (!handled) {
              console.log('[Auth Handler] No user found, redirecting to login')
              setTimeout(() => {
                if (!handled) {
                  router.push('/login')
                }
              }, 3000)
            }
          }
        })

        // Cleanup
        return () => {
          unsubscribe()
        }
      } catch (error) {
        console.error('[Auth Handler] Error:', error)
        setError('An error occurred during sign in. Please try again.')
      }
    }

    handleAuthCompletion()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{status}</p>
          </>
        ) : (
          <>
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}