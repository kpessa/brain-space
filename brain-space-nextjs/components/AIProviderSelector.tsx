'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Brain, Zap } from 'lucide-react'

interface AIProvider {
  id: string
  name: string
  icon: React.ElementType
  available: boolean
}

export function AIProviderSelector() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [currentProvider, setCurrentProvider] = useState<string>('mock')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkProviders()
  }, [])

  const checkProviders = async () => {
    try {
      const response = await fetch('/api/ai/providers')
      const data = await response.json()
      
      const providerList: AIProvider[] = [
        {
          id: 'openai',
          name: 'OpenAI GPT-4',
          icon: Brain,
          available: data.providers.includes('openai')
        },
        {
          id: 'google',
          name: 'Google Gemini',
          icon: Sparkles,
          available: data.providers.includes('google')
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          icon: Zap,
          available: data.providers.includes('anthropic')
        },
        {
          id: 'mock',
          name: 'Mock (Free)',
          icon: Brain,
          available: true
        }
      ]
      
      setProviders(providerList)
      setCurrentProvider(data.current || 'mock')
      setLoading(false)
    } catch (error) {
      console.error('Failed to check AI providers:', error)
      setLoading(false)
    }
  }

  const selectProvider = (providerId: string) => {
    setCurrentProvider(providerId)
    // Store in localStorage for persistence
    localStorage.setItem('ai_provider', providerId)
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Checking AI providers...</div>
  }

  const availableProviders = providers.filter(p => p.available)

  if (availableProviders.length <= 1) {
    return null // Don't show selector if only mock is available
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">AI Provider:</span>
      <div className="flex gap-1">
        {availableProviders.map((provider) => {
          const Icon = provider.icon
          return (
            <button
              key={provider.id}
              onClick={() => selectProvider(provider.id)}
              className={`
                flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${currentProvider === provider.id
                  ? 'bg-brain-100 text-brain-700 border-2 border-brain-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }
              `}
              title={provider.name}
            >
              <Icon className="w-3 h-3" />
              {provider.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}