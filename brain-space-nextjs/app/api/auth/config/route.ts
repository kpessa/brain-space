import { NextResponse } from 'next/server'

export async function GET() {
  // Return auth configuration for the client
  const config = {
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    usePopup: process.env.FORCE_AUTH_POPUP === 'true',
    redirectUrl: process.env.NODE_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL || 'brain-space-nextjs.vercel.app'}/__/auth/handler`
      : 'http://localhost:3000/__/auth/handler',
  }
  
  return NextResponse.json(config)
}