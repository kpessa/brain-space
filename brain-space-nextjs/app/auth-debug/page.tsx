'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function AuthDebugPage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  const [authState, setAuthState] = useState<any>(null)
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [authListenerState, setAuthListenerState] = useState<string>('waiting')

  useEffect(() => {
    // Check Firebase config
    setFirebaseConfig({
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })

    // Direct auth state listener
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        setAuthListenerState('active')
        setAuthState({
          user: user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            isAnonymous: user.isAnonymous,
            metadata: user.metadata,
          } : null,
          isSignedIn: !!user,
        })
      },
      (error) => {
        setAuthListenerState('error')
        setError(error.message)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
    } catch (err: any) {
      setError(err.message || 'Sign out failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Firebase Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Configuration</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Auth Domain:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{firebaseConfig?.authDomain || 'Not Set'}</code>
            </p>
            <p className="text-sm">
              <span className="font-medium">Project ID:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{firebaseConfig?.projectId || 'Not Set'}</code>
            </p>
            <p className="text-sm">
              <span className="font-medium">API Key:</span>{' '}
              <span className={firebaseConfig?.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                {firebaseConfig?.hasApiKey ? '✓ Set' : '✗ Not Set'}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">App ID:</span>{' '}
              <span className={firebaseConfig?.hasAppId ? 'text-green-600' : 'text-red-600'}>
                {firebaseConfig?.hasAppId ? '✓ Set' : '✗ Not Set'}
              </span>
            </p>
          </div>
        </div>

        {/* Auth Context State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Context State</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Loading:</span>{' '}
              <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                {loading ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">User:</span>{' '}
              {user ? (
                <span className="text-green-600">Signed In ({user.email})</span>
              ) : (
                <span className="text-gray-600">Not Signed In</span>
              )}
            </p>
          </div>
        </div>

        {/* Direct Auth State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Direct Firebase Auth State</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Listener Status:</span>{' '}
              <span className={authListenerState === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                {authListenerState}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Is Signed In:</span>{' '}
              <span className={authState?.isSignedIn ? 'text-green-600' : 'text-gray-600'}>
                {authState?.isSignedIn ? 'Yes' : 'No'}
              </span>
            </p>
            {authState?.user && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-xs font-medium mb-2">User Details:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(authState.user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            {!user ? (
              <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition"
              >
                Sign In with Google
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>

        {/* Additional Debug Info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Additional Info:</h3>
          <p className="text-sm text-gray-600">
            Environment: {process.env.NODE_ENV}
          </p>
          <p className="text-sm text-gray-600">
            URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}