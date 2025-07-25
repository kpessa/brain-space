import { Trophy, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LEVELS } from '@/types/journal'

interface LevelDisplayProps {
  level: number
  className?: string
  showTitle?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LevelDisplay({
  level,
  className,
  showTitle = true,
  size = 'md',
}: LevelDisplayProps) {
  const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0]

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

  return (
    <div className={cn('flex items-center gap-2', sizeClasses[size], className)}>
      <div className="relative">
        <Trophy className={cn(iconSizes[size], 'text-yellow-500')} />
        {level >= 5 && (
          <Sparkles
            className={cn('absolute -top-1 -right-1 w-3 h-3 text-purple-500 animate-pulse')}
          />
        )}
      </div>
      <div>
        <span className="font-bold">Level {level}</span>
        {showTitle && <span className="text-gray-600 ml-1">- {currentLevel.title}</span>}
      </div>
    </div>
  )
}