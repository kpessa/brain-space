import { cookies } from 'next/headers'
import { adminAuth } from './firebase-admin'
import { DecodedIdToken } from 'firebase-admin/auth'

export const AUTH_COOKIE_NAME = 'firebase-auth-token'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 5 // 5 days

export interface AuthResult {
  user: DecodedIdToken | null
  error: string | null
}

/**
 * Verify Firebase ID token from cookies or Authorization header
 */
export async function verifyAuth(
  authHeader?: string | null
): Promise<AuthResult> {
  try {
    let token: string | undefined

    // Check Authorization header first
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Fall back to cookie if no header token
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    }

    if (!token) {
      return { user: null, error: 'No auth token found' }
    }

    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      // In development without Firebase Admin SDK, decode the token manually
      // This is less secure but allows development without service account credentials
      if (process.env.NODE_ENV === 'development') {
        try {
          // Basic JWT decode for development
          const parts = token.split('.')
          if (parts.length !== 3) {
            return { user: null, error: 'Invalid token format' }
          }
          
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          
          // Check if token is expired
          const now = Date.now() / 1000
          if (payload.exp && payload.exp < now) {
            return { user: null, error: 'Token expired' }
          }
          
          // Return a minimal decoded token for development
          return {
            user: {
              uid: payload.sub || payload.user_id,
              email: payload.email,
              name: payload.name,
              email_verified: payload.email_verified,
              auth_time: payload.auth_time,
              iat: payload.iat,
              exp: payload.exp,
              firebase: payload.firebase || {},
            } as DecodedIdToken,
            error: null
          }
        } catch (error) {
          return { user: null, error: 'Failed to decode token' }
        }
      }
      
      return { user: null, error: 'Firebase Admin SDK not initialized' }
    }
    
    // Verify the token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Check if token is expired
    const now = Date.now() / 1000
    if (decodedToken.exp < now) {
      return { user: null, error: 'Token expired' }
    }

    return { user: decodedToken, error: null }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Invalid token' 
    }
  }
}

/**
 * Set auth cookie with secure settings
 */
export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

