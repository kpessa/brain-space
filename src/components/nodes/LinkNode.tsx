import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Link2, ExternalLink, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BrainDumpNode } from '@/types/braindump'
import { useBrainDumpStore } from '@/store/braindump'
import { useNavigate } from 'react-router-dom'

export const LinkNode = memo(({ data, isConnectable, selected }: NodeProps<BrainDumpNode>) => {
  const navigate = useNavigate()
  const { entries, setCurrentEntry } = useBrainDumpStore()

  // Find the linked brain dump
  const linkedEntry = entries.find(e => e.id === data.linkedBrainDumpId)
  const linkedTitle = linkedEntry?.title || 'Unknown Brain Dump'

  const handleDoubleClick = useCallback(() => {
    if (linkedEntry) {
      // Set the linked entry as current and navigate
      setCurrentEntry(linkedEntry)
      // Optionally navigate to ensure we're on the brain dump page
      navigate('/braindump')
    }
  }, [linkedEntry, setCurrentEntry, navigate])

  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    link: { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' },
  }

  const colors = categoryColors.link

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg shadow-md border-2 transition-all relative cursor-pointer',
        'hover:shadow-lg transform hover:scale-105',
        colors.bg,
        colors.border,
        colors.text,
        selected && 'ring-2 ring-brain-500 ring-offset-2'
      )}
      onDoubleClick={handleDoubleClick}
      title={`Double-click to open: ${linkedTitle}`}
    >
      {/* Link indicator */}
      <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border">
        <Link2 className="w-3 h-3 text-indigo-500" />
      </div>

      {/* Handles - Only show essential handles for links */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="w-2 h-2 !bg-indigo-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="w-2 h-2 !bg-indigo-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className="w-2 h-2 !bg-indigo-400"
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="w-2 h-2 !bg-indigo-400"
        isConnectable={isConnectable}
      />

      {/* Content */}
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{data.label}</span>
          <span className="text-xs opacity-75 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {linkedTitle}
          </span>
        </div>
      </div>
    </div>
  )
})

LinkNode.displayName = 'LinkNode'
