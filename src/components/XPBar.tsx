import { cn } from '../lib/utils'

interface XPBarProps {
  currentXP: number
  maxXP: number
  level: number
  className?: string
}

export function XPBar({ currentXP, maxXP, level, className }: XPBarProps) {
  const percentage = Math.min((currentXP / maxXP) * 100, 100)

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Level {level}</span>
        <span>
          {currentXP} / {maxXP} XP
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-brain-500 to-space-500 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
