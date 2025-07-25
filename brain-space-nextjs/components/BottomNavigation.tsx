'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Brain,
  Clock,
  Trophy,
  Calendar,
  SunMoon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  path: string
  icon: React.ElementType
  label: string
}

export function BottomNavigation() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/braindump', icon: Brain, label: 'Brain' },
    { path: '/timebox', icon: Clock, label: 'Time' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/routines', icon: SunMoon, label: 'Routines' },
  ]

  // Hide bottom nav on certain routes
  const hideOnRoutes = ['/journal/new', '/journal/edit', '/auth']
  const shouldHide = hideOnRoutes.some(route => pathname.startsWith(route))

  if (shouldHide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 sm:hidden">
      <div className="grid grid-cols-6 h-16 px-2">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-all',
                isActive 
                  ? 'text-brain-600 dark:text-brain-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-all',
                  isActive && 'bg-brain-100 dark:bg-brain-900/50'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}