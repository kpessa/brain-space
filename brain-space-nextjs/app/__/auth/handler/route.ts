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
  })
  
  // For sign-in redirects, Firebase handles the auth state internally
  // We just need to redirect back to the app
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `https://${request.headers.get('host')}` 
    : 'http://localhost:3000'
  
  // Redirect to the home page which will handle routing based on auth state
  return NextResponse.redirect(new URL('/', baseUrl))
}

export async function POST(request: NextRequest) {
  // Handle POST requests from Firebase Auth
  return GET(request)
}