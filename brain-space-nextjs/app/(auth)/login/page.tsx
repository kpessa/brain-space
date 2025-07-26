import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAuth } from '@/lib/auth-helpers'
import LoginClient from './login-client'

export default async function LoginPage() {
  // Check if already authenticated server-side
  const cookieStore = cookies()
  const token = cookieStore.get('firebase-auth-token')?.value
  
  if (token) {
    const { user } = await verifyAuth(`Bearer ${token}`)
    if (user) {
      // Already authenticated, redirect to journal
      redirect('/journal')
    }
  }

  // Not authenticated, show login form
  return <LoginClient />
}