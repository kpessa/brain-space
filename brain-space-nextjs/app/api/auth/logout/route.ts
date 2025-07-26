import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-helpers'

export async function GET() {
  try {
    clearAuthCookie()
    
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}