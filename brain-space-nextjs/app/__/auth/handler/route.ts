import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This route handles Firebase Auth redirects
  // Firebase uses this specific path for auth callbacks
  
  // Get the URL parameters
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('mode')
  const oobCode = searchParams.get('oobCode')
  const apiKey = searchParams.get('apiKey')
  const continueUrl = searchParams.get('continueUrl')
  
  // Log for debugging
  console.log('Firebase auth handler called:', {
    mode,
    hasOobCode: !!oobCode,
    hasApiKey: !!apiKey,
    continueUrl,
    timestamp: new Date().toISOString(),
  })
  
  // For sign-in redirects, we need to let the client-side handle the auth completion
  // Redirect to a special auth completion page that will handle cookie setting
  const origin = request.nextUrl.origin
  
  // Create a response that will load the auth handler page
  const response = NextResponse.redirect(new URL('/__/auth/handler', origin))
  
  // Set headers to prevent caching
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

export async function POST(request: NextRequest) {
  // Handle POST requests from Firebase Auth
  return GET(request)
}