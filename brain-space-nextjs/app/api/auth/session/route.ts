import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie, clearAuthCookie, verifyAuth } from '@/lib/auth-helpers'

/**
 * POST /api/auth/session - Set auth cookie from client-side token
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Verify the token is valid before setting cookie
    const { user, error } = await verifyAuth(`Bearer ${token}`)
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Invalid token' },
        { status: 401 }
      )
    }

    // Set secure HTTP-only cookie
    setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.name,
      }
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/session - Clear auth cookie
 */
export async function DELETE() {
  try {
    clearAuthCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Session deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/session - Check current session
 */
export async function GET() {
  try {
    const { user, error } = await verifyAuth()

    if (error || !user) {
      return NextResponse.json(
        { authenticated: false, error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.name,
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check session' },
      { status: 500 }
    )
  }
}