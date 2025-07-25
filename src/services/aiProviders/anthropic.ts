import type { AIProvider, CategorizationResult, ThoughtAnalysis } from '../ai'

interface AnthropicResponse {
  categories: Array<{
    id: string
    name: string
    confidence: number
    reasoning: string
  }>
  thoughts: Array<{
    text: string
    category: string
    urgency: number
    importance: number
    dueDate?: string
    reasoning?: string
  }>
  relationships?: Array<{
    from: string
    to: string
    type: string
  }>
}

export class AnthropicProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async categorizeThoughts(text: string): Promise<CategorizationResult> {
    const prompt = this.buildPrompt(text)
    const debugMode = localStorage.getItem('ai_debug') === 'true'
    
    if (debugMode) {
      console.group('🤖 Anthropic API Call')
      console.log('Input text:', text)
      console.log('Generated prompt:', prompt)
      console.time('Anthropic API call duration')
    }
    
    try {
      const requestBody = {
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      }
      
      if (debugMode) {
        console.log('Request body:', requestBody)
      }
      
      // Use proxy to avoid CORS
      const apiUrl = import.meta.env.DEV 
        ? '/api/anthropic/v1/messages'  // Vite proxy in development
        : '/api/anthropic'               // Vercel function in production
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.text()
        if (debugMode) {
          console.error('API Error Response:', errorData)
        }
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorData}`)
      }

      const data = await response.json()
      
      if (debugMode) {
        console.log('Raw API response:', data)
        console.log('Token usage:', {
          input_tokens: data.usage?.input_tokens,
          output_tokens: data.usage?.output_tokens
        })
      }
      
      // Extract JSON from Claude's response
      const content = data.content[0].text
      if (debugMode) {
        console.log('Raw content from Claude:', content)
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        if (debugMode) {
          console.error('Failed to find JSON in response:', content)
        }
        throw new Error('Failed to extract JSON from response')
      }
      
      const result: AnthropicResponse = JSON.parse(jsonMatch[0])
      
      if (debugMode) {
        console.log('Parsed result:', result)
        console.timeEnd('Anthropic API call duration')
      }

      const transformed = this.transformResponse(result)
      
      if (debugMode) {
        console.log('Transformed result:', transformed)
        console.groupEnd()
      }
      
      return transformed
    } catch (error) {
      if (debugMode) {
        console.error('Anthropic categorization failed:', error)
        console.groupEnd()
      }
      throw error
    }
  }

  private buildPrompt(text: string): string {
    const today = new Date().toISOString().split('T')[0]
    
    return `Analyze this brain dump and extract structured information. Return only valid JSON with no additional text.

Today's date: ${today}

Instructions:
1. Extract independent, actionable ideas from the text
2. Remove ALL filler words (I need to, basically, kind of, really, just, etc.)
3. Split compound ideas into separate thoughts
4. Identify 3-5 main theme categories based on the actual content
5. For each thought, determine:
   - Urgency (1-10): How time-sensitive? Consider deadlines, consequences of delay
   - Importance (1-10): How significant to goals, values, or long-term impact?
   - Due date: Extract any mentioned dates, times, or deadlines
   - Category: Assign to the most appropriate theme

Urgency Guidelines:
- 9-10: Today/tomorrow, critical deadline
- 7-8: This week, significant time pressure
- 5-6: This month, moderate time sensitivity
- 3-4: This quarter, some flexibility
- 1-2: Someday/maybe, no specific timeline

Importance Guidelines:
- 9-10: Critical to major goals, high impact
- 7-8: Significant value, aligns with priorities
- 5-6: Moderate value, worth doing
- 3-4: Nice to have, minor impact
- 1-2: Low priority, minimal impact

Date Extraction (relative to today ${today}):
- "tomorrow" → next calendar day
- "next week" → 7 days from today
- "next month" → 30 days from today
- "end of month" → last day of current month
- "by Friday" → next occurrence of Friday
- Specific dates → parse to YYYY-MM-DD format

Brain dump text:
"${text}"

Return JSON in this exact format:
{
  "categories": [
    {
      "id": "work",
      "name": "Work",
      "confidence": 0.9,
      "reasoning": "Contains work-related tasks and meetings"
    }
  ],
  "thoughts": [
    {
      "text": "Prepare client presentation",
      "category": "work",
      "urgency": 8,
      "importance": 7,
      "dueDate": "2024-01-15",
      "reasoning": "Meeting tomorrow (high urgency), key client (high importance)"
    }
  ],
  "relationships": [
    {
      "from": "Prepare client presentation",
      "to": "Review sales figures",
      "type": "depends_on"
    }
  ]
}`
  }

  private transformResponse(response: AnthropicResponse): CategorizationResult {
    const thoughts: ThoughtAnalysis[] = response.thoughts.map((thought, index) => ({
      id: `thought-ai-${Date.now()}-${index}`,
      text: thought.text,
      category: thought.category,
      confidence: 0.9,
      keywords: [],
      sentiment: 'neutral' as const,
      urgency: thought.urgency,
      importance: thought.importance,
      dueDate: thought.dueDate,
      reasoning: thought.reasoning
    }))

    const categoriesWithThoughts = response.categories.map(cat => ({
      name: cat.name,
      thoughts: thoughts.filter(t => t.category === cat.id),
      confidence: cat.confidence,
      reasoning: cat.reasoning
    }))

    const relationships = (response.relationships || []).map(rel => ({
      from: rel.from,
      to: rel.to,
      type: rel.type as 'depends_on' | 'relates_to' | 'contradicts' | 'elaborates',
      confidence: 0.8
    }))

    const suggestions = this.generateSuggestions(thoughts, categoriesWithThoughts)

    return {
      categories: categoriesWithThoughts,
      relationships,
      suggestions
    }
  }

  private generateSuggestions(thoughts: ThoughtAnalysis[], categories: any[]): string[] {
    const suggestions: string[] = []

    // Check for urgent items without clear deadlines
    const urgentWithoutDates = thoughts.filter(t => (t.urgency || 0) >= 7 && !t.dueDate)
    if (urgentWithoutDates.length > 0) {
      suggestions.push('Some urgent items lack specific deadlines - consider setting clear due dates')
    }

    // Check for low importance but high urgency items
    const urgentButNotImportant = thoughts.filter(t => 
      (t.urgency || 0) >= 7 && (t.importance || 0) <= 4
    )
    if (urgentButNotImportant.length > 0) {
      suggestions.push('Some tasks are urgent but not important - consider delegating or eliminating')
    }

    // Check for important but not urgent items
    const importantNotUrgent = thoughts.filter(t =>
      (t.importance || 0) >= 7 && (t.urgency || 0) <= 4
    )
    if (importantNotUrgent.length > 0) {
      suggestions.push('Important long-term items detected - schedule time to work on these before they become urgent')
    }

    // Check for overdue items
    const today = new Date()
    const overdue = thoughts.filter(t => {
      if (!t.dueDate) return false
      const dueDate = new Date(t.dueDate)
      return dueDate < today
    })
    if (overdue.length > 0) {
      suggestions.push('You have overdue items - prioritize these immediately')
    }

    return suggestions
  }
}