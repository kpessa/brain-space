'use client'

import { Handle, Position } from '@xyflow/react'
import { ChevronDown, ChevronRight } from 'lucide-react'

const categoryIcons: Record<string, string> = {
  ideas: '💡',
  tasks: '✅',
  questions: '❓',
  insights: '🔍',
  problems: '⚠️',
  misc: '📌',
}

const categoryColors: Record<string, string> = {
  ideas: 'from-blue-400 to-blue-600',
  tasks: 'from-green-400 to-green-600',
  questions: 'from-amber-400 to-amber-600',
  insights: 'from-purple-400 to-purple-600',
  problems: 'from-red-400 to-red-600',
  misc: 'from-gray-400 to-gray-600',
}

interface CategoryNodeProps {
  id: string
  data: {
    label: string
    category?: string
    isCollapsed?: boolean
    confidence?: number
  }
  selected?: boolean
}

export function CategoryNode({ data }: CategoryNodeProps) {
  const category = data.category || 'misc'
  const icon = categoryIcons[category] || '📁'
  const colorClass = categoryColors[category] || categoryColors.misc
  const isCollapsed = data.isCollapsed || false

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br ${colorClass} text-white border-2 border-white/20 cursor-pointer select-none min-w-[150px]`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-400 border-2 border-white"
      />
      
      <div className="flex items-center gap-2">
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <span className="text-lg">{icon}</span>
        <div className="font-semibold">{data.label}</div>
        {data.confidence && (
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full ml-auto">
            {Math.round(data.confidence * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}