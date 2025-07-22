import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, BookOpen, Trophy, Sparkles, Brain, LogOut, Clock, Menu, Grid } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './Button'
import BottomNavigation from './BottomNavigation'
import { useOrientation } from '../hooks/useOrientation'

export default function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isMobileLandscape } = useOrientation()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/braindump', icon: Brain, label: 'Brain Dump' },
    { path: '/timebox', icon: Clock, label: 'Timebox' },
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
              <Sparkles className="w-6 h-6" />
              Hero's Journal
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
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
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {user && (
                <Button
                  onClick={() => signOut()}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 px-3"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden">
              {user && (
                <Button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 p-2"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && user && (
        <div className="sm:hidden absolute top-16 right-0 w-48 bg-white dark:bg-gray-900 shadow-lg rounded-bl-lg z-50">
          <Button
            onClick={() => {
              signOut()
              setMobileMenuOpen(false)
            }}
            variant="ghost"
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-none rounded-bl-lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}

      <main
        className={cn(
          'flex-1',
          'sm:pb-0', // No bottom padding needed with sticky nav
          isMobileLandscape && 'pb-0 pt-safe' // Top safe area for landscape mobile
        )}
        style={{
          paddingLeft: isMobileLandscape ? 'calc(4rem + env(safe-area-inset-left))' : undefined,
        }}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
