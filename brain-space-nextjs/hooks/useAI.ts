'use client'

import { useState, useCallback } from 'react'
import { createAIService, EnhanceNodeResult, CategorizationResult } from '@/services/ai'

interface UseAIReturn {
  enhanceNode: (text: string) => Promise<EnhanceNodeResult>
  categorizeThoughts: (text: string) => Promise<CategorizationResult>
  loading: boolean
  error: string | null
}

export function useAI(provider?: string): UseAIReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aiService = createAIService(provider)

  const enhanceNode = useCallback(async (text: string): Promise<EnhanceNodeResult> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await aiService.enhanceNode(text)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enhance node'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [aiService])

  const categorizeThoughts = useCallback(async (text: string): Promise<CategorizationResult> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await aiService.categorizeThoughts(text)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to categorize thoughts'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [aiService])

  return {
    enhanceNode,
    categorizeThoughts,
    loading,
    error,
  }
}