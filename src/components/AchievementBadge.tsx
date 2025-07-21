import { cn } from '../lib/utils'
import type { Achievement } from '../types/journal'

interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
  showDescription?: boolean
  className?: string
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showDescription = false,
  className,
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl',
  }

  return (
    <div className={cn('text-center', className)}>
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg',
          sizeClasses[size],
          'hover:scale-110 transition-transform duration-200'
        )}
      >
        <span className="animate-fadeIn">{achievement.icon}</span>
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400/20 to-orange-400/20 animate-pulse"></div>
      </div>
      <p className="mt-2 font-semibold text-sm">{achievement.name}</p>
      {showDescription && <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>}
    </div>
  )
}
