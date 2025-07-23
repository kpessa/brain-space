import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Ghost, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BrainDumpNode } from '@/types/braindump'
import { useBrainDumpStore } from '@/store/braindump'
import { logger } from '@/services/logger'

export const GhostNode = memo(({ data, isConnectable, selected }: NodeProps<BrainDumpNode>) => {
  const { currentEntry, entries, setCurrentEntry } = useBrainDumpStore()

  // Find the original node this ghost references
  const originalNode = currentEntry?.nodes.find(n => n.id === data.referencedNodeId)
  const originalLabel = originalNode?.data.label || data.label
  const originalCategory = originalNode?.data.category || data.category

  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    ideas: { bg: 'bg-blue-50/50', border: 'border-blue-300', text: 'text-blue-700' },
    tasks: { bg: 'bg-green-50/50', border: 'border-green-300', text: 'text-green-700' },
    questions: { bg: 'bg-yellow-50/50', border: 'border-yellow-300', text: 'text-yellow-700' },
    insights: { bg: 'bg-purple-50/50', border: 'border-purple-300', text: 'text-purple-700' },
    problems: { bg: 'bg-red-50/50', border: 'border-red-300', text: 'text-red-700' },
    misc: { bg: 'bg-gray-50/50', border: 'border-gray-300', text: 'text-gray-700' },
  }

  const colors = categoryColors[originalCategory || 'misc'] || categoryColors.misc

  const handleDoubleClick = useCallback(() => {
    // Check if this ghost node itself has a topic brain dump reference
    if (data.hasTopicBrainDump && data.topicBrainDumpId) {
      logger.info('GHOST_NODE', 'Double-click on ghost node with topic dump', {
        nodeId: data.referencedNodeId,
        topicBrainDumpId: data.topicBrainDumpId,
      })

      const topicEntry = entries.find(e => e.id === data.topicBrainDumpId)
      if (topicEntry) {
        setCurrentEntry(topicEntry)
        logger.info('GHOST_NODE', 'Navigated to topic brain dump', {
          entryId: topicEntry.id,
          title: topicEntry.title,
        })
      } else {
        logger.warn('GHOST_NODE', 'Topic brain dump not found', {
          topicBrainDumpId: data.topicBrainDumpId,
        })
      }
    } else if (originalNode) {
      // Fallback to check original node
      if (originalNode.data.hasTopicBrainDump && originalNode.data.topicBrainDumpId) {
        logger.info('GHOST_NODE', 'Double-click on ghost node with topic dump from original', {
          nodeId: originalNode.id,
          topicBrainDumpId: originalNode.data.topicBrainDumpId,
        })

        const topicEntry = entries.find(e => e.id === originalNode.data.topicBrainDumpId)
        if (topicEntry) {
          setCurrentEntry(topicEntry)
          logger.info('GHOST_NODE', 'Navigated to topic brain dump', {
            entryId: topicEntry.id,
            title: topicEntry.title,
          })
        } else {
          logger.warn('GHOST_NODE', 'Topic brain dump not found', {
            topicBrainDumpId: originalNode.data.topicBrainDumpId,
          })
        }
      } else {
        logger.info('GHOST_NODE', 'Original node has no topic brain dump', {
          nodeId: originalNode.id,
        })
      }
    }
  }, [data, originalNode, entries, setCurrentEntry])

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg shadow-sm border-2 border-dashed transition-all relative',
        colors.bg,
        colors.border,
        colors.text,
        selected && 'ring-2 ring-brain-500 ring-offset-2',
        'opacity-70 hover:opacity-90'
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Ghost indicator */}
      <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border">
        <Ghost className="w-3 h-3 text-gray-500" />
      </div>

      {/* Handles - Target handles need unique IDs */}
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
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{originalLabel}</span>
        {originalNode && <ExternalLink className="w-3 h-3 opacity-50" />}
      </div>

      {/* Reference info */}
      <div className="text-xs opacity-60 mt-1">Reference to: {data.referencedNodeId}</div>
    </div>
  )
})

GhostNode.displayName = 'GhostNode'
