import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { HierarchicalCard } from './HierarchicalCard'
import { ChevronRight, ChevronLeft, Layers } from 'lucide-react'
import type { HierarchyNode } from '@/lib/hierarchyUtils'

export interface SplayedCardDeckProps {
  node: HierarchyNode
  selectedNodeId?: string
  focusedNodeId?: string
  onNodeSelect?: (nodeId: string) => void
  onNodeFocus?: (nodeId: string) => void
  onNodeContextMenu?: (e: React.MouseEvent, node: HierarchyNode) => void
  onNodeStatusToggle?: (nodeId: string, completed: boolean) => void
  className?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, node: HierarchyNode) => void
  onDragEnd?: (e: React.DragEvent) => void
}

export function SplayedCardDeck({
  node,
  selectedNodeId,
  focusedNodeId,
  onNodeSelect,
  onNodeFocus,
  onNodeContextMenu,
  onNodeStatusToggle,
  className,
  draggable = false,
  onDragStart,
  onDragEnd,
}: SplayedCardDeckProps) {
  const [isSplayed, setIsSplayed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get all nodes in the deck (parent + descendants)
  const getAllNodes = (n: HierarchyNode): HierarchyNode[] => {
    const nodes = [n]
    if (n.children) {
      n.children.forEach(child => {
        nodes.push(...getAllNodes(child))
      })
    }
    return nodes
  }

  const allNodes = getAllNodes(node)

  // Find the currently selected/focused node's index
  const getInitialFocusedIndex = () => {
    // First check if any node is explicitly focused
    if (focusedNodeId) {
      const focusedIdx = allNodes.findIndex(n => n.id === focusedNodeId)
      if (focusedIdx >= 0) return focusedIdx
    }
    // Then check if any node is selected
    if (selectedNodeId) {
      const selectedIdx = allNodes.findIndex(n => n.id === selectedNodeId)
      if (selectedIdx >= 0) return selectedIdx
    }
    // Default to parent (0)
    return 0
  }

  const [focusedIndex, setFocusedIndex] = useState(getInitialFocusedIndex)
  const focusedNode = allNodes[focusedIndex] || node

  // Update focused index when selectedNodeId or focusedNodeId changes
  useEffect(() => {
    setFocusedIndex(getInitialFocusedIndex())
  }, [selectedNodeId, focusedNodeId])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isSplayed) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setFocusedIndex(prev => Math.max(0, prev - 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          setFocusedIndex(prev => Math.min(allNodes.length - 1, prev + 1))
          break
        case 'Enter':
          e.preventDefault()
          if (onNodeSelect) {
            onNodeSelect(focusedNode.id)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsSplayed(false)
          setFocusedIndex(0)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSplayed, focusedIndex, allNodes.length, focusedNode, onNodeSelect])

  // Close splay when clicking outside
  useEffect(() => {
    if (!isSplayed) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSplayed(false)
        setFocusedIndex(0)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSplayed])

  const handleSplayToggle = () => {
    setIsSplayed(!isSplayed)
    if (!isSplayed) {
      setFocusedIndex(0)
    }
  }

  const handleCardClick = (index: number) => {
    setFocusedIndex(index)
    if (onNodeFocus) {
      onNodeFocus(allNodes[index].id)
    }
  }

  if (!isSplayed) {
    // Collapsed view - show single card with splay button
    return (
      <div className={cn('relative', className)} ref={containerRef}>
        <HierarchicalCard
          node={node}
          isSelected={selectedNodeId === node.id}
          isFocused={focusedNodeId === node.id}
          showHierarchy={false}
          onToggleExpand={() => {}}
          onSelect={onNodeSelect}
          onContextMenu={onNodeContextMenu}
          onStatusToggle={onNodeStatusToggle}
          draggable={draggable}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />

        {/* Splay button */}
        {allNodes.length > 1 && (
          <button
            onClick={handleSplayToggle}
            className={cn(
              'absolute -right-2 top-1/2 -translate-y-1/2',
              'bg-white border border-gray-300 rounded-full',
              'w-8 h-8 flex items-center justify-center',
              'hover:bg-gray-50 hover:border-gray-400',
              'shadow-sm transition-all duration-200',
              'z-10'
            )}
            title="Splay cards to select individual tasks"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // Splayed view - show all cards fanned out
  const cardWidth = 280
  const cardOverlap = 240
  const totalWidth = cardWidth + (allNodes.length - 1) * cardOverlap

  return (
    <div
      ref={containerRef}
      className={cn('relative transition-all duration-500', className)}
      style={{
        width: `${totalWidth}px`,
        height: '200px',
      }}
    >
      {/* Navigation buttons */}
      {focusedIndex > 0 && (
        <button
          onClick={() => setFocusedIndex(prev => prev - 1)}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full',
            'bg-white border border-gray-300 rounded-full',
            'w-8 h-8 flex items-center justify-center',
            'hover:bg-gray-50 hover:border-gray-400',
            'shadow-sm transition-all duration-200',
            'z-20'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {focusedIndex < allNodes.length - 1 && (
        <button
          onClick={() => setFocusedIndex(prev => prev + 1)}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 translate-x-full',
            'bg-white border border-gray-300 rounded-full',
            'w-8 h-8 flex items-center justify-center',
            'hover:bg-gray-50 hover:border-gray-400',
            'shadow-sm transition-all duration-200',
            'z-20'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Cards */}
      {allNodes.map((node, index) => {
        const isFocused = index === focusedIndex
        const isSelectedCard = selectedNodeId === node.id
        const offset = index * cardOverlap

        // Make the focused/selected card more prominent
        const scale = isFocused ? 1.05 : isSelectedCard ? 1 : 0.9
        const zIndex = isFocused ? 30 : isSelectedCard ? 25 : 10 - Math.abs(index - focusedIndex)
        const opacity = isFocused ? 1 : isSelectedCard ? 0.95 : 0.7
        const yOffset = isFocused ? -10 : isSelectedCard ? 0 : 20

        return (
          <div
            key={node.id}
            className="absolute transition-all duration-300 cursor-pointer"
            style={{
              left: `${offset}px`,
              top: `${yOffset}px`,
              width: `${cardWidth}px`,
              transform: `scale(${scale})`,
              zIndex,
              opacity,
            }}
            onClick={() => handleCardClick(index)}
          >
            <HierarchicalCard
              node={node}
              isSelected={selectedNodeId === node.id}
              isFocused={isFocused}
              showHierarchy={false}
              onToggleExpand={() => {}}
              onSelect={() => {
                setFocusedIndex(index)
                if (onNodeSelect) {
                  onNodeSelect(node.id)
                }
              }}
              onContextMenu={onNodeContextMenu}
              onStatusToggle={onNodeStatusToggle}
              draggable={draggable && isFocused}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />

            {/* Node indicators */}
            <div className="absolute -top-8 left-0 right-0 flex items-center gap-2 text-xs">
              {index > 0 && (
                <span className="text-gray-500">
                  {index === 1 ? 'Child' : `Descendant (${index})`}
                </span>
              )}
              {isSelectedCard && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Selected</span>
              )}
              {isFocused && !isSelectedCard && (
                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Focused</span>
              )}
            </div>
          </div>
        )
      })}

      {/* Close button */}
      <button
        onClick={() => {
          setIsSplayed(false)
          setFocusedIndex(0)
        }}
        className={cn(
          'absolute -top-2 -right-2',
          'bg-white border border-gray-300 rounded-full',
          'w-6 h-6 flex items-center justify-center',
          'hover:bg-gray-50 hover:border-gray-400',
          'shadow-sm transition-all duration-200',
          'z-30 text-xs'
        )}
        title="Collapse cards"
      >
        ✕
      </button>

      {/* Keyboard hints */}
      <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-gray-500">
        Use ← → to navigate, Enter to select, Esc to close
      </div>
    </div>
  )
}
