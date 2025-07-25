import { useState } from 'react'
import { Button } from '../components/Button'
import { useAuthWrapper } from '../hooks/useAuthWrapper'
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext'
import { createAIService } from '../services/ai'
import { auth } from '../lib/firebase'

export default function TestPage() {
  const { user: wrapperUser } = useAuthWrapper()
  const { user: firebaseUser } = useFirebaseAuth()
  const user = firebaseUser || auth.currentUser
  const [testText, setTestText] = useState(
    'I need to buy groceries, think about the new project idea, and fix the bug in the authentication system.'
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testAIConnection = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const aiService = createAIService()
      const categorization = await aiService.categorizeThoughts(testText)
      setResult(categorization)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testDirectFunctionCall = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const idToken = await user.getIdToken()
      const response = await fetch(
        'http://localhost:5001/brain-space-5d787/us-central1/categorizeThoughts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            text: testText,
            provider: 'gemini',
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testHealthCheck = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(
        'http://localhost:5001/brain-space-5d787/us-central1/healthCheck'
      )
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AI Connection Test Page</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Test Text</label>
          <textarea
            value={testText}
            onChange={e => setTestText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brain-500 focus:border-transparent"
            rows={4}
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={testHealthCheck} disabled={loading} variant="outline">
            Test Health Check
          </Button>

          <Button onClick={testDirectFunctionCall} disabled={loading || !user} variant="outline">
            Test Direct Function Call
          </Button>

          <Button onClick={testAIConnection} disabled={loading || !user} variant="primary">
            Test AI Service
          </Button>
        </div>

        {loading && <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">Loading...</div>}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Result:</h2>
            <pre className="p-4 bg-gray-100 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>User (wrapper):</strong> {wrapperUser?.email || 'Not authenticated'}
          </p>
          <p>
            <strong>User (firebase):</strong> {firebaseUser?.email || 'Not authenticated'}
          </p>
          <p>
            <strong>User ID:</strong> {user?.uid || wrapperUser?.id || 'N/A'}
          </p>
          <p>
            <strong>Auth Provider:</strong> {firebaseUser ? 'Firebase' : 'Supabase'}
          </p>
        </div>
      </div>
    </div>
  )
}
