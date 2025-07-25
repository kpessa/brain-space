import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Home,
  BookOpen,
  Trophy,
  Sparkles,
  Brain,
  LogOut,
  Clock,
  Menu,
  Grid,
  SunMoon,
  Calendar,
  Network,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'
import BottomNavigationWrapper from './BottomNavigationWrapper'
import { QuickAddButton } from './QuickAddButton'
import { useOrientation } from '../hooks/useOrientation'

interface LayoutWrapperProps {
  user: any
  signOut: () => Promise<void>
}

export default function LayoutWrapper({ user, signOut }: LayoutWrapperProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isMobileLandscape } = useOrientation()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/routines', icon: SunMoon, label: 'Routines' },
    { path: '/braindump', icon: Brain, label: 'Brain Dump' },
    { path: '/nodes', icon: Network, label: 'Nodes' },
    { path: '/timebox', icon: Clock, label: 'Timebox' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/matrix', icon: Grid, label: 'Matrix' },
    { path: '/progress', icon: Trophy, label: 'Progress' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <nav
        className={cn(
          'bg-brain-700 shadow-lg sticky top-0 z-50 pt-safe',
          isMobileLandscape && 'hidden' // Hide top navbar in mobile landscape
        )}
      >
        <div className="px-4 lg:px-6 xl:px-8 2xl:px-12 3xl:px-16 4xl:px-20">
          <div className="flex items-center justify-between h-16 md:h-16">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
              <Brain className="h-6 w-6" />
              <span className="hidden sm:inline">Brain Space</span>
              <Sparkles className="h-4 w-4 hidden sm:inline" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-white',
                    location.pathname === item.path ? 'text-white' : 'text-brain-200'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side items */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-brain-200 hidden sm:inline">
                {user?.email?.split('@')[0]}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => signOut?.()}
                className="hidden md:flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-white p-2 rounded-lg hover:bg-brain-600 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-brain-600 py-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    location.pathname === item.path
                      ? 'text-white bg-brain-600'
                      : 'text-brain-200 hover:text-white hover:bg-brain-600'
                  )}
                >
                  <item.icon className="inline-block h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => signOut?.()}
                className="w-full mt-4 px-4 py-2 text-sm font-medium text-brain-200 hover:text-white hover:bg-brain-600 rounded-lg transition-colors text-left"
              >
                <LogOut className="inline-block h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-safe bg-gray-50 dark:bg-gray-900">
        <div className="min-h-full">
          <Outlet />
        </div>
        <QuickAddButton />
      </main>

      {/* Bottom navigation for mobile */}
      <BottomNavigationWrapper />
    </div>
  )
}
