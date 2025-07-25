'use client'

import { useState } from 'react'

export default function TestAI() {
  const [text, setText] = useState('Finish the quarterly report by Friday afternoon')
  const [provider, setProvider] = useState('mock')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testEnhanceNode = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/enhance-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, provider }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API error')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testCategorize = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const brainDump = `
Need to call the dentist tomorrow
Buy milk and eggs
The new project dashboard looks confusing
Maybe we should add a dark mode toggle
I'm worried about the deployment deadline
Research React Query for better data fetching
Schedule team standup for next week
Why is the build process so slow?
`

    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: brainDump, provider }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API error')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test AI API Routes</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="mock">Mock (No API Key Required)</option>
          <option value="openai">OpenAI</option>
          <option value="google">Google AI (Gemini)</option>
          <option value="anthropic">Anthropic (Claude)</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Note: Real providers require API keys in .env.local
        </p>
      </div>

      <div className="space-y-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Enhance Node</h2>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            rows={3}
            placeholder="Enter text to enhance..."
          />

          <button
            onClick={testEnhanceNode}
            disabled={loading}
            className="px-4 py-2 bg-brain-600 text-white rounded-md hover:bg-brain-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Test Enhance Node'}
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Categorize Thoughts</h2>
          
          <p className="text-gray-600 mb-4">
            This will test categorization with a pre-defined brain dump
          </p>

          <button
            onClick={testCategorize}
            disabled={loading}
            className="px-4 py-2 bg-space-600 text-white rounded-md hover:bg-space-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Test Categorize'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-semibold text-red-800">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800 mb-2">Result</h3>
          <pre className="text-sm overflow-auto bg-white p-4 rounded border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}