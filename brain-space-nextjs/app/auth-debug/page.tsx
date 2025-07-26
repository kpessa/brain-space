'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function AuthDebugPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Monitor Firebase auth state directly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      
      if (user) {
        try {
          const idToken = await user.getIdToken()
          const idTokenResult = await user.getIdTokenResult()
          
          setFirebaseUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            isAnonymous: user.isAnonymous,
            metadata: {
              creationTime: user.metadata.creationTime,
              lastSignInTime: user.metadata.lastSignInTime,
            },
            tokenInfo: {
              token: idToken.substring(0, 20) + '...',
              claims: idTokenResult.claims,
              expirationTime: idTokenResult.expirationTime,
              issuedAtTime: idTokenResult.issuedAtTime,
              authTime: idTokenResult.authTime,
            },
          })
        } catch (error) {
          console.error('Error getting token info:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch debug data from API
  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/debug')
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch debug data')
    } finally {
      setLoading(false)
    }
  }

  const testCookieSet = async () => {
    if (!firebaseUser) {
      alert('No Firebase user found')
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        alert('No current user')
        return
      }

      const idToken = await user.getIdToken(true)
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      })

      const result = await response.json()
      
      if (response.ok) {
        alert('Cookie set successfully! Refresh the page to see updated debug data.')
        setTimeout(() => fetchDebugData(), 1000)
      } else {
        alert(`Failed to set cookie: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Information</h1>


        {/* Firebase User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Auth State</h2>
          {firebaseUser ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(firebaseUser, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No Firebase user found</p>
          )}
        </div>

        {/* API Debug Data */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Server-Side Debug Data</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <button
              onClick={fetchDebugData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Debug Data
            </button>
            
            <button
              onClick={testCookieSet}
              disabled={!firebaseUser}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 ml-4"
            >
              Test Cookie Set
            </button>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This page should be accessible without authentication to help debug auth issues.
                Make sure to add '/auth-debug' to the public paths in middleware.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}