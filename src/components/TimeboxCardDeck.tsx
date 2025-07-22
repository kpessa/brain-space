import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SplayedCardDeck } from './SplayedCardDeck'
import { HierarchicalCard } from './HierarchicalCard'
import type { HierarchyNode } from '@/lib/hierarchyUtils'

export interface TimeboxCardDeckProps {
  node: HierarchyNode
  selectedNodeId?: string
  focusedNodeId?: string
  onNodeSelect?: (nodeId: string) => void
  onNodeFocus?: (nodeId: string) => void
  onToggleExpand?: (nodeId: string) => void
  onNodeContextMenu?: (e: React.MouseEvent, node: HierarchyNode) => void
  onNodeStatusToggle?: (nodeId: string, completed: boolean) => void
  className?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, node: HierarchyNode) => void
  onDragEnd?: (e: React.DragEvent) => void
}

export function TimeboxCardDeck({
  node,
  selectedNodeId,
  focusedNodeId,
  onNodeSelect,
  onNodeFocus,
  onToggleExpand,
  onNodeContextMenu,
  onNodeStatusToggle,
  className,
  draggable = false,
  onDragStart,
  onDragEnd,
}: TimeboxCardDeckProps) {
  const [splayedNodeId, setSplayedNodeId] = useState<string | null>(null)
  const [lastFocusedNodeId, setLastFocusedNodeId] = useState<string | undefined>(undefined)

  const handleSplay = (node: HierarchyNode) => {
    setSplayedNodeId(node.id)
  }

  const handleSplayClose = () => {
    setSplayedNodeId(null)
  }

  // Count total descendants
  const countDescendants = (n: HierarchyNode): number => {
    if (!n.children || n.children.length === 0) return 0
    return n.children.reduce((total, child) => {
      return total + 1 + countDescendants(child)
    }, 0)
  }

  const descendantCount = countDescendants(node)

  // If this node is splayed, show the splayed view
  if (splayedNodeId === node.id && descendantCount > 0) {
    return (
      <div className={className}>
        <SplayedCardDeck
          node={node}
          selectedNodeId={selectedNodeId}
          focusedNodeId={focusedNodeId || lastFocusedNodeId}
          onNodeSelect={onNodeSelect}
          onNodeFocus={nodeId => {
            setLastFocusedNodeId(nodeId)
            onNodeFocus?.(nodeId)
          }}
          onNodeContextMenu={onNodeContextMenu}
          onNodeStatusToggle={onNodeStatusToggle}
          draggable={draggable}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </div>
    )
  }

  // Otherwise show the regular card with splay button
  return (
    <HierarchicalCard
      node={node}
      isSelected={selectedNodeId === node.id}
      isFocused={focusedNodeId === node.id}
      showHierarchy={true}
      showSplayButton={true}
      onToggleExpand={onToggleExpand}
      onSelect={onNodeSelect}
      onSplay={handleSplay}
      onContextMenu={onNodeContextMenu}
      onStatusToggle={onNodeStatusToggle}
      className={className}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  )
}
