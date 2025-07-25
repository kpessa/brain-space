import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get the API key from environment variables
  const anthropicKey = process.env.VITE_ANTHROPIC_API_KEY

  if (!anthropicKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' })
  }

  try {
    // Forward the request to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    })

    const data = await response.json()

    // Forward the response
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Anthropic proxy error:', error)
    res.status(500).json({ error: 'Failed to proxy request to Anthropic' })
  }
}