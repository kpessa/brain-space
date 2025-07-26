'use client'

import { useState } from 'react'
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Brain, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function LoginClient() {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)
    
    console.log('[Login] Starting sign in process', {
      timestamp: new Date().toISOString(),
      isProduction: process.env.NODE_ENV === 'production',
    })
    
    try {
      const provider = new GoogleAuthProvider()
      
      // Check if we're in production and should use redirect instead of popup
      const isProduction = process.env.NODE_ENV === 'production'
      const shouldUseRedirect = isProduction && typeof window !== 'undefined' && 
        (window.location.hostname.includes('vercel.app') || 
         window.location.hostname !== 'localhost')

      console.log('[Login] Auth method:', shouldUseRedirect ? 'redirect' : 'popup')

      if (shouldUseRedirect) {
        // Store redirect URL in sessionStorage for after auth
        const redirect = searchParams.get('redirect') || '/journal'
        sessionStorage.setItem('auth_redirect', redirect)
        
        // Use redirect flow in production
        console.log('[Login] Using redirect flow for production')
        await signInWithRedirect(auth, provider)
        // This won't return - browser will redirect
        return
      }

      try {
        // Try popup first in development
        console.log('[Login] Attempting popup sign in')
        const result = await signInWithPopup(auth, provider)
        
        console.log('[Login] Popup sign in successful, setting cookie')
        
        // Get the ID token
        const idToken = await result.user.getIdToken()
        
        // Set auth cookie via API
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
        })
        
        console.log('[Login] Cookie response:', response.ok ? 'success' : 'failed')
        
        if (response.ok) {
          // Redirect to intended page or journal
          const redirect = searchParams.get('redirect') || '/journal'
          console.log('[Login] Redirecting to:', redirect)
          window.location.href = redirect
        } else {
          const data = await response.json()
          throw new Error(data.error || 'Failed to set session')
        }
      } catch (popupError: any) {
        // If popup blocked or COOP error, fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message?.includes('Cross-Origin-Opener-Policy')) {
          console.log('[Login] Popup blocked, falling back to redirect')
          
          // Store redirect URL for after auth
          const redirect = searchParams.get('redirect') || '/journal'
          sessionStorage.setItem('auth_redirect', redirect)
          
          await signInWithRedirect(auth, provider)
        } else {
          throw popupError
        }
      }
    } catch (error) {
      console.error('[Login] Sign in failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in')
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-brain-600" />
            <h1 className="text-2xl font-bold text-gray-900">Brain Space</h1>
            <Sparkles className="h-6 w-6 text-space-600" />
          </div>
          <p className="text-gray-600">
            Capture, organize, and explore your thoughts with AI
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full bg-brain-600 hover:bg-brain-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSigningIn ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="text-brain-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-brain-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}