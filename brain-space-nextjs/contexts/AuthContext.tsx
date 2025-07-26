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
    console.log('[AuthContext] Initializing auth context', {
      timestamp: new Date().toISOString(),
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
    })

    // Skip redirect check if we're on the auth handler page
    // The handler page will manage its own auth flow
    const isAuthHandlerPage = typeof window !== 'undefined' && 
      window.location.pathname === '/__/auth/handler'
    
    if (!isAuthHandlerPage) {
      // Check for redirect result only if we're NOT on the auth handler page
      getRedirectResult(auth)
        .then(async (result) => {
          if (result && result.user) {
            console.log('[AuthContext] Redirect result found:', {
              userEmail: result.user.email,
              timestamp: new Date().toISOString(),
            })
            
            // Don't handle the redirect result here - let onAuthStateChanged handle it
            // This prevents duplicate cookie setting and profile creation
          }
        })
        .catch((error) => {
          console.error('[AuthContext] Redirect result error:', error)
          // Clear any redirect errors to prevent loops
          if (error.code === 'auth/redirect-cancelled-by-user') {
            console.log('[AuthContext] User cancelled the sign-in')
          }
        })
    }

    // Check offline status
    const handleOnline = () => setIsOfflineMode(false)
    const handleOffline = () => setIsOfflineMode(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial offline status
    setIsOfflineMode(!navigator.onLine)

    let unsubscribe: () => void = () => {}
    let hasSetCookie = false // Track if we've already set the cookie

    try {
      // Listen for auth changes
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('[AuthContext] Auth state changed:', {
          hasUser: !!firebaseUser,
          userEmail: firebaseUser?.email,
          hasSetCookie,
          timestamp: new Date().toISOString(),
        })

        if (firebaseUser) {
          setUser(firebaseUser)
          
          // Only set cookie if we haven't already done so
          // This prevents duplicate cookie setting from redirect flow
          if (!hasSetCookie && !isAuthHandlerPage) {
            hasSetCookie = true
            console.log('[AuthContext] Setting auth cookie')
            await setAuthCookie(firebaseUser)

            // Create or update user profile in Firestore
            try {
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
                console.log('[AuthContext] Created user profile')
              }
            } catch (error) {
              console.error('[AuthContext] Error creating user profile:', error)
            }
          }
        } else {
          setUser(null)
          hasSetCookie = false
          // Clear auth cookie when user signs out
          await clearAuthCookie()
        }
        
        setLoading(false)
        setStoreUser(firebaseUser)
        setStoreLoading(false)
      })
    } catch (error) {
      console.error('[AuthContext] Error setting up auth listener:', error)
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
    console.log('[AuthContext] Starting Google sign in', {
      timestamp: new Date().toISOString(),
      isProduction: process.env.NODE_ENV === 'production',
    })
    
    try {
      const provider = new GoogleAuthProvider()
      // Only request basic profile scope for now
      // Uncomment these lines when you need calendar access and have verified your app
      // provider.addScope('https://www.googleapis.com/auth/calendar.readonly')
      // provider.addScope('https://www.googleapis.com/auth/calendar.events')

      // Check if we're in production and should use redirect instead of popup
      const isProduction = process.env.NODE_ENV === 'production'
      const shouldUseRedirect = isProduction && typeof window !== 'undefined' && 
        (window.location.hostname.includes('vercel.app') || 
         window.location.hostname !== 'localhost')

      console.log('[AuthContext] Auth method:', shouldUseRedirect ? 'redirect' : 'popup')

      if (shouldUseRedirect) {
        // Use redirect flow in production to avoid COOP issues
        console.log('[AuthContext] Using redirect flow for production')
        await signInWithRedirect(auth, provider)
        return
      }

      try {
        // Try popup first in development
        console.log('[AuthContext] Attempting popup sign in')
        const result = await signInWithPopup(auth, provider)
        
        console.log('[AuthContext] Popup sign in successful:', {
          userEmail: result.user.email,
          timestamp: new Date().toISOString(),
        })
        
        // Don't set cookie here - let onAuthStateChanged handle it
        // This prevents duplicate cookie setting
      } catch (popupError: any) {
        // If popup blocked or COOP error, fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message?.includes('Cross-Origin-Opener-Policy')) {
          console.log('[AuthContext] Popup blocked, falling back to redirect')
          await signInWithRedirect(auth, provider)
        } else {
          throw popupError
        }
      }
    } catch (error) {
      console.error('[AuthContext] Google sign in error:', error)
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