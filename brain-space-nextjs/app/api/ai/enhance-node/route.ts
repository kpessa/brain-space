import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import type { NodeType } from '@/types/node'

// This runs on the server, so we can safely use API keys
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
          content: `You are an AI assistant that enhances and categorizes a single thought or task.
          Analyze the provided text and return a JSON response with:
          - type: The node type (goal, project, task, option, idea, question, problem, insight, thought, concern)
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
  return JSON.parse(data.choices[0].message.content)
}

async function callAnthropic(text: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this single thought or task and enhance it. Return ONLY a valid JSON object with:
          - type: The node type (goal, project, task, option, idea, question, problem, insight, thought, concern)
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
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error('Failed to parse JSON from Anthropic response')
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
            text: `Analyze this single thought or task and enhance it. Return ONLY a valid JSON object with:
            - type: The node type (goal, project, task, option, idea, question, problem, insight, thought, concern)
            - title: A concise title (max 100 chars)
            - description: The full enhanced description
            - tags: Array of relevant tags/categories
            - urgency: 1-10 scale (10 being most urgent)
            - importance: 1-10 scale (10 being most important)
            - dueDate: Object with date property (ISO string) if a deadline is mentioned

            Text to analyze: ${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
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

export async function POST(request: NextRequest) {
  let text = ''
  
  try {
    const body = await request.json()
    text = body.text
    const provider = body.provider || 'openai'

    // Optional: Verify Firebase auth token
    const authHeader = request.headers.get('authorization')
    if (authHeader && process.env.NODE_ENV === 'production' && adminAuth) {
      try {
        const token = authHeader.replace('Bearer ', '')
        await adminAuth.verifyIdToken(token)
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

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
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured')
        }
        result = await callAnthropic(text)
        break
        
      case 'google':
      case 'gemini':
        if (!process.env.GOOGLE_AI_API_KEY) {
          throw new Error('Google AI API key not configured')
        }
        result = await callGoogleAI(text)
        break
        
      case 'openai':
      default:
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured')
        }
        result = await callOpenAI(text)
        break
    }

    // Return in the expected format
    return NextResponse.json({
      nodeData: {
        type: (result.type as NodeType) || 'thought',
        title: result.title || text.substring(0, 100),
        description: result.description || text,
        tags: result.tags || ['misc'],
        urgency: result.urgency || 5,
        importance: result.importance || 5,
        dueDate: result.dueDate,
      },
    })
  } catch (error) {
    console.error('Error in enhance-node:', error)
    
    // Return a fallback response instead of failing completely
    return NextResponse.json({
      nodeData: {
        type: 'thought',
        title: text?.substring(0, 100) || 'Untitled',
        description: text || '',
        tags: ['misc'],
        urgency: 5,
        importance: 5,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}