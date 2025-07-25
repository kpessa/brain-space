'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Sparkles, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ProviderStatus {
  id: string
  name: string
  available: boolean
  tested: boolean
  result?: string
  error?: string
}

export default function TestAIPage() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [testText] = useState("Build a mobile app for tracking daily water intake")

  const checkProviders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/providers')
      const data = await response.json()
      
      const providerList: ProviderStatus[] = [
        {
          id: 'openai',
          name: 'OpenAI GPT-4',
          available: data.providers.includes('openai'),
          tested: false
        },
        {
          id: 'google',
          name: 'Google Gemini',
          available: data.providers.includes('google'),
          tested: false
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          available: data.providers.includes('anthropic'),
          tested: false
        },
        {
          id: 'mock',
          name: 'Mock Provider (Free)',
          available: true,
          tested: false
        }
      ]
      
      setProviders(providerList)
    } catch (error) {
      console.error('Failed to check providers:', error)
    }
    setLoading(false)
  }

  const testProvider = async (providerId: string) => {
    const providerIndex = providers.findIndex(p => p.id === providerId)
    if (providerIndex === -1) return

    // Update status to testing
    const updatedProviders = [...providers]
    updatedProviders[providerIndex] = {
      ...updatedProviders[providerIndex],
      tested: false,
      result: undefined,
      error: undefined
    }
    setProviders(updatedProviders)

    try {
      const response = await fetch('/api/ai/enhance-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: testText,
          provider: providerId 
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        updatedProviders[providerIndex] = {
          ...updatedProviders[providerIndex],
          tested: true,
          result: JSON.stringify(data.nodeData, null, 2)
        }
      } else {
        updatedProviders[providerIndex] = {
          ...updatedProviders[providerIndex],
          tested: true,
          error: data.error || 'Failed to enhance node'
        }
      }
    } catch (error) {
      updatedProviders[providerIndex] = {
        ...updatedProviders[providerIndex],
        tested: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    setProviders(updatedProviders)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please sign in to test AI providers</p>
            <Link href="/login" className="text-blue-600 hover:underline mt-2 inline-block">
              Go to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/nodes" className="text-blue-600 hover:underline">
            ← Back to Nodes
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          AI Provider Setup & Testing
        </h1>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Add API Keys</h3>
              <p className="text-gray-600 mb-2">Add your API keys to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>:</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`OPENAI_API_KEY=sk-your-key-here
GOOGLE_AI_API_KEY=your-google-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. Restart Dev Server</h3>
              <p className="text-gray-600">After adding keys, restart your dev server (Ctrl+C then pnpm dev)</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Test Providers</h3>
              <p className="text-gray-600">Click "Check Providers" below, then test each available provider</p>
            </div>
          </CardContent>
        </Card>

        {/* Provider Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Provider Status</CardTitle>
            <Button onClick={checkProviders} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Providers'
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {providers.length === 0 ? (
              <p className="text-gray-600">Click "Check Providers" to see available AI providers</p>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Test text: "{testText}"</p>
                </div>
                
                {providers.map((provider) => (
                  <div key={provider.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        {provider.available ? (
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Available
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Not Configured
                          </span>
                        )}
                      </div>
                      
                      {provider.available && (
                        <Button
                          size="sm"
                          onClick={() => testProvider(provider.id)}
                          disabled={!provider.available}
                        >
                          Test Provider
                        </Button>
                      )}
                    </div>
                    
                    {provider.tested && (
                      <div className="mt-3">
                        {provider.error ? (
                          <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                            <strong>Error:</strong> {provider.error}
                          </div>
                        ) : (
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-green-700 text-sm mb-2">✓ Successfully enhanced node!</p>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                View Response
                              </summary>
                              <pre className="mt-2 bg-white p-2 rounded overflow-x-auto">
                                {provider.result}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Links */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Get API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" 
               className="block text-blue-600 hover:underline">
              → OpenAI API Keys
            </a>
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
               className="block text-blue-600 hover:underline">
              → Google AI Studio (Gemini)
            </a>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
               className="block text-blue-600 hover:underline">
              → Anthropic Console
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}