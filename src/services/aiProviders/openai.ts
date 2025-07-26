import type { AIProvider, CategorizationResult, EnhanceNodeResult } from '../ai'

export class OpenAIProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async enhanceNode(text: string): Promise<EnhanceNodeResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that enhances and categorizes a single thought or task.
              Analyze the provided text and return a JSON response with:
              - type: The node type (thought, task, question, idea, note)
              - title: A concise title (max 100 chars)
              - description: The full enhanced description
              - tags: Array of relevant tags/categories
              - urgency: 1-10 scale (10 being most urgent)
              - importance: 1-10 scale (10 being most important)
              - dueDate: Object with date property (ISO string) if a deadline is mentioned`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        nodeData: {
          type: result.type || 'thought',
          title: result.title || text.substring(0, 100),
          description: result.description,
          tags: result.tags || [],
          urgency: result.urgency || 5,
          importance: result.importance || 5,
          dueDate: result.dueDate,
        },
      }
    } catch (error) {
      console.error('OpenAI enhanceNode error:', error)
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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that categorizes thoughts and tasks. 
              Analyze the provided text and return a JSON response with:
              - categories: Array of category objects with name, thoughts, confidence, and reasoning
              - relationships: Array of thought relationships
              - suggestions: Array of helpful suggestions
              
              For each thought, provide:
              - text: The original or clarified text
              - category: The category name
              - confidence: 0-1 score
              - keywords: Relevant keywords
              - sentiment: positive, negative, or neutral
              - urgency: 1-10 scale
              - importance: 1-10 scale
              - urgencyLevel: low, medium, or high
              - importanceLevel: low, medium, or high
              - dueDate: ISO date string if applicable
              - reasoning: Your reasoning for the categorization`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        categories: result.categories || [],
        relationships: result.relationships || [],
        suggestions: result.suggestions || [],
      }
    } catch (error) {
      console.error('OpenAI categorization error:', error)
      throw error
    }
  }
}