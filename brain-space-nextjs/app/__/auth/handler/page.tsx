'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FirebaseAuthHandler() {
  const router = useRouter()
  
  useEffect(() => {
    // This page handles Firebase Auth redirects
    // After Firebase processes the auth, redirect to home
    // The home page will handle routing based on auth state
    
    console.log('Firebase auth handler page loaded')
    
    // Small delay to ensure Firebase has processed the auth
    setTimeout(() => {
      router.push('/')
    }, 100)
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}