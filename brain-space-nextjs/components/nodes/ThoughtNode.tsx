'use client'

import { Handle, Position } from '@xyflow/react'

interface ThoughtNodeProps {
  id: string
  data: {
    label: string
    type?: string
    keywords?: string[]
    urgency?: number
    importance?: number
  }
  selected?: boolean
}

const typeColors: Record<string, string> = {
  task: 'bg-green-100 border-green-300 text-green-900',
  idea: 'bg-blue-100 border-blue-300 text-blue-900',
  question: 'bg-amber-100 border-amber-300 text-amber-900',
  problem: 'bg-red-100 border-red-300 text-red-900',
  insight: 'bg-purple-100 border-purple-300 text-purple-900',
  default: 'bg-gray-100 border-gray-300 text-gray-900',
}

export function ThoughtNode({ data }: ThoughtNodeProps) {
  const nodeType = data.type || 'default'
  const colorClass = typeColors[nodeType] || typeColors.default

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${colorClass} cursor-pointer select-none max-w-[300px]`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-gray-400 border border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-gray-400 border border-white"
      />
      
      <div className="text-sm">{data.label}</div>
      
      {data.keywords && data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.keywords.slice(0, 3).map((keyword, index) => (
            <span
              key={index}
              className="text-xs bg-white/50 px-1.5 py-0.5 rounded"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
      
      {(data.urgency || data.importance) && (
        <div className="flex gap-2 mt-2 text-xs">
          {data.urgency && (
            <span className="text-red-600">U: {data.urgency}/10</span>
          )}
          {data.importance && (
            <span className="text-blue-600">I: {data.importance}/10</span>
          )}
        </div>
      )}
    </div>
  )
}