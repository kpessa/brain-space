'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  AuthError
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signUp: (email: string, password: string) => Promise<{ error?: Error }>
  isOfflineMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  
  // Sync with Zustand store
  const { setUser: setStoreUser, setLoading: setStoreLoading } = useAuthStore()

  // Helper function to set auth cookie
  const setAuthCookie = async (user: User) => {
    try {
      const idToken = await user.getIdToken()
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      })
    } catch (error) {
      console.error('Failed to set auth cookie:', error)
    }
  }

  // Helper function to clear auth cookie
  const clearAuthCookie = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to clear auth cookie:', error)
    }
  }

  useEffect(() => {
    // Check for redirect result first
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          console.log('Redirect sign-in successful:', result.user.email)
          
          // Set auth cookie for server-side auth
          await setAuthCookie(result.user)
          
          // Handle successful redirect sign-in
          const userRef = doc(db, 'users', result.user.uid, 'profile', 'data')
          const userDoc = await getDoc(userRef)

          if (!userDoc.exists()) {
            await setDoc(userRef, {
              id: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
          
          // After successful redirect auth, reload page to ensure server-side auth is checked
          const urlParams = new URLSearchParams(window.location.search)
          const redirect = urlParams.get('redirect') || '/journal'
          window.location.href = redirect
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error)
        // Clear any redirect errors to prevent loops
        if (error.code === 'auth/redirect-cancelled-by-user') {
          console.log('User cancelled the sign-in')
        }
      })

    // Check offline status
    const handleOnline = () => setIsOfflineMode(false)
    const handleOffline = () => setIsOfflineMode(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial offline status
    setIsOfflineMode(!navigator.onLine)

    let unsubscribe: () => void = () => {}

    try {
      // Listen for auth changes
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        
        // Set auth cookie for server-side auth
        await setAuthCookie(firebaseUser)

        // Create or update user profile in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid, 'profile', 'data')
        const userDoc = await getDoc(userRef)

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } else {
        setUser(null)
        // Clear auth cookie when user signs out
        await clearAuthCookie()
      }
      setLoading(false)
      setStoreUser(firebaseUser)
      setStoreLoading(false)
    })
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
      setStoreLoading(false)
    }

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setStoreUser, setStoreLoading])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return {}
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Create initial user profile
      const userRef = doc(db, 'users', user.uid, 'profile', 'data')
      await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return {}
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      // Only request basic profile scope for now
      // Uncomment these lines when you need calendar access and have verified your app
      // provider.addScope('https://www.googleapis.com/auth/calendar.readonly')
      // provider.addScope('https://www.googleapis.com/auth/calendar.events')

      // Check if we're in production and should use redirect instead of popup
      const isProduction = process.env.NODE_ENV === 'production'
      const shouldUseRedirect = isProduction && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')

      if (shouldUseRedirect) {
        // Use redirect flow in production to avoid COOP issues
        await signInWithRedirect(auth, provider)
        return
      }

      try {
        // Try popup first in development
        const result = await signInWithPopup(auth, provider)
        
        // Set auth cookie for server-side auth
        await setAuthCookie(result.user)

        // Create or update user profile
        const userRef = doc(db, 'users', result.user.uid, 'profile', 'data')
        const userDoc = await getDoc(userRef)

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            id: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else {
          await setDoc(
            userRef,
            {
              ...userDoc.data(),
              updatedAt: new Date(),
            },
            { merge: true }
          )
        }
      } catch (popupError: any) {
        // If popup blocked or COOP error, fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message?.includes('Cross-Origin-Opener-Policy')) {
          console.log('Popup blocked, using redirect instead')
          await signInWithRedirect(auth, provider)
        } else {
          throw popupError
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      // Clear auth cookie
      await clearAuthCookie()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    signIn,
    signUp,
    isOfflineMode,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hook for auth state from store (can be used anywhere)
export function useAuthState() {
  return useAuthStore()
}