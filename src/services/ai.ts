export interface AIProvider {
  categorizeThoughts(text: string): Promise<CategorizationResult>
  enhanceNode(text: string): Promise<EnhanceNodeResult>
}

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

export interface ThoughtAnalysis {
  id?: string
  text: string
  category: string
  confidence: number
  keywords: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency?: number // 1-10 scale for detailed priority
  importance?: number // 1-10 scale for detailed priority
  urgencyLevel?: 'low' | 'medium' | 'high' // For simpler categorization
  importanceLevel?: 'low' | 'medium' | 'high' // For simpler categorization
  dueDate?: string // ISO date string
  reasoning?: string // AI's reasoning
  nodeType?: string // For firebase integration
  metadata?: Record<string, any> // For firebase integration
}

interface ThoughtRelationship {
  from: string
  to: string
  type: 'depends_on' | 'relates_to' | 'contradicts' | 'elaborates'
  confidence: number
}

// Mock AI service for now - replace with real API calls
export class MockAIService implements AIProvider {
  async enhanceNode(text: string): Promise<EnhanceNodeResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Basic text analysis
    const isQuestion = text.includes('?')
    const isUrgent = /urgent|asap|immediately|now/i.test(text)
    const hasDueDate = /by |before |until |due |deadline/i.test(text)
    
    return {
      nodeData: {
        type: isQuestion ? 'question' : 'thought',
        title: text.substring(0, 100),
        description: text,
        tags: this.extractTags(text),
        urgency: isUrgent ? 8 : 5,
        importance: 5,
        dueDate: hasDueDate ? { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } : undefined
      }
    }
  }
  
  private extractTags(text: string): string[] {
    const tags: string[] = []
    
    // Extract hashtags
    const hashtagMatches = text.match(/#\w+/g)
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.substring(1)))
    }
    
    // Add category based on keywords
    if (/work|project|task|meeting/i.test(text)) tags.push('work')
    if (/personal|home|family/i.test(text)) tags.push('personal')
    if (/idea|thought|consider/i.test(text)) tags.push('ideas')
    
    return tags.length > 0 ? tags : ['misc']
  }
  
  async categorizeThoughts(text: string): Promise<CategorizationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const lines = text.split('\n').filter(line => line.trim())
    
    // Step 1: Break down verbose thoughts into concise nodes
    const conciseThoughts = this.breakDownThoughts(lines)
    
    // Step 2: Identify main themes/categories from content
    const mainCategories = this.identifyMainCategories(conciseThoughts)
    
    // Step 3: Assign thoughts to categories and create hierarchy
    const categorizedThoughts = this.assignToCategories(conciseThoughts, mainCategories)
    
    // Step 4: Build category results with hierarchical structure
    const categories: CategoryResult[] = mainCategories.map(category => ({
      name: category.name,
      thoughts: categorizedThoughts.filter(t => t.category === category.id),
      confidence: category.confidence,
      reasoning: category.reasoning,
    }))

    // Find relationships
    const relationships = this.findRelationships(categorizedThoughts)

    // Generate suggestions
    const suggestions = this.generateSuggestions(categorizedThoughts, categories)

    return {
      categories,
      relationships,
      suggestions,
    }
  }

  private breakDownThoughts(lines: string[]): ThoughtAnalysis[] {
    const thoughts: ThoughtAnalysis[] = []
    const processedIdeas = new Set<string>() // Track unique ideas
    
    lines.forEach((line, index) => {
      // Extract independent ideas from the line
      const ideas = this.extractIndependentIdeas(line)
      
      ideas.forEach((idea, ideaIndex) => {
        // Skip if we've already processed a very similar idea
        const normalizedIdea = idea.toLowerCase().trim()
        if (processedIdeas.has(normalizedIdea)) return
        processedIdeas.add(normalizedIdea)
        
        thoughts.push(this.analyzeLine(idea, `thought-${Date.now()}-${index}-${ideaIndex}`))
      })
    })
    
    return thoughts
  }

  private extractIndependentIdeas(text: string): string[] {
    const ideas: string[] = []
    
    // Common separators that indicate multiple ideas
    const separators = [
      '; ', ', and ', ', also ', ', plus ', ', then ',
      ' and also ', ' as well as ', ' in addition to ',
      '. ', '! ', '? '
    ]
    
    // Split by separators
    let segments = [text]
    for (const sep of separators) {
      const newSegments: string[] = []
      segments.forEach(segment => {
        if (segment.includes(sep)) {
          const parts = segment.split(sep)
          newSegments.push(...parts.filter(p => p.trim().length > 3))
        } else {
          newSegments.push(segment)
        }
      })
      segments = newSegments
    }
    
    // Process each segment to extract core idea
    segments.forEach(segment => {
      const coreIdea = this.extractCoreIdea(segment)
      if (coreIdea && coreIdea.length > 5) {
        ideas.push(coreIdea)
      }
    })
    
    return ideas
  }

  private extractCoreIdea(text: string): string {
    let cleaned = text.trim()
    
    // Remove common filler phrases at the beginning
    const fillerStarts = [
      'i need to ', 'i have to ', 'i should ', 'i must ', 'i want to ',
      'we need to ', 'we have to ', 'we should ', 'we must ',
      'need to ', 'have to ', 'should ', 'must ', 'want to ',
      'going to ', 'gonna ', 'gotta ',
      'there is ', 'there are ', 'there\'s ',
      'i think ', 'i feel ', 'i believe ',
      'maybe ', 'perhaps ', 'probably ',
      'also ', 'and ', 'then ', 'so ',
      'like ', 'um ', 'uh ', 'well ',
      'basically ', 'actually ', 'really ',
      'kind of ', 'sort of ', 'a bit '
    ]
    
    // Remove filler from start
    let changed = true
    while (changed) {
      changed = false
      for (const filler of fillerStarts) {
        if (cleaned.toLowerCase().startsWith(filler)) {
          cleaned = cleaned.substring(filler.length).trim()
          changed = true
          break
        }
      }
    }
    
    // Remove common filler words/phrases from anywhere
    const fillerPhrases = [
      ' that i need to ', ' that we need to ',
      ' i think ', ' i guess ', ' i suppose ',
      ' kind of ', ' sort of ', ' a bit ',
      ' like ', ' you know ', ' I mean ',
      ' basically ', ' actually ', ' really ',
      ' or something ', ' and stuff ', ' and things ',
      ' and whatnot ', ' and so on ', ' etc'
    ]
    
    for (const filler of fillerPhrases) {
      cleaned = cleaned.replace(new RegExp(filler, 'gi'), ' ')
    }
    
    // Remove redundant words
    const redundantWords = [
      'very ', 'quite ', 'rather ', 'pretty ',
      'just ', 'only ', 'simply ',
      'definitely ', 'certainly ', 'surely ',
      'totally ', 'completely ', 'absolutely ',
      'literally ', 'honestly ', 'frankly '
    ]
    
    for (const word of redundantWords) {
      cleaned = cleaned.replace(new RegExp('\\b' + word + '\\b', 'gi'), ' ')
    }
    
    // Clean up extra spaces and punctuation
    cleaned = cleaned
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,!?])/g, '$1')
      .trim()
    
    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    }
    
    // If the result is too short or just punctuation, return empty
    if (cleaned.length < 3 || /^[.,!?]+$/.test(cleaned)) {
      return ''
    }
    
    return cleaned
  }

  private identifyMainCategories(thoughts: ThoughtAnalysis[]): Array<{id: string, name: string, confidence: number, reasoning: string}> {
    // Analyze content to identify main themes
    const keywordAnalysis = this.analyzeContentThemes(thoughts)
    const categories: Array<{id: string, name: string, confidence: number, reasoning: string}> = []
    
    // Look for work-related content
    const workKeywords = ['work', 'job', 'meeting', 'project', 'team', 'office', 'boss', 'client', 'deadline', 'task']
    const workCount = this.countKeywordMatches(thoughts, workKeywords)
    if (workCount > 0) {
      categories.push({
        id: 'work',
        name: 'Work',
        confidence: Math.min(0.9, workCount * 0.2),
        reasoning: 'Contains work-related activities and responsibilities'
      })
    }
    
    // Look for travel/trips
    const travelKeywords = ['trip', 'travel', 'vacation', 'flight', 'hotel', 'visit', 'go to', 'plane', 'airport']
    const travelCount = this.countKeywordMatches(thoughts, travelKeywords)
    if (travelCount > 0) {
      categories.push({
        id: 'travel',
        name: 'Trips & Travel',
        confidence: Math.min(0.9, travelCount * 0.3),
        reasoning: 'Contains travel plans and trip-related items'
      })
    }
    
    // Look for personal/life content
    const personalKeywords = ['family', 'friend', 'personal', 'home', 'health', 'exercise', 'hobby', 'weekend']
    const personalCount = this.countKeywordMatches(thoughts, personalKeywords)
    if (personalCount > 0) {
      categories.push({
        id: 'personal',
        name: 'Personal',
        confidence: Math.min(0.8, personalCount * 0.25),
        reasoning: 'Contains personal life and family-related items'
      })
    }
    
    // Look for projects/goals
    const projectKeywords = ['project', 'goal', 'plan', 'build', 'create', 'develop', 'launch', 'idea']
    const projectCount = this.countKeywordMatches(thoughts, projectKeywords)
    if (projectCount > 0) {
      categories.push({
        id: 'projects',
        name: 'Projects & Goals',
        confidence: Math.min(0.8, projectCount * 0.2),
        reasoning: 'Contains project ideas and goal-oriented activities'
      })
    }
    
    // Look for learning/education
    const learningKeywords = ['learn', 'study', 'course', 'book', 'research', 'understand', 'skill']
    const learningCount = this.countKeywordMatches(thoughts, learningKeywords)
    if (learningCount > 0) {
      categories.push({
        id: 'learning',
        name: 'Learning & Growth',
        confidence: Math.min(0.8, learningCount * 0.3),
        reasoning: 'Contains learning activities and educational content'
      })
    }
    
    // Always include a miscellaneous category for uncategorized items
    categories.push({
      id: 'misc',
      name: 'Miscellaneous',
      confidence: 0.5,
      reasoning: 'General thoughts and uncategorized items'
    })
    
    // Return top 3-5 categories by confidence
    return categories.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
  }

  private countKeywordMatches(thoughts: ThoughtAnalysis[], keywords: string[]): number {
    return thoughts.reduce((count, thought) => {
      const text = thought.text.toLowerCase()
      return count + keywords.filter(keyword => text.includes(keyword)).length
    }, 0)
  }

  private analyzeContentThemes(thoughts: ThoughtAnalysis[]): Map<string, number> {
    const themes = new Map<string, number>()
    
    thoughts.forEach(thought => {
      const words = thought.text.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.length > 3 && !this.isStopWord(word)) {
          themes.set(word, (themes.get(word) || 0) + 1)
        }
      })
    })
    
    return themes
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'that', 'this', 'have', 'has', 'had', 'will', 'would', 'could', 'should']
    return stopWords.includes(word)
  }

  private assignToCategories(thoughts: ThoughtAnalysis[], categories: Array<{id: string, name: string, confidence: number, reasoning: string}>): ThoughtAnalysis[] {
    return thoughts.map(thought => {
      let bestCategory = 'misc'
      let bestScore = 0
      
      // Test each category to see which fits best
      categories.forEach(category => {
        const score = this.scoreThoughtForCategory(thought, category.id)
        if (score > bestScore) {
          bestScore = score
          bestCategory = category.id
        }
      })
      
      return {
        ...thought,
        category: bestCategory,
        confidence: Math.max(thought.confidence, bestScore)
      }
    })
  }

  private scoreThoughtForCategory(thought: ThoughtAnalysis, categoryId: string): number {
    const text = thought.text.toLowerCase()
    
    switch (categoryId) {
      case 'work':
        const workKeywords = ['work', 'job', 'meeting', 'project', 'team', 'office', 'boss', 'client', 'deadline', 'task', 'email', 'call']
        return this.calculateKeywordScore(text, workKeywords)
      
      case 'travel':
        const travelKeywords = ['trip', 'travel', 'vacation', 'flight', 'hotel', 'visit', 'go to', 'plane', 'airport', 'booking', 'pack']
        return this.calculateKeywordScore(text, travelKeywords)
      
      case 'personal':
        const personalKeywords = ['family', 'friend', 'personal', 'home', 'health', 'exercise', 'hobby', 'weekend', 'dinner', 'movie']
        return this.calculateKeywordScore(text, personalKeywords)
      
      case 'projects':
        const projectKeywords = ['project', 'goal', 'plan', 'build', 'create', 'develop', 'launch', 'idea', 'implement', 'design']
        return this.calculateKeywordScore(text, projectKeywords)
      
      case 'learning':
        const learningKeywords = ['learn', 'study', 'course', 'book', 'research', 'understand', 'skill', 'tutorial', 'practice']
        return this.calculateKeywordScore(text, learningKeywords)
      
      default:
        return 0.1 // Low score for misc category
    }
  }

  private calculateKeywordScore(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword)).length
    return Math.min(0.9, matches * 0.3)
  }

  private analyzeLine(line: string, id?: string): ThoughtAnalysis {
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
      id: id || `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

// Import providers at the top level to avoid dynamic import issues
import { OpenAIProvider } from './aiProviders/openai'
import { AnthropicProvider } from './aiProviders/anthropic'
import { FirebaseAIProvider } from './aiProviders/firebase'

// Factory to create AI service based on provider
export function createAIService(provider?: string): AIProvider {
  const debugMode = localStorage.getItem('ai_debug') === 'true'
  
  // Check environment variables for AI provider configuration
  const configuredProvider = provider || import.meta.env.VITE_AI_PROVIDER
  
  if (debugMode) {
    console.log('🔧 AI Service Factory')
    console.log('Requested provider:', provider)
    console.log('Configured provider:', configuredProvider)
    console.log('Environment:', {
      VITE_AI_PROVIDER: import.meta.env.VITE_AI_PROVIDER,
      hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      hasAnthropicKey: !!import.meta.env.VITE_ANTHROPIC_API_KEY
    })
  }
  
  switch (configuredProvider) {
    case 'firebase':
      if (debugMode) {
        console.log('✅ Creating Firebase AI provider')
      }
      return new FirebaseAIProvider()
      
    case 'openai':
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
        if (debugMode) {
          console.log('✅ Creating OpenAI provider')
        }
        return new OpenAIProvider(openaiKey)
      }
      if (debugMode) {
        console.log('❌ OpenAI key not configured properly')
      }
      break
      
    case 'anthropic':
      const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (anthropicKey && anthropicKey !== 'your_anthropic_api_key_here') {
        if (debugMode) {
          console.log('✅ Creating Anthropic provider')
        }
        return new AnthropicProvider(anthropicKey)
      }
      if (debugMode) {
        console.log('❌ Anthropic key not configured properly')
      }
      break
  }
  
  // Fall back to mock service if no provider is configured
  if (debugMode) {
    console.log('⚠️ Falling back to mock AI service')
  }
  return new MockAIService()
}