import type { AIProvider, CategorizationResult, EnhanceNodeResult } from '../ai'
import { auth } from '@/lib/firebase'

export class FirebaseAIProvider implements AIProvider {
  private baseUrl: string

  constructor() {
    // Use environment variable or default to local emulator
    this.baseUrl =
      import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
      'http://localhost:5001/brain-space-5d787/us-central1'
  }

  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null
    return user.getIdToken()
  }

  async enhanceNode(text: string): Promise<EnhanceNodeResult> {
    try {
      const token = await this.getAuthToken()

      const response = await fetch(`${this.baseUrl}/enhanceNode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          text,
          provider: 'gemini',
          model: 'gemini-1.5-flash',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Firebase function error: ${error.message || response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Firebase AI enhanceNode error:', error)
      // Fallback to basic enhancement
      return {
        nodeData: {
          type: 'thought',
          title: text.substring(0, 100),
          description: text,
          tags: ['misc'],
          urgency: 5,
          importance: 5,
        },
      }
    }
  }

  async categorizeThoughts(text: string): Promise<CategorizationResult> {
    try {
      const token = await this.getAuthToken()

      const response = await fetch(`${this.baseUrl}/categorizeThoughts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          text,
          provider: 'gemini',
          model: 'gemini-1.5-flash',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Firebase function error: ${error.message || response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Firebase AI categorizeThoughts error:', error)
      throw error
    }
  }
}
