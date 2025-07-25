'use client'

import { useAuth } from '@/contexts/AuthContext'
import { FirebaseLogin } from '@/components/FirebaseLogin'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { QuickAddModal } from '@/components/QuickAddModal'
import {
  BookOpen,
  Brain,
  Trophy,
  Clock,
  SunMoon,
  Calendar,
  LogOut,
  Menu,
  X,
  Network,
  Plus,
  Grid3x3,
  ListTodo,
  Repeat,
} from 'lucide-react'

const navigation = [
  { name: 'Todos', href: '/todos', icon: ListTodo },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Nodes', href: '/nodes', icon: Network },
  { name: 'Brain Dump', href: '/braindump', icon: Brain },
  { name: 'Matrix', href: '/matrix', icon: Grid3x3 },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Progress', href: '/progress', icon: Trophy },
  { name: 'Timebox', href: '/timebox', icon: Clock },
  { name: 'Routines', href: '/routines', icon: SunMoon },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const pathname = usePathname()

  // Global keyboard shortcut for quick add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open quick add
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setQuickAddOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600" />
      </div>
    )
  }

  if (!user) {
    return <FirebaseLogin />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-brain-600" />
              <span className="font-semibold">Brain Space</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-brain-50 text-brain-600 border-r-2 border-brain-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Brain className="h-8 w-8 text-brain-600" />
            <span className="text-xl font-bold">Brain Space</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                          pathname === item.href
                            ? 'bg-brain-50 text-brain-600'
                            : 'text-gray-700 hover:text-brain-600 hover:bg-gray-50'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                  {user.photoURL ? (
                    <img
                      className="h-8 w-8 rounded-full bg-gray-50"
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-brain-100 flex items-center justify-center">
                      <span className="text-brain-600 font-semibold text-sm">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true" className="truncate">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-brain-600 transition-colors"
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  Sign Out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              {/* Search could go here */}
            </div>
            <div className="flex items-center gap-x-4">
              <button
                onClick={() => setQuickAddOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Quick Add
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-500 bg-gray-50 border border-gray-300 rounded">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </div>
  )
}