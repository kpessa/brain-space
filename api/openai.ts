import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get the API key from environment variables
  const openaiKey = process.env.VITE_OPENAI_API_KEY

  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  try {
    // Forward the request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    // Forward the response
    res.status(response.status).json(data)
  } catch (error) {
    console.error('OpenAI proxy error:', error)
    res.status(500).json({ error: 'Failed to proxy request to OpenAI' })
  }
}