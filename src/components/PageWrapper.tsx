import { ReactNode } from 'react'
import { useAuthProvider } from '@/contexts/FirebaseAuthContext'

interface PageWrapperProps {
  children: ReactNode
  requiresSupabase?: boolean
}

export function PageWrapper({ children, requiresSupabase = false }: PageWrapperProps) {
  const useFirebase = useAuthProvider()

  // If page requires Supabase and we're using Firebase, show a message
  if (requiresSupabase && useFirebase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Page Under Construction
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This page is being migrated to Firebase. Please check back soon!
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              🚧 Migration in progress from Supabase to Firebase
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
