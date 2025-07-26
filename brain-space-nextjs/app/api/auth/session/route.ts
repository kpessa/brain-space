import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie, clearAuthCookie, verifyAuth } from '@/lib/auth-helpers'
import { adminAuth } from '@/lib/firebase-admin'

/**
 * POST /api/auth/session - Set auth cookie from client-side token
 */
export async function POST(request: NextRequest) {
  console.log('[Session API] POST request received', {
    timestamp: new Date().toISOString(),
    hasAdminAuth: !!adminAuth,
  })

  try {
    const { token } = await request.json()

    if (!token) {
      console.log('[Session API] No token provided')
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    console.log('[Session API] Attempting to verify token', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
    })

    // Check if Firebase Admin is available
    if (!adminAuth) {
      console.error('[Session API] Firebase Admin not initialized')
      
      // In development without admin SDK, we might want to allow setting the cookie
      // but in production this should fail
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { 
            error: 'Authentication service unavailable',
            details: 'Firebase Admin SDK not initialized. Please check server configuration.',
          },
          { status: 503 }
        )
      }
      
      // Development fallback - set cookie without full verification
      console.warn('[Session API] Development mode - setting cookie without full verification')
      setAuthCookie(token)
      
      return NextResponse.json({
        success: true,
        warning: 'Token not fully verified (development mode)',
        user: {
          uid: 'dev-user',
          email: 'dev@example.com',
          displayName: 'Development User',
        }
      })
    }

    // Verify the token is valid before setting cookie
    const { user, error } = await verifyAuth(`Bearer ${token}`)
    
    if (error || !user) {
      console.error('[Session API] Token verification failed:', error)
      return NextResponse.json(
        { 
          error: error || 'Invalid token',
          details: 'Token verification failed. Please try signing in again.',
        },
        { status: 401 }
      )
    }

    console.log('[Session API] Token verified successfully', {
      uid: user.uid,
      email: user.email,
    })

    // Set secure HTTP-only cookie
    setAuthCookie(token)

    console.log('[Session API] Cookie set successfully')

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.name,
      }
    })
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
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
  console.log('[Session API] GET request received', {
    timestamp: new Date().toISOString(),
    hasAdminAuth: !!adminAuth,
  })

  try {
    // Check if Firebase Admin is available
    if (!adminAuth) {
      console.error('[Session API] Firebase Admin not initialized for GET request')
      
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { 
            authenticated: false,
            error: 'Authentication service unavailable',
            details: 'Firebase Admin SDK not initialized',
          },
          { status: 503 }
        )
      }
      
      // Development mode - return not authenticated
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'Development mode - no Firebase Admin',
        },
        { status: 401 }
      )
    }

    const { user, error } = await verifyAuth()

    if (error || !user) {
      console.log('[Session API] No valid session found:', error)
      return NextResponse.json(
        { 
          authenticated: false, 
          error: error || 'No valid session',
        },
        { status: 401 }
      )
    }

    console.log('[Session API] Valid session found', {
      uid: user.uid,
      email: user.email,
    })

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.name,
      }
    })
  } catch (error) {
    console.error('[Session API] Unexpected error in GET:', error)
    return NextResponse.json(
      { 
        authenticated: false, 
        error: 'Failed to check session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}