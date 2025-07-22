import { forwardRef, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/Card'
import { ChevronRight, ChevronDown, CheckSquare, Square, MoreVertical, Layers } from 'lucide-react'
import type { HierarchyNode } from '@/lib/hierarchyUtils'
import { getQuadrant, getQuadrantInfo } from '@/lib/priorityUtils'

export interface HierarchicalCardProps {
  node: HierarchyNode
  isSelected?: boolean
  isFocused?: boolean
  showHierarchy?: boolean
  isCollapsed?: boolean
  onToggleExpand?: (nodeId: string) => void
  onSelect?: (nodeId: string) => void
  onNodeFocus?: (nodeId: string) => void
  onContextMenu?: (e: React.MouseEvent, node: HierarchyNode) => void
  onStatusToggle?: (nodeId: string, completed: boolean) => void
  onSplay?: (node: HierarchyNode) => void
  showSplayButton?: boolean
  className?: string
  style?: React.CSSProperties
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, node: HierarchyNode) => void
  onDragEnd?: (e: React.DragEvent) => void
  focusedChildId?: string
}

export const HierarchicalCard = forwardRef<HTMLDivElement, HierarchicalCardProps>((props, ref) => {
  const {
    node,
    isSelected = false,
    isFocused = false,
    showHierarchy = true,
    isCollapsed = false,
    onToggleExpand,
    onSelect,
    onNodeFocus,
    onContextMenu,
    onStatusToggle,
    onSplay,
    showSplayButton = false,
    className,
    style,
    draggable = false,
    onDragStart,
    onDragEnd,
    focusedChildId,
    ...rest
  } = props

  const [isHovered, setIsHovered] = useState(false)
  const [localExpanded, setLocalExpanded] = useState(node.isExpanded || false)
  const [isLongPressing, setIsLongPressing] = useState(false)

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize focused child index based on focusedChildId prop
  const getInitialFocusedIndex = () => {
    if (focusedChildId && node.children) {
      const index = node.children.findIndex(child => child.id === focusedChildId)
      return index >= 0 ? index : -1
    }
    return -1
  }

  const [focusedChildIndex, setFocusedChildIndex] = useState<number>(getInitialFocusedIndex)

  // Calculate these first before using them
  const hasChildren = (node.children?.length ?? 0) > 0
  const isCompleted = node.data.taskStatus === 'completed'

  // Get Eisenhower quadrant info
  const quadrant = getQuadrant(node.data.importance, node.data.urgency)
  const quadrantInfo = getQuadrantInfo(quadrant)

  // Use local state if no onToggleExpand is provided
  const isExpanded = onToggleExpand ? node.isExpanded : localExpanded

  // Get the focused child node if any
  const focusedChild =
    focusedChildIndex >= 0 && node.children?.[focusedChildIndex]
      ? node.children[focusedChildIndex]
      : null

  // Update focused child index when focusedChildId prop changes
  useEffect(() => {
    setFocusedChildIndex(getInitialFocusedIndex())
  }, [focusedChildId])

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand(node.id)
    } else {
      setLocalExpanded(!localExpanded)
    }
    // Reset focus to parent when toggling
    setFocusedChildIndex(-1)
  }

  const handleChildClick = (index: number) => {
    setFocusedChildIndex(index)
    if (onNodeFocus && node.children?.[index]) {
      onNodeFocus(node.children[index].id)
    }
  }

  // Count total descendants (not just immediate children)
  const countDescendants = (n: HierarchyNode): number => {
    if (!n.children || n.children.length === 0) return 0
    return n.children.reduce((total, child) => {
      return total + 1 + countDescendants(child)
    }, 0)
  }

  const descendantCount = countDescendants(node)

  // Generate box shadow based on descendant count
  const generateBoxShadow = () => {
    if (!hasChildren || isExpanded || descendantCount === 0) {
      return undefined
    }

    const shadows = ['0 1px 3px rgba(0, 0, 0, 0.12)', '0 1px 2px rgba(0, 0, 0, 0.24)']

    // Add a shadow layer for each descendant (up to a reasonable limit)
    const maxVisibleLayers = Math.min(descendantCount, 10) // Cap at 10 for performance
    for (let i = 1; i <= maxVisibleLayers; i++) {
      const offset = i * 2 + (isHovered ? i * 0.5 : 0) // Spread out more on hover
      const opacity = Math.max(0.02, 0.1 - i * 0.01) // More pronounced shadows

      // Add white separator for definition
      shadows.push(`${offset}px ${offset}px 0 -1px rgba(250, 250, 250, 1)`)
      // Add the actual shadow with border-like appearance
      shadows.push(`${offset}px ${offset}px 0 0 rgba(0, 0, 0, ${opacity})`)

      // Add subtle blur for depth
      if (i <= 5) {
        // More blur layers for better depth perception
        shadows.push(`${offset}px ${offset}px ${offset}px 0 rgba(0, 0, 0, ${opacity / 3})`)
      }
    }

    return shadows.join(', ')
  }

  const boxShadowStyle = generateBoxShadow()

  const handleDragStart = (e: React.DragEvent) => {
    if (draggable && onDragStart) {
      onDragStart(e, node)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (draggable && onDragEnd) {
      onDragEnd(e)
    }
  }

  // Touch event handlers for long press
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY }

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true)
      // Trigger context menu
      if (onContextMenu) {
        const mockEvent = {
          preventDefault: () => {},
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as unknown as React.MouseEvent
        onContextMenu(mockEvent, node)
      }
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y)

    // Cancel long press if finger moved too much
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      setIsLongPressing(false)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setIsLongPressing(false)
    touchStartPosRef.current = null
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  // Generate ancestor breadcrumbs
  const renderAncestors = () => {
    if (!showHierarchy || !node.ancestors || node.ancestors.length === 0) return null

    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        {node.ancestors.map((ancestor, index) => (
          <span key={ancestor.id} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-400">/</span>}
            <button
              onClick={e => {
                e.stopPropagation()
                onSelect?.(ancestor.id)
              }}
              className="truncate max-w-[100px] hover:text-gray-700 hover:underline transition-colors"
              title={`Navigate to ${ancestor.data.label}`}
            >
              {ancestor.data.label}
            </button>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn('relative group', className)}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      {...rest}
    >
      <Card
        className={cn(
          'transition-all duration-200 cursor-pointer relative overflow-hidden',
          'hover:shadow-md',
          isSelected && 'ring-2 ring-blue-500',
          isFocused && 'ring-2 ring-purple-500',
          isCompleted && 'opacity-60',
          // Highlight parent when it's focused in accordion view
          isExpanded && focusedChildIndex === -1 && 'ring-2 ring-purple-400 shadow-lg',
          // Long press feedback
          isLongPressing && 'scale-95'
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          boxShadow: isExpanded ? undefined : boxShadowStyle,
          transition: 'all 0.3s ease',
          transform: isExpanded && focusedChildIndex === -1 ? 'scale(1.02)' : 'scale(1)',
        }}
        onClick={() => {
          if (isExpanded) {
            // Focus parent when clicked in expanded state
            setFocusedChildIndex(-1)
          }
          onSelect?.(node.id)
        }}
      >
        <CardContent className="p-3">
          {/* Priority indicator strip */}
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1',
              quadrant === 'do-first' && 'bg-red-500',
              quadrant === 'schedule' && 'bg-blue-500',
              quadrant === 'delegate' && 'bg-yellow-500',
              quadrant === 'eliminate' && 'bg-gray-400'
            )}
          />

          {/* Subtle background tint */}
          <div
            className={cn(
              'absolute inset-0 opacity-5 pointer-events-none',
              quadrant === 'do-first' && 'bg-red-500',
              quadrant === 'schedule' && 'bg-blue-500',
              quadrant === 'delegate' && 'bg-yellow-500',
              quadrant === 'eliminate' && 'bg-gray-400'
            )}
          />

          {/* Ancestors breadcrumb */}
          {renderAncestors()}

          <div className="flex items-start gap-2">
            {/* Expand/Collapse button */}
            {showHierarchy && hasChildren && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  handleToggle()
                }}
                className="mt-0.5 p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Status checkbox */}
            <button
              onClick={e => {
                e.stopPropagation()
                onStatusToggle?.(node.id, !isCompleted)
              }}
              className="mt-0.5 text-gray-500 hover:text-gray-700"
            >
              {isCompleted ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-medium', isCompleted && 'line-through')}>
                  {node.data.label}
                </p>

                {/* Descendant count indicator - only show when collapsed */}
                {hasChildren && !isExpanded && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center',
                      'text-xs font-medium rounded-full',
                      'min-w-[20px] h-5 px-1',
                      'transition-all duration-200',
                      descendantCount <= 2 && 'bg-blue-100 text-blue-700',
                      descendantCount > 2 &&
                        descendantCount <= 5 &&
                        'bg-purple-100 text-purple-700',
                      descendantCount > 5 && 'bg-indigo-100 text-indigo-700'
                    )}
                  >
                    {descendantCount}
                  </span>
                )}

                {/* Focused child breadcrumb - show when collapsed with focused child */}
                {hasChildren && !isExpanded && focusedChild && (
                  <div className="flex items-center gap-1 ml-2">
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleToggle()
                        // Focus on the specific child after expanding
                        setTimeout(() => {
                          onNodeFocus?.(focusedChild.id)
                        }, 100)
                      }}
                      className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded hover:bg-purple-100 transition-colors"
                      title={`Expand to show ${focusedChild.data.label}`}
                    >
                      {focusedChild.data.label}
                    </button>
                  </div>
                )}
              </div>

              {/* Additional metadata */}
              <div className="flex items-center gap-3 mt-1">
                {node.data.category && (
                  <span className="text-xs text-gray-500">{node.data.category}</span>
                )}

                {node.data.importance !== undefined && node.data.urgency !== undefined && (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        quadrant === 'do-first' && 'bg-red-100 text-red-700',
                        quadrant === 'schedule' && 'bg-blue-100 text-blue-700',
                        quadrant === 'delegate' && 'bg-yellow-100 text-yellow-700',
                        quadrant === 'eliminate' && 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {quadrantInfo.icon} {quadrantInfo.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      I: {node.data.importance}, U: {node.data.urgency}
                    </span>
                  </div>
                )}

                {node.data.dueDate && (
                  <span className="text-xs text-gray-500">
                    Due: {new Date(node.data.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Recursive task indicator */}
              {node.data.taskType === 'recurring' && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-blue-600">🔄 Recurring</span>
                </div>
              )}

              {/* Habit streak indicator */}
              {node.data.taskType === 'habit' &&
                node.data.currentStreak &&
                node.data.currentStreak > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-green-600">
                      🔥 {node.data.currentStreak} day streak
                    </span>
                  </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Splay button - only show when collapsed */}
              {showSplayButton && descendantCount > 0 && !isExpanded && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onSplay?.(node)
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-600"
                  title={`View ${descendantCount} cards separately`}
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}

              {/* Context menu button */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  onContextMenu?.(e, node)
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion expansion for children */}
      {showHierarchy && isExpanded && hasChildren && (
        <div className="mt-2 ml-4 space-y-2 animate-accordion-down">
          <div className="border-l-2 border-gray-200 pl-4">
            {node.children?.map((childNode, index) => {
              const isChildFocused = focusedChildIndex === index

              return (
                <div
                  key={childNode.id}
                  className={cn('relative transition-all duration-300', isChildFocused && 'z-10')}
                  style={{
                    transform: isChildFocused ? 'scale(1.02) translateX(4px)' : 'scale(1)',
                    marginTop: index === 0 ? 0 : '8px',
                    marginBottom: isChildFocused ? '8px' : '0',
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    handleChildClick(index)
                  }}
                >
                  <HierarchicalCard
                    node={childNode}
                    isSelected={false}
                    isFocused={false}
                    showHierarchy={showHierarchy}
                    onToggleExpand={onToggleExpand}
                    onSelect={nodeId => {
                      handleChildClick(index)
                      onSelect?.(nodeId)
                    }}
                    onNodeFocus={onNodeFocus}
                    onContextMenu={onContextMenu}
                    onStatusToggle={onStatusToggle}
                    onSplay={onSplay}
                    showSplayButton={showSplayButton}
                    draggable={draggable}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    className={cn(
                      'transition-all duration-200',
                      isChildFocused && 'ring-2 ring-purple-400 shadow-lg'
                    )}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

HierarchicalCard.displayName = 'HierarchicalCard'
