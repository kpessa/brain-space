'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'

export default function TestPage() {
  const { user, loading, signInWithGoogle, signOut, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [testResult, setTestResult] = useState<string>('')
  const [firebaseStatus, setFirebaseStatus] = useState<any>({})

  useEffect(() => {
    // Check Firebase status
    const status = {
      authInitialized: !!auth,
      firestoreInitialized: !!db,
      currentUser: auth?.currentUser?.email || 'None',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
    }
    setFirebaseStatus(status)
  }, [user])

  const handleSignIn = async () => {
    try {
      const result = await signIn(email, password)
      if (result.error) {
        setTestResult(`Sign in failed: ${result.error.message}`)
      } else {
        setTestResult('Sign in successful!')
      }
    } catch (error: any) {
      setTestResult(`Sign in error: ${error.message}`)
    }
  }

  const handleSignUp = async () => {
    try {
      const result = await signUp(email, password)
      if (result.error) {
        setTestResult(`Sign up failed: ${result.error.message}`)
      } else {
        setTestResult('Sign up successful!')
      }
    } catch (error: any) {
      setTestResult(`Sign up error: ${error.message}`)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      setTestResult('Google sign in successful!')
    } catch (error: any) {
      setTestResult(`Google sign in error: ${error.message}`)
    }
  }

  const testFirestore = async () => {
    if (!user) {
      setTestResult('Please sign in first to test Firestore')
      return
    }

    try {
      // Test write
      const testCollection = collection(db, 'test')
      const docRef = await addDoc(testCollection, {
        message: 'Hello from Firebase test!',
        timestamp: serverTimestamp(),
        userId: user.uid,
      })
      
      // Test read
      const querySnapshot = await getDocs(testCollection)
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      setTestResult(`Firestore test successful! Created doc: ${docRef.id}, Found ${docs.length} docs`)
    } catch (error: any) {
      setTestResult(`Firestore test failed: ${error.message}`)
    }
  }

  const checkUserData = async () => {
    if (!user) {
      setTestResult('Please sign in first')
      return
    }

    try {
      const results: any = {
        userId: user.uid,
        collections: {}
      }

      // Check journal entries
      try {
        const journalQuery = collection(db, 'users', user.uid, 'journal')
        const journalSnap = await getDocs(journalQuery)
        results.collections.journal = {
          count: journalSnap.size,
          docs: journalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 3)
        }
      } catch (e) {
        results.collections.journal = { error: e.message }
      }

      // Check nodes
      try {
        const nodesQuery = collection(db, 'users', user.uid, 'nodes')
        const nodesSnap = await getDocs(nodesQuery)
        results.collections.nodes = {
          count: nodesSnap.size,
          docs: nodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 3)
        }
      } catch (e) {
        results.collections.nodes = { error: e.message }
      }

      // Check brain dumps
      try {
        const braindumpsQuery = collection(db, 'users', user.uid, 'braindumps')
        const braindumpsSnap = await getDocs(braindumpsQuery)
        results.collections.braindumps = {
          count: braindumpsSnap.size,
          docs: braindumpsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 3)
        }
      } catch (e) {
        results.collections.braindumps = { error: e.message }
      }

      setTestResult(JSON.stringify(results, null, 2))
    } catch (error: any) {
      setTestResult(`Error checking user data: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Firebase Test Page</h1>

        {/* Firebase Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Status</h2>
          <div className="space-y-2 font-mono text-sm">
            {Object.entries(firebaseStatus).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Authenticated: {user ? 'Yes' : 'No'}</p>
            <p>User Email: {user?.email || 'None'}</p>
            <p>User ID: {user?.uid || 'None'}</p>
          </div>
        </div>

        {/* Auth Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Actions</h2>
          
          {!user ? (
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleSignIn}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Sign Up
                </button>
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Sign In with Google
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Sign Out
              </button>
              <button
                onClick={testFirestore}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ml-2"
              >
                Test Firestore
              </button>
              <button
                onClick={checkUserData}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ml-2"
              >
                Check My Data
              </button>
            </div>
          )}
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {testResult}
            </pre>
          </div>
        )}

        {/* Quick Navigation */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Link href="/journal" className="p-3 bg-brain-100 text-brain-700 rounded-lg hover:bg-brain-200 text-center">
                Journal
              </Link>
              <Link href="/nodes" className="p-3 bg-space-100 text-space-700 rounded-lg hover:bg-space-200 text-center">
                Nodes
              </Link>
              <Link href="/braindump" className="p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-center">
                Brain Dump
              </Link>
              <Link href="/progress" className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-center">
                Progress
              </Link>
              <Link href="/timebox" className="p-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-center">
                Timebox
              </Link>
              <Link href="/routines" className="p-3 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 text-center">
                Routines
              </Link>
              <Link href="/ai-test" className="p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-center col-span-2">
                Test AI Providers
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}