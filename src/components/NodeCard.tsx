import type { Node } from '@/types'
import {
  Calendar,
  Clock,
  Tag,
  MoreVertical,
  CheckCircle2,
  Circle,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  Target,
  Brain,
  Hash,
  Repeat,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { getNodeDisplayTitle, getEisenhowerQuadrant, resolveRelativeDate } from '@/lib/nodeHelpers'
import { format, formatDistanceToNow, isAfter, isBefore, startOfToday } from 'date-fns'

interface NodeCardProps {
  node: Node
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  viewMode?: 'list' | 'grid'
  className?: string
}

const typeIcons = {
  task: Target,
  idea: Lightbulb,
  question: HelpCircle,
  problem: AlertCircle,
  insight: Brain,
  thought: Hash,
}

const typeColors = {
  task: 'text-blue-600 bg-blue-50',
  idea: 'text-yellow-600 bg-yellow-50',
  question: 'text-purple-600 bg-purple-50',
  problem: 'text-red-600 bg-red-50',
  insight: 'text-green-600 bg-green-50',
  thought: 'text-gray-600 bg-gray-50',
}

export function NodeCard({
  node,
  onClick,
  onEdit,
  onDelete,
  viewMode = 'list',
  className,
}: NodeCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const Icon = typeIcons[node.type as keyof typeof typeIcons] || Hash
  const colorClass = typeColors[node.type as keyof typeof typeColors] || 'text-gray-600 bg-gray-50'

  // Calculate display values
  const title = getNodeDisplayTitle(node)
  const quadrant = getEisenhowerQuadrant(node.urgency, node.importance)

  // Format due date if present
  let dueDateDisplay = null
  let isOverdue = false
  if (node.dueDate) {
    const dueDate =
      node.dueDate.type === 'exact'
        ? new Date(node.dueDate.date)
        : resolveRelativeDate(node.dueDate)

    const today = startOfToday()
    isOverdue = !node.completed && isBefore(dueDate, today)

    if (isAfter(dueDate, today)) {
      dueDateDisplay = formatDistanceToNow(dueDate, { addSuffix: true })
    } else {
      dueDateDisplay = format(dueDate, 'MMM d, yyyy')
    }
  }

  // Handle clicks outside menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onEdit?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete?.()
  }

  const urgencyImportanceDisplay = (node.urgency || node.importance) && (
    <div className="flex gap-3 text-xs">
      {node.urgency && (
        <span className="text-gray-500">
          Urgency: <span className="font-medium">{node.urgency}/10</span>
        </span>
      )}
      {node.importance && (
        <span className="text-gray-500">
          Importance: <span className="font-medium">{node.importance}/10</span>
        </span>
      )}
      {node.priority && (
        <span className="text-gray-500">
          Priority: <span className="font-medium">{node.priority.toFixed(1)}</span>
        </span>
      )}
    </div>
  )

  if (viewMode === 'grid') {
    return (
      <div
        className={cn(
          'bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative',
          node.completed && 'opacity-60',
          className
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2 rounded-lg', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className={cn('font-medium text-gray-900 mb-2', node.completed && 'line-through')}>
          {title}
        </h3>

        {/* Description */}
        {node.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{node.description}</p>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          {dueDateDisplay && (
            <div
              className={cn(
                'flex items-center gap-2 text-xs',
                isOverdue ? 'text-red-600' : 'text-gray-500'
              )}
            >
              <Calendar className="w-3 h-3" />
              {dueDateDisplay}
            </div>
          )}

          {urgencyImportanceDisplay}

          {node.tags && node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {node.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
              {node.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{node.tags.length - 3}</span>
              )}
            </div>
          )}

          {node.recurrence && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Repeat className="w-3 h-3" />
              Recurring
            </div>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative',
        node.completed && 'opacity-60',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={e => {
            e.stopPropagation()
            // TODO: Handle completion toggle
          }}
          className="mt-0.5"
        >
          {node.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>

        {/* Icon */}
        <div className={cn('p-1.5 rounded-lg', colorClass)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn('font-medium text-gray-900', node.completed && 'line-through')}>
              {title}
            </h3>
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={handleEdit}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {node.description && <p className="text-sm text-gray-600 mt-1">{node.description}</p>}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {dueDateDisplay && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdue ? 'text-red-600' : 'text-gray-500'
                )}
              >
                <Calendar className="w-3 h-3" />
                {dueDateDisplay}
              </div>
            )}

            {urgencyImportanceDisplay}

            {node.tags && node.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {node.tags.slice(0, 2).join(', ')}
                  {node.tags.length > 2 && ` +${node.tags.length - 2}`}
                </span>
              </div>
            )}

            {node.recurrence && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Repeat className="w-3 h-3" />
                Recurring
              </div>
            )}

            {node.createdAt && (
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(node.createdAt), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
