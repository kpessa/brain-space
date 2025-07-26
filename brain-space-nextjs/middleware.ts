import { NextRequest, NextResponse } from 'next/server'
import { decodeAuthToken, isPublicPath, getAuthRedirectUrl, AUTH_COOKIE_NAME } from './lib/auth-helpers-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Create response with COOP headers for Firebase Auth
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Set COOP headers for Firebase Auth compatibility
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
  
  // Skip auth check for public paths
  if (isPublicPath(pathname)) {
    return response
  }
  
  // Special handling for API routes
  if (pathname.startsWith('/api/')) {
    // Some API routes are public (like auth endpoints)
    if (pathname.startsWith('/api/auth/')) {
      return response
    }
    
    // For other API routes, we'll check auth in the route handlers
    // This allows for more flexible auth handling per endpoint
    return response
  }
  
  // For protected pages, verify authentication
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  
  if (!token) {
    // No token, redirect to login
    return NextResponse.redirect(new URL(getAuthRedirectUrl(pathname), request.url))
  }
  
  // Decode the token (basic validation in Edge runtime)
  const decoded = decodeAuthToken(token)
  
  if (!decoded) {
    // Invalid or expired token, clear it and redirect to login
    const redirectResponse = NextResponse.redirect(
      new URL(getAuthRedirectUrl(pathname), request.url)
    )
    redirectResponse.cookies.delete(AUTH_COOKIE_NAME)
    return redirectResponse
  }
  
  // Valid auth, proceed with request
  // Add user info to headers for server components
  requestHeaders.set('x-user-id', decoded.uid)
  requestHeaders.set('x-user-email', decoded.email || '')
  requestHeaders.set('x-pathname', pathname)
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}