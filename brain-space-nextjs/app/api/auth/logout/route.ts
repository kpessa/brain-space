import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    clearAuthCookie()
    
    // Get the origin from the request
    const origin = request.nextUrl.origin
    
    // Redirect to login page using the request origin
    return NextResponse.redirect(new URL('/login', origin))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}