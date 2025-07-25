export interface AIProvider {
  categorizeThoughts(text: string): Promise<CategorizationResult>
  enhanceNode(text: string): Promise<{ nodeData: any }>
}

export interface CategorizationResult {
  categories: CategoryResult[]
  relationships: ThoughtRelationship[]
  suggestions: string[]
}

interface CategoryResult {
  name: string
  thoughts: ThoughtAnalysis[]
  confidence: number
  reasoning: string
}

interface ThoughtAnalysis {
  text: string
  category: string
  confidence: number
  keywords: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency?: 'low' | 'medium' | 'high'
  importance?: 'low' | 'medium' | 'high'
  dueDate?: string
  reasoning?: string
  nodeType?: string
  metadata?: Record<string, any>
}

interface ThoughtRelationship {
  from: string
  to: string
  type: 'depends_on' | 'relates_to' | 'contradicts' | 'elaborates'
  confidence: number
}

// Mock AI service for now - replace with real API calls
export class MockAIService implements AIProvider {
  async enhanceNode(text: string): Promise<{ nodeData: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Simple mock enhancement
    const nodeData: any = {
      title: text.substring(0, 60),
      type: 'thought',
      description: text.length > 60 ? text : undefined,
      tags: ['unprocessed'],
    }
    
    // Detect type based on keywords
    const lower = text.toLowerCase()
    if (lower.includes('todo') || lower.includes('need to') || lower.includes('task')) {
      nodeData.type = 'task'
      nodeData.urgency = 5
      nodeData.importance = 5
    } else if (lower.includes('idea') || lower.includes('what if')) {
      nodeData.type = 'idea'
    } else if (lower.includes('?')) {
      nodeData.type = 'question'
    } else if (lower.includes('problem') || lower.includes('issue')) {
      nodeData.type = 'problem'
      nodeData.urgency = 7
    }
    
    return { nodeData }
  }

  async categorizeThoughts(text: string): Promise<CategorizationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const lines = text.split('\n').filter(line => line.trim())
    const thoughts: ThoughtAnalysis[] = []
    const categories: Map<string, CategoryResult> = new Map()

    // Enhanced categorization logic
    lines.forEach(line => {
      const analysis = this.analyzeLine(line)
      thoughts.push(analysis)

      // Group by category
      if (!categories.has(analysis.category)) {
        categories.set(analysis.category, {
          name: this.getCategoryName(analysis.category),
          thoughts: [],
          confidence: 0,
          reasoning: this.getCategoryReasoning(analysis.category),
        })
      }
      categories.get(analysis.category)!.thoughts.push(analysis)
    })

    // Calculate average confidence per category
    categories.forEach(cat => {
      cat.confidence = cat.thoughts.reduce((sum, t) => sum + t.confidence, 0) / cat.thoughts.length
    })

    // Find relationships
    const relationships = this.findRelationships(thoughts)

    // Generate suggestions
    const suggestions = this.generateSuggestions(thoughts, Array.from(categories.values()))

    return {
      categories: Array.from(categories.values()),
      relationships,
      suggestions,
    }
  }

  private analyzeLine(line: string): ThoughtAnalysis {
    const lower = line.toLowerCase()
    const words = lower.split(/\s+/)

    // Enhanced pattern matching
    const patterns = {
      tasks: {
        keywords: [
          'todo',
          'task',
          'need to',
          'must',
          'should',
          'have to',
          'will',
          'going to',
          'plan to',
        ],
        verbs: [
          'complete',
          'finish',
          'start',
          'begin',
          'do',
          'make',
          'create',
          'build',
          'write',
          'fix',
        ],
        confidence: 0.9,
      },
      ideas: {
        keywords: ['idea', 'what if', 'maybe', 'perhaps', 'could', 'concept', 'thought'],
        patterns: [/what\s+if/i, /how\s+about/i, /we\s+could/i],
        confidence: 0.85,
      },
      questions: {
        keywords: ['how', 'why', 'what', 'when', 'where', 'who', 'which'],
        patterns: [/\?$/, /^(how|why|what|when|where|who)/i],
        confidence: 0.95,
      },
      problems: {
        keywords: [
          'problem',
          'issue',
          'bug',
          'error',
          'wrong',
          'broken',
          'fail',
          "can't",
          "won't",
          'stuck',
        ],
        sentiment: 'negative',
        confidence: 0.9,
      },
      insights: {
        keywords: [
          'realize',
          'understand',
          'learn',
          'discover',
          'notice',
          'observe',
          'insight',
          'aha',
        ],
        patterns: [/i\s+(realized|learned|discovered|noticed)/i],
        confidence: 0.8,
      },
    }

    let category = 'misc'
    let maxScore = 0
    let confidence = 0.5
    const keywords: string[] = []

    // Score each category
    Object.entries(patterns).forEach(([cat, pattern]) => {
      let score = 0

      // Check keywords
      pattern.keywords?.forEach(keyword => {
        if (lower.includes(keyword)) {
          score += 2
          keywords.push(keyword)
        }
      })

      // Check patterns
      pattern.patterns?.forEach(regex => {
        if (regex.test(line)) {
          score += 3
        }
      })

      // Check verbs for tasks
      if (cat === 'tasks' && pattern.verbs) {
        pattern.verbs.forEach(verb => {
          if (words.includes(verb)) {
            score += 1.5
            keywords.push(verb)
          }
        })
      }

      if (score > maxScore) {
        maxScore = score
        category = cat
        confidence = Math.min(pattern.confidence * (score / 10), 0.95)
      }
    })

    // Sentiment analysis
    const sentiment = this.analyzeSentiment(line)

    return {
      text: line.trim(),
      category: category === 'misc' && keywords.length > 0 ? 'ideas' : category,
      confidence,
      keywords,
      sentiment,
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positive = ['good', 'great', 'excellent', 'happy', 'success', 'achieve', 'complete']
    const negative = ['bad', 'problem', 'issue', 'fail', "can't", "won't", 'difficult', 'hard']

    const lower = text.toLowerCase()
    const posCount = positive.filter(word => lower.includes(word)).length
    const negCount = negative.filter(word => lower.includes(word)).length

    if (posCount > negCount) return 'positive'
    if (negCount > posCount) return 'negative'
    return 'neutral'
  }

  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      tasks: 'Action Items',
      ideas: 'Ideas & Concepts',
      questions: 'Questions to Explore',
      problems: 'Challenges & Issues',
      insights: 'Insights & Learnings',
      misc: 'General Thoughts',
    }
    return names[category] || 'Miscellaneous'
  }

  private getCategoryReasoning(category: string): string {
    const reasoning: Record<string, string> = {
      tasks: 'Contains action-oriented language and todo items',
      ideas: 'Explores possibilities and creative concepts',
      questions: 'Seeks information or clarification',
      problems: 'Identifies challenges that need solutions',
      insights: 'Captures learnings and realizations',
      misc: 'General observations and thoughts',
    }
    return reasoning[category] || 'Uncategorized thoughts'
  }

  private findRelationships(thoughts: ThoughtAnalysis[]): ThoughtRelationship[] {
    const relationships: ThoughtRelationship[] = []

    for (let i = 0; i < thoughts.length; i++) {
      for (let j = i + 1; j < thoughts.length; j++) {
        const relation = this.analyzeRelationship(thoughts[i], thoughts[j])
        if (relation) {
          relationships.push({
            from: thoughts[i].text,
            to: thoughts[j].text,
            type: relation.type,
            confidence: relation.confidence,
          })
        }
      }
    }

    return relationships
  }

  private analyzeRelationship(
    thought1: ThoughtAnalysis,
    thought2: ThoughtAnalysis
  ): { type: ThoughtRelationship['type']; confidence: number } | null {
    // Check for shared keywords
    const shared = thought1.keywords.filter(k => thought2.keywords.includes(k))
    if (shared.length > 0) {
      return { type: 'relates_to', confidence: 0.7 }
    }

    // Check for question-answer pattern
    if (thought1.category === 'questions' && thought2.category === 'insights') {
      return { type: 'elaborates', confidence: 0.6 }
    }

    // Check for problem-task pattern
    if (thought1.category === 'problems' && thought2.category === 'tasks') {
      return { type: 'depends_on', confidence: 0.8 }
    }

    return null
  }

  private generateSuggestions(thoughts: ThoughtAnalysis[], categories: CategoryResult[]): string[] {
    const suggestions: string[] = []

    // Check for too many uncategorized thoughts
    const miscCount = thoughts.filter(t => t.category === 'misc').length
    if (miscCount > thoughts.length * 0.3) {
      suggestions.push('Consider adding more context to your thoughts for better categorization')
    }

    // Check for questions without follow-up
    const questions = thoughts.filter(t => t.category === 'questions')
    if (questions.length > 0 && thoughts.filter(t => t.category === 'insights').length === 0) {
      suggestions.push('You have open questions - consider exploring answers or next steps')
    }

    // Check for problems without solutions
    const problems = thoughts.filter(t => t.category === 'problems')
    const tasks = thoughts.filter(t => t.category === 'tasks')
    if (problems.length > tasks.length) {
      suggestions.push(
        'You have more problems than action items - consider creating tasks to address them'
      )
    }

    return suggestions
  }
}

// Firebase Functions implementation
class FirebaseFunctionService implements AIProvider {
  private provider: 'openai' | 'anthropic' | 'gemini'

  constructor(provider: 'openai' | 'anthropic' | 'gemini') {
    this.provider = provider
  }

  async enhanceNode(text: string): Promise<{ nodeData: any }> {
    try {
      // Get the current user's ID token
      const { auth } = await import('@/lib/firebase')
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      const idToken = await user.getIdToken()

      // Determine the function URL based on environment
      const isDevelopment = import.meta.env.DEV
      const functionUrl = isDevelopment
        ? 'http://localhost:5001/brain-space-5d787/us-central1/enhanceNode'
        : `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/enhanceNode`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          text,
          provider: this.provider,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Function response error:', errorText)
        try {
          const error = JSON.parse(errorText)
          throw new Error(error.error || error.message || `API error: ${response.statusText}`)
        } catch (e) {
          throw new Error(`API error: ${response.statusText} - ${errorText}`)
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Firebase Function error:', error)
      throw error
    }
  }

  async categorizeThoughts(text: string): Promise<CategorizationResult> {
    try {
      // Get the current user's ID token
      const { auth } = await import('@/lib/firebase')
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      const idToken = await user.getIdToken()

      // Determine the function URL based on environment
      const isDevelopment = import.meta.env.DEV
      const functionUrl = isDevelopment
        ? 'http://localhost:5001/brain-space-5d787/us-central1/categorizeThoughts'
        : `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/categorizeThoughts`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          text,
          provider: this.provider,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Function response error:', errorText)
        try {
          const error = JSON.parse(errorText)
          throw new Error(error.error || error.message || `API error: ${response.statusText}`)
        } catch (e) {
          throw new Error(`API error: ${response.statusText} - ${errorText}`)
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Firebase Function error:', error)
      // Fallback to mock service
      return new MockAIService().categorizeThoughts(text)
    }
  }
}

// Factory to create AI service based on provider
export function createAIService(provider?: string): AIProvider {
  const aiProvider = provider || import.meta.env.VITE_AI_PROVIDER

  // If using Firebase auth, always use Firebase Functions
  if (import.meta.env.VITE_USE_FIREBASE_AUTH === 'true') {
    switch (aiProvider) {
      case 'openai':
        return new FirebaseFunctionService('openai')
      case 'anthropic':
        return new FirebaseFunctionService('anthropic')
      case 'gemini':
        return new FirebaseFunctionService('gemini')
      default:
        return new MockAIService()
    }
  }

  // Otherwise fallback to mock service
  return new MockAIService()
}
