import { headers } from 'next/headers'

/**
 * Get user info from request headers in server components
 * This is set by the middleware after verifying the auth token
 */
export function getUserFromHeaders() {
  const headersList = headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email')
  
  if (!userId) {
    return null
  }
  
  return {
    uid: userId,
    email: userEmail || undefined,
  }
}