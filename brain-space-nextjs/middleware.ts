import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/ai']
  
  const { pathname } = request.nextUrl
  
  // Create response with COOP headers for Firebase Auth
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Set COOP headers for Firebase Auth compatibility
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
  
  // Allow access to public routes and API routes
  if (publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/')) {
    return response
  }
  
  // For now, allow all routes (remove this in production)
  return response
  
  // TODO: Add actual Firebase auth verification
  // const token = request.cookies.get('auth-token')
  // if (!token) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }
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