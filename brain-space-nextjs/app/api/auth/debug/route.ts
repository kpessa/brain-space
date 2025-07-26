import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    const firebaseAdminStatus = {
      initialized: !!adminAuth,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET',
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      nodeEnv: process.env.NODE_ENV,
    }

    // Check for auth cookie
    const cookieStore = cookies()
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME)
    
    const cookieStatus = {
      exists: !!authCookie,
      name: AUTH_COOKIE_NAME,
      hasValue: !!authCookie?.value,
    }

    // Try to verify token if it exists and admin is initialized
    let tokenVerification = null
    if (authCookie?.value && adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(authCookie.value)
        tokenVerification = {
          success: true,
          uid: decodedToken.uid,
          email: decodedToken.email,
          exp: new Date(decodedToken.exp * 1000).toISOString(),
          iat: new Date(decodedToken.iat * 1000).toISOString(),
        }
      } catch (error) {
        tokenVerification = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    } else if (authCookie?.value && !adminAuth) {
      tokenVerification = {
        success: false,
        error: 'Firebase Admin not initialized - cannot verify token',
      }
    }

    // Get request headers
    const requestHeaders = {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host'),
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      firebaseAdmin: firebaseAdminStatus,
      cookie: cookieStatus,
      tokenVerification,
      headers: requestHeaders,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        isProduction: process.env.NODE_ENV === 'production',
      },
    }

    return NextResponse.json(debugInfo, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[Auth Debug] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}