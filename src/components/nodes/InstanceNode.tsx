import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Link2, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BrainDumpNode } from '@/types/braindump'
import { useBrainDumpStore } from '@/store/braindump'

export const InstanceNode = memo(({ data, isConnectable, selected }: NodeProps<BrainDumpNode>) => {
  const { currentEntry } = useBrainDumpStore()

  // Find the prototype node this instance references
  const prototypeNode = currentEntry?.nodes.find(n => n.id === data.prototypeId)
  const isPrototype = data.instances && data.instances.length > 0

  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    ideas: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
    tasks: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
    questions: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
    insights: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
    problems: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
    misc: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' },
  }

  const colors = categoryColors[data.category || 'misc'] || categoryColors.misc

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg shadow-sm border-2 transition-all relative',
        data.isInstance ? 'border-dashed' : 'border-solid',
        colors.bg,
        colors.border,
        colors.text,
        selected && 'ring-2 ring-brain-500 ring-offset-2'
      )}
    >
      {/* Prototype/Instance indicator */}
      {isPrototype && (
        <div
          className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-sm"
          title="Prototype node"
        >
          <Crown className="w-3 h-3 text-yellow-900" />
        </div>
      )}
      {data.isInstance && (
        <div
          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border"
          title="Instance node"
        >
          <Link2 className="w-3 h-3 text-gray-600" />
        </div>
      )}

      {/* Synonym count badge */}
      {data.synonyms && data.synonyms.length > 0 && (
        <div
          className="absolute -top-2 -left-2 bg-brain-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
          title={`${data.synonyms.length} synonym${data.synonyms.length > 1 ? 's' : ''}`}
        >
          {data.synonyms.length}
        </div>
      )}

      {/* Icon */}
      {data.style?.icon && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-2xl">
          {data.style.icon}
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2 h-2 !bg-gray-400"
        isConnectable={isConnectable}
      />

      {/* Content */}
      <div className={cn('text-sm font-medium', data.style?.icon && 'mt-3')}>{data.label}</div>

      {/* Instance info */}
      {data.isInstance && prototypeNode && (
        <div className="text-xs opacity-60 mt-1">Instance of: {prototypeNode.data.label}</div>
      )}
    </div>
  )
})

InstanceNode.displayName = 'InstanceNode'
