import { useEffect } from 'react'
import { useAuthProvider } from '../contexts/FirebaseAuthContext'
import { useSupabaseSync as useOriginalSupabaseSync } from './useSupabaseSync'

// A safe version of useSupabaseSync that only runs when using Supabase auth
export function useSupabaseSyncSafe() {
  const useFirebase = useAuthProvider()

  // Only use the original hook when NOT using Firebase
  if (!useFirebase) {
    return useOriginalSupabaseSync()
  }

  // Return a no-op when using Firebase
  return {
    isSyncing: false,
    isOffline: false,
  }
}
