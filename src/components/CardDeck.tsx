import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { HierarchicalCard } from './HierarchicalCard'
import {
  buildHierarchy,
  flattenHierarchy,
  findNodeById,
  filterHierarchy,
  expandAll,
  collapseAll,
  type HierarchyNode,
} from '@/lib/hierarchyUtils'
import type { BrainDumpNode, BrainDumpEdge } from '@/types/braindump'
import { ChevronDown, ChevronRight, ExpandIcon, ShrinkIcon } from 'lucide-react'

interface CardDeckProps {
  nodes: BrainDumpNode[]
  edges?: BrainDumpEdge[]
  selectedNodeId?: string
  focusedNodeId?: string
  showHierarchy?: boolean
  filterQuery?: string
  onNodeSelect?: (nodeId: string) => void
  onNodeFocus?: (nodeId: string) => void
  onNodeContextMenu?: (e: React.MouseEvent, node: HierarchyNode) => void
  onNodeStatusToggle?: (nodeId: string, completed: boolean) => void
  onNodeUpdate?: (nodeId: string, updates: Partial<BrainDumpNode['data']>) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, node: HierarchyNode) => void
  onDragEnd?: (e: React.DragEvent) => void
  className?: string
  cardClassName?: string
  emptyStateMessage?: string
}

export function CardDeck({
  nodes,
  edges = [],
  selectedNodeId,
  focusedNodeId,
  showHierarchy = true,
  filterQuery = '',
  onNodeSelect,
  onNodeFocus,
  onNodeContextMenu,
  onNodeStatusToggle,
  onNodeUpdate,
  draggable = false,
  onDragStart,
  onDragEnd,
  className,
  cardClassName,
  emptyStateMessage = 'No tasks found',
}: CardDeckProps) {
  // Track expanded state for nodes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Build hierarchy from flat nodes
  const hierarchy = useMemo(() => {
    if (!showHierarchy) {
      // Return flat structure when hierarchy is disabled
      return nodes.map(
        node =>
          ({
            ...node,
            children: [],
            depth: 0,
            isExpanded: true,
            hasChildren: false,
            parentNode: undefined,
          }) as HierarchyNode
      )
    }

    return buildHierarchy(nodes, edges, expandedIds)
  }, [nodes, edges, expandedIds, showHierarchy])

  // Apply filtering while preserving hierarchy
  const filteredHierarchy = useMemo(() => {
    if (!filterQuery.trim()) return hierarchy

    const query = filterQuery.toLowerCase()
    return filterHierarchy(
      hierarchy,
      node =>
        node.data.label.toLowerCase().includes(query) ||
        node.data.category?.toLowerCase().includes(query) ||
        false
    )
  }, [hierarchy, filterQuery])

  // Flatten for display, respecting expanded state
  const displayNodes = useMemo(() => {
    return flattenHierarchy(filteredHierarchy, false)
  }, [filteredHierarchy])

  // Handle expand/collapse
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // Bulk expand/collapse operations
  const handleExpandAll = useCallback(() => {
    const allNodeIds = new Set(hierarchy.map(node => node.id))

    function addChildIds(nodes: HierarchyNode[]) {
      nodes.forEach(node => {
        allNodeIds.add(node.id)
        addChildIds(node.children)
      })
    }

    addChildIds(hierarchy)
    setExpandedIds(allNodeIds)
  }, [hierarchy])

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  // Handle card interactions
  const handleCardSelect = useCallback(
    (nodeId: string) => {
      onNodeSelect?.(nodeId)
      // If no focused node, also focus this one
      if (!focusedNodeId) {
        onNodeFocus?.(nodeId)
      }
    },
    [onNodeSelect, onNodeFocus, focusedNodeId]
  )

  const handleCardFocus = useCallback(
    (nodeId: string) => {
      onNodeFocus?.(nodeId)
    },
    [onNodeFocus]
  )

  if (displayNodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div>
          <p className="text-gray-500 mb-2">{emptyStateMessage}</p>
          {filterQuery && <p className="text-sm text-gray-400">Try adjusting your search query</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Bulk actions for hierarchy */}
      {showHierarchy && hierarchy.some(node => node.hasChildren) && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={handleExpandAll}
            className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <ExpandIcon className="w-3 h-3" />
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <ShrinkIcon className="w-3 h-3" />
            Collapse All
          </button>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">
            {displayNodes.length} of {nodes.length} tasks
          </span>
        </div>
      )}

      {/* Card list */}
      <div className="space-y-1">
        {displayNodes.map((node, index) => (
          <HierarchicalCard
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isFocused={focusedNodeId === node.id}
            showHierarchy={showHierarchy}
            draggable={draggable}
            onToggleExpand={handleToggleExpand}
            onSelect={handleCardSelect}
            onContextMenu={onNodeContextMenu}
            onStatusToggle={onNodeStatusToggle}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(
              'transition-all duration-200',
              // Add stacking effect for visual hierarchy
              showHierarchy && node.depth > 0 && 'relative',
              cardClassName
            )}
            style={{
              // Add subtle animation delay for cascading effects
              animationDelay: `${index * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Summary info */}
      {displayNodes.length > 0 && (
        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>
              Showing {displayNodes.length} tasks
              {filterQuery && ` matching "${filterQuery}"`}
            </span>
            {showHierarchy && <span>{expandedIds.size} expanded</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for managing card deck state
export function useCardDeck(nodes: BrainDumpNode[], edges: BrainDumpEdge[] = []) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const [focusedNodeId, setFocusedNodeId] = useState<string | undefined>()
  const [filterQuery, setFilterQuery] = useState('')
  const [showHierarchy, setShowHierarchy] = useState(true)

  const clearSelection = useCallback(() => {
    setSelectedNodeId(undefined)
    setFocusedNodeId(undefined)
  }, [])

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  const focusNode = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId)
  }, [])

  const toggleHierarchy = useCallback(() => {
    setShowHierarchy(prev => !prev)
  }, [])

  return {
    selectedNodeId,
    focusedNodeId,
    filterQuery,
    showHierarchy,
    setSelectedNodeId,
    setFocusedNodeId,
    setFilterQuery,
    setShowHierarchy,
    clearSelection,
    selectNode,
    focusNode,
    toggleHierarchy,
  }
}
