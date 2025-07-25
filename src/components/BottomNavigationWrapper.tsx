import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  BookOpen,
  Brain,
  Clock,
  Trophy,
  Sparkles,
  LogOut,
  Grid,
  SunMoon,
  Calendar,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useOrientation } from '../hooks/useOrientation'
import { useAuthProvider } from '@/contexts/FirebaseAuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext'

interface NavItem {
  path: string
  icon: React.ElementType
  label: string
}

export default function BottomNavigationWrapper() {
  const location = useLocation()
  const { isMobileLandscape } = useOrientation()

  // Get auth based on provider
  const useFirebase = useAuthProvider()
  const supabaseAuth = !useFirebase ? useAuth() : null
  const firebaseAuth = useFirebase ? useFirebaseAuth() : null

  const auth = useFirebase ? firebaseAuth : supabaseAuth
  const user = auth?.user
  const signOut = auth?.signOut

  const navItems: NavItem[] = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/routines', icon: SunMoon, label: 'Routines' },
    { path: '/braindump', icon: Brain, label: 'Brain' },
    { path: '/timebox', icon: Clock, label: 'Time' },
  ]

  // Hide bottom navigation in landscape mode on mobile
  if (isMobileLandscape) {
    return null
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe">
      <div className="flex justify-around">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center py-2 px-3 text-xs transition-colors min-w-0 flex-1',
              location.pathname === item.path
                ? 'text-brain-600 dark:text-brain-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => signOut?.()}
          className="flex flex-col items-center py-2 px-3 text-xs transition-colors min-w-0 flex-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <LogOut className="h-5 w-5 mb-1" />
          <span className="truncate">Out</span>
        </button>
      </div>
    </nav>
  )
}
