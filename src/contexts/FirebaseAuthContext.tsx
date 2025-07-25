import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface FirebaseAuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: Error }>
  signUp: (email: string, password: string) => Promise<{ error?: Error }>
  isOfflineMode: boolean
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  useEffect(() => {
    // Check offline status
    const handleOnline = () => setIsOfflineMode(false)
    const handleOffline = () => setIsOfflineMode(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial offline status
    setIsOfflineMode(!navigator.onLine)

    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser)

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
      }
      setLoading(false)
    })

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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

      const result = await signInWithPopup(auth, provider)

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
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
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

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext)
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
}

// Helper to check if we should use Firebase auth
export function useAuthProvider() {
  // This could check an environment variable or feature flag
  return import.meta.env.VITE_USE_FIREBASE_AUTH === 'true'
}
