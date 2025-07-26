import type { AIProvider, CategorizationResult, EnhanceNodeResult } from '../ai'

export class AnthropicProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async enhanceNode(text: string): Promise<EnhanceNodeResult> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Analyze this single thought or task and enhance it. Return ONLY a valid JSON object with:
              - type: The node type (thought, task, question, idea, note)
              - title: A concise title (max 100 chars)
              - description: The full enhanced description
              - tags: Array of relevant tags/categories
              - urgency: 1-10 scale (10 being most urgent)
              - importance: 1-10 scale (10 being most important)
              - dueDate: Object with date property (ISO string) if a deadline is mentioned

              Text to analyze: ${text}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Anthropic API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const content = data.content[0].text
      
      // Parse the JSON response
      let result
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        // If parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Failed to parse JSON response from Anthropic')
        }
      }

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
      console.error('Anthropic enhanceNode error:', error)
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `Analyze the following text and categorize the thoughts/tasks. Return a valid JSON object with:
              - categories: Array of category objects, each with:
                - name: Category name
                - thoughts: Array of thought objects
                - confidence: 0-1 score
                - reasoning: Explanation for the category
              - relationships: Array of relationship objects with from, to, type, and confidence
              - suggestions: Array of helpful suggestions

              For each thought object, include:
              - text: The original or clarified text
              - category: The category name
              - confidence: 0-1 score
              - keywords: Array of relevant keywords
              - sentiment: "positive", "negative", or "neutral"
              - urgency: 1-10 scale
              - importance: 1-10 scale
              - urgencyLevel: "low", "medium", or "high"
              - importanceLevel: "low", "medium", or "high"
              - dueDate: ISO date string if applicable
              - reasoning: Your reasoning for the categorization

              Text to analyze:
              ${text}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Anthropic API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const content = data.content[0].text
      
      // Parse the JSON response
      let result
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        // If parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Failed to parse JSON response from Anthropic')
        }
      }

      return {
        categories: result.categories || [],
        relationships: result.relationships || [],
        suggestions: result.suggestions || [],
      }
    } catch (error) {
      console.error('Anthropic categorization error:', error)
      throw error
    }
  }
}