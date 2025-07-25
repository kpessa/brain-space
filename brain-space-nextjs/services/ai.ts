// Client-side AI service that calls Next.js API routes

export interface EnhanceNodeResult {
  nodeData: {
    type: string
    title: string
    description?: string
    tags?: string[]
    urgency?: number
    importance?: number
    dueDate?: { date: string }
  }
}

export interface CategorizationResult {
  categories: Array<{
    name: string
    thoughts: Array<{
      text: string
      nodeData: any
    }>
    confidence: number
    reasoning: string
  }>
  suggestions?: string[]
}

class AIService {
  private provider: string

  constructor(provider: string = 'mock') {
    this.provider = provider
  }

  async enhanceNode(text: string): Promise<EnhanceNodeResult> {
    // Ensure 'google' is sent as provider for Gemini
    const provider = this.provider === 'gemini' ? 'google' : this.provider
    
    const response = await fetch('/api/ai/enhance-node', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if available
        ...(this.getAuthHeaders()),
      },
      body: JSON.stringify({ text, provider }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to enhance node')
    }

    return response.json()
  }

  async categorizeThoughts(text: string): Promise<CategorizationResult> {
    // Ensure 'google' is sent as provider for Gemini
    const provider = this.provider === 'gemini' ? 'google' : this.provider
    
    const response = await fetch('/api/ai/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.getAuthHeaders()),
      },
      body: JSON.stringify({ text, provider }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to categorize thoughts')
    }

    return response.json()
  }

  private getAuthHeaders(): HeadersInit {
    // In a real app, get the Firebase auth token
    // For now, return empty headers
    return {}
  }
}

// Factory function to create AI service
export function createAIService(provider?: string): AIService {
  // Check localStorage for debug mode
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('ai_debug') === 'true'
  
  // Check localStorage for selected provider
  const storedProvider = typeof window !== 'undefined' ? localStorage.getItem('ai_provider') : null
  
  // Use provider preference: explicit > localStorage > env > mock
  const configuredProvider = provider || storedProvider || process.env.NEXT_PUBLIC_AI_PROVIDER || 'mock'
  
  if (debugMode) {
    console.log('🔧 AI Service Factory')
    console.log('Provider:', configuredProvider)
    console.log('Available:', { 
      explicit: provider, 
      stored: storedProvider, 
      env: process.env.NEXT_PUBLIC_AI_PROVIDER 
    })
  }

  return new AIService(configuredProvider)
}

// Export a default instance
export default createAIService()