import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth-helpers'

interface ThoughtAnalysis {
  text: string
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

interface CategoryResult {
  name: string
  thoughts: ThoughtAnalysis[]
  confidence: number
  reasoning: string
}

async function callOpenAI(text: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that categorizes thoughts and tasks from a brain dump.
          Analyze the provided text and return a JSON response with:
          - categories: Array of category objects with name, thoughts, confidence, and reasoning
          - relationships: Array of thought relationships (optional)
          - suggestions: Array of helpful suggestions
          
          For each thought, provide a nodeData object with:
          - type: The node type (thought, task, question, idea, note)
          - title: A concise title (max 100 chars)
          - description: The full enhanced description
          - tags: Array of relevant tags
          - urgency: 1-10 scale
          - importance: 1-10 scale
          - dueDate: Object with date property if applicable`,
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
  return JSON.parse(data.choices[0].message.content)
}

async function callGoogleAI(text: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this brain dump and categorize the thoughts. Return a JSON object with:
            - categories: Array of category objects, each containing:
              - name: Category name
              - thoughts: Array of thoughts in this category
              - confidence: 0-1 confidence score
              - reasoning: Why these thoughts belong together
            - suggestions: Array of helpful suggestions for the user
            
            For each thought, include a nodeData object with:
            - type: (thought, task, question, idea, note)
            - title: Concise title (max 100 chars)
            - description: Enhanced description
            - tags: Relevant tags array
            - urgency: 1-10 scale
            - importance: 1-10 scale
            - dueDate: {date: "ISO string"} if mentioned
            
            Brain dump text:
            ${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google AI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return JSON.parse(data.candidates[0].content.parts[0].text)
}

async function mockCategorize(text: string) {
  // Simple mock categorization for testing
  const lines = text.split('\n').filter(line => line.trim())
  
  const categories: CategoryResult[] = [
    {
      name: 'Tasks',
      thoughts: lines
        .filter(line => /buy|call|schedule|finish/i.test(line))
        .map(line => ({
          text: line,
          nodeData: {
            type: 'task',
            title: line.substring(0, 50),
            description: line,
            tags: ['todo'],
            urgency: 5,
            importance: 5,
          },
        })),
      confidence: 0.8,
      reasoning: 'Action-oriented items that need to be completed',
    },
    {
      name: 'Ideas',
      thoughts: lines
        .filter(line => /maybe|should|could|what if/i.test(line))
        .map(line => ({
          text: line,
          nodeData: {
            type: 'idea',
            title: line.substring(0, 50),
            description: line,
            tags: ['idea'],
            urgency: 3,
            importance: 6,
          },
        })),
      confidence: 0.7,
      reasoning: 'Thoughts and ideas for consideration',
    },
  ]

  return {
    categories: categories.filter(cat => cat.thoughts.length > 0),
    suggestions: ['Consider breaking down larger tasks into smaller steps'],
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const { user, error } = await verifyAuth(authHeader)
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { text, provider = 'mock' } = await request.json()

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: text is required' },
        { status: 400 }
      )
    }

    let result
    
    // Call appropriate AI provider
    switch (provider) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured')
        }
        result = await callOpenAI(text)
        break
        
      case 'google':
      case 'gemini':
        if (!process.env.GOOGLE_AI_API_KEY) {
          throw new Error('Google AI API key not configured')
        }
        result = await callGoogleAI(text)
        break
        
      case 'mock':
      default:
        result = await mockCategorize(text)
        break
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in categorize:', error)
    
    // Return a basic categorization as fallback
    return NextResponse.json({
      categories: [{
        name: 'Uncategorized',
        thoughts: [{
          text: 'Unable to categorize thoughts',
          nodeData: {
            type: 'thought',
            title: 'Error during categorization',
            tags: ['error'],
          },
        }],
        confidence: 0,
        reasoning: 'An error occurred during categorization',
      }],
      suggestions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}