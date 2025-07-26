// Edge-compatible auth helpers (no Firebase Admin SDK)
import { jwtDecode } from 'jwt-decode'

export const AUTH_COOKIE_NAME = 'firebase-auth-token'

/**
 * Basic JWT decode for Edge runtime (middleware)
 * This does NOT verify the signature, only decodes the token
 * Full verification should happen in API routes with Firebase Admin
 */
export function decodeAuthToken(token: string): { uid: string; email?: string; exp: number } | null {
  try {
    const decoded = jwtDecode<{ user_id: string; email?: string; exp: number }>(token)
    
    // Check if token is expired
    const now = Date.now() / 1000
    if (decoded.exp < now) {
      return null
    }
    
    return {
      uid: decoded.user_id,
      email: decoded.email,
      exp: decoded.exp
    }
  } catch {
    return null
  }
}

/**
 * Check if a path is public (doesn't require auth)
 */
export function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/login',
    '/api/auth',
    '/__/auth/handler',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
    '/auth-debug',
  ]
  
  return publicPaths.some(path => pathname.startsWith(path))
}

/**
 * Get redirect URL for unauthenticated users
 */
export function getAuthRedirectUrl(currentPath: string): string {
  // Store the attempted URL to redirect back after login
  const redirectUrl = new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
  
  // Don't redirect back to login or auth pages
  if (!isPublicPath(currentPath) && currentPath !== '/') {
    redirectUrl.searchParams.set('redirect', currentPath)
  }
  
  return redirectUrl.toString()
}