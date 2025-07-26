import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || request.nextUrl.origin
  
  // Return auth configuration for the client
  const config = {
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    usePopup: process.env.FORCE_AUTH_POPUP === 'true',
    redirectUrl: `${origin}/__/auth/handler`,
  }
  
  return NextResponse.json(config)
}