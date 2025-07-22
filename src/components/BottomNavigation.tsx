import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, Brain, Clock, Trophy, Sparkles, LogOut } from 'lucide-react'
import { cn } from '../lib/utils'
import { useOrientation } from '../hooks/useOrientation'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  path: string
  icon: React.ElementType
  label: string
}

export default function BottomNavigation() {
  const location = useLocation()
  const { isMobileLandscape } = useOrientation()
  const { user, signOut } = useAuth()
  
  const navItems: NavItem[] = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/braindump', icon: Brain, label: 'Brain' },
    { path: '/timebox', icon: Clock, label: 'Timebox' },
    { path: '/progress', icon: Trophy, label: 'Progress' },
  ]
  
  // Hide bottom nav on certain routes
  const hideOnRoutes = [
    '/journal/new',
    '/journal/edit',
    '/journal/view',
    '/auth',
    '/auth-callback',
  ]
  
  const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route))
  
  if (shouldHide) return null
  
  // Render as side navigation in mobile landscape
  if (isMobileLandscape) {
    return (
      <nav 
        className="fixed left-0 top-0 bottom-0 z-50 bg-white dark:bg-gray-800 backdrop-blur-lg border-r border-gray-200 dark:border-gray-700 pt-safe pb-safe shadow-lg"
        style={{ width: 'calc(4rem + env(safe-area-inset-left))' }}
      >
        <div className="flex flex-col h-full pl-safe">
          {/* Branding at top */}
          <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="text-brain-600 dark:text-brain-400 hover:text-brain-700 dark:hover:text-brain-300 transition-colors">
              <Sparkles className="w-6 h-6" />
            </Link>
          </div>
          
          {/* Navigation items in middle */}
          <div className="flex-1 flex flex-col items-center py-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive =
                item.path === '/'
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center w-full py-2 transition-all',
                    isActive
                      ? 'text-brain-600 dark:text-brain-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg transition-all',
                    isActive && 'bg-brain-100 dark:bg-brain-900/50'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
              )
            })}
          </div>
          
          {/* Sign out button at bottom */}
          {user && (
            <div className="flex items-center justify-center py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => signOut()}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </nav>
    )
  }
  
  // Default bottom navigation for portrait mode
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block sm:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-5" style={{ paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '64px' }}>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive =
            item.path === '/'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-all',
                isActive
                  ? 'text-brain-600 dark:text-brain-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <div className={cn(
                'p-1 rounded-lg transition-all',
                isActive && 'bg-brain-100 dark:bg-brain-900/50'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                'font-medium',
                isActive ? 'text-brain-600 dark:text-brain-400' : 'text-gray-600 dark:text-gray-300'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}