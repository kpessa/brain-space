import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, BookOpen, Trophy, Sparkles, Brain, LogOut, Clock } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './Button'

export default function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/braindump', icon: Brain, label: 'Brain Dump' },
    { path: '/timebox', icon: Clock, label: 'Timebox' },
    { path: '/progress', icon: Trophy, label: 'Progress' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-brain-700 shadow-lg sticky top-0 z-50">
        <div className="px-4 lg:px-6 xl:px-8 2xl:px-12 3xl:px-16 4xl:px-20">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
              <Sparkles className="w-6 h-6" />
              Hero's Journal
            </Link>

            <div className="flex items-center gap-6">
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
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}

              {user && (
                <Button
                  onClick={() => signOut()}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
