'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-brain-600 to-space-600 bg-clip-text text-transparent mb-4">
          Brain Space
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your thoughts, organized and enhanced with AI
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <Link href="/login">
            <button className="px-6 py-3 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition">
              Get Started
            </button>
          </Link>
          <Link href="/test">
            <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Test Firebase
            </button>
          </Link>
        </div>
        
        {/* Debug info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left max-w-md mx-auto">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p className="text-sm text-gray-600">
            Auth Status: {loading ? 'Loading...' : user ? 'Logged In' : 'Not Logged In'}
          </p>
          <p className="text-sm text-gray-600">
            User: {user?.email || 'None'}
          </p>
        </div>
      </div>
    </main>
  )
}