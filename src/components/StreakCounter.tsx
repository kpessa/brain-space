import { Flame } from 'lucide-react'
import { cn } from '../lib/utils'

interface StreakCounterProps {
  currentStreak: number
  longestStreak?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  size = 'md',
  className,
}: StreakCounterProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const numberSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }

  const getFlameColor = () => {
    if (currentStreak >= 30) return 'text-purple-500'
    if (currentStreak >= 14) return 'text-orange-500'
    if (currentStreak >= 7) return 'text-yellow-500'
    if (currentStreak >= 3) return 'text-orange-400'
    return 'text-gray-400'
  }

  return (
    <div className={cn('text-center', sizeClasses[size], className)}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <Flame
          className={cn(iconSizes[size], getFlameColor(), currentStreak > 0 && 'animate-pulse')}
        />
        <span className={cn('font-bold', numberSizes[size])}>{currentStreak}</span>
      </div>
      <p className="text-gray-600">Day Streak</p>
      {longestStreak !== undefined && currentStreak < longestStreak && (
        <p className="text-xs text-gray-500 mt-1">Best: {longestStreak} days</p>
      )}
    </div>
  )
}
