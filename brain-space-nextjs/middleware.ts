import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, we'll let all requests through
  // In a real app, you'd verify the Firebase auth token here
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/ai']
  
  const { pathname } = request.nextUrl
  
  // Allow access to public routes and API routes
  if (publicRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // For now, allow all routes (remove this in production)
  return NextResponse.next()
  
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