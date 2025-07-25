import { NextResponse } from 'next/server'

export async function GET() {
  const providers = []
  
  // Check which providers have API keys configured
  if (process.env.OPENAI_API_KEY) {
    providers.push('openai')
  }
  
  if (process.env.GOOGLE_AI_API_KEY) {
    providers.push('google')
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push('anthropic')
  }
  
  // Always include mock
  providers.push('mock')
  
  // Get current default provider
  const current = process.env.NEXT_PUBLIC_AI_PROVIDER || 'mock'
  
  return NextResponse.json({
    providers,
    current,
    configured: providers.length > 1, // More than just mock
  })
}