import { useAuthProvider } from '@/contexts/FirebaseAuthContext'
import { useAuth as useSupabaseAuth } from '@/contexts/AuthContext'
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext'

// A wrapper hook that returns the appropriate auth based on the provider
export function useAuthWrapper() {
  const useFirebase = useAuthProvider()

  if (useFirebase) {
    const firebaseAuth = useFirebaseAuth()
    return {
      user: firebaseAuth.user
        ? {
            id: firebaseAuth.user.uid,
            email: firebaseAuth.user.email,
            // Add other fields as needed for compatibility
          }
        : null,
      loading: firebaseAuth.loading,
      signOut: firebaseAuth.signOut,
      signIn: firebaseAuth.signIn,
      signUp: firebaseAuth.signUp,
      signInWithGoogle: firebaseAuth.signInWithGoogle,
      isOfflineMode: firebaseAuth.isOfflineMode,
    }
  } else {
    const supabaseAuth = useSupabaseAuth()
    return supabaseAuth
  }
}
