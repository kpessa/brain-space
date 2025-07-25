import { useState, useMemo } from 'react'
import type { Node } from '@/types'
import { NodeCard } from './NodeCard'
import { Input } from './Input'
import { Button } from './Button'
import { Search, Filter, SortAsc, SortDesc, Grid3X3, List } from 'lucide-react'
import { nodeMatchesSearch, getEisenhowerQuadrant } from '@/lib/nodeHelpers'
import { cn } from '@/lib/utils'

interface NodeListProps {
  nodes: Node[]
  onNodeClick?: (node: Node) => void
  onNodeEdit?: (node: Node) => void
  onNodeDelete?: (nodeId: string) => void
  className?: string
  emptyMessage?: string
  showFilters?: boolean
  viewMode?: 'list' | 'grid'
}

type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'urgency' | 'importance' | 'title'
type SortOrder = 'asc' | 'desc'
type FilterType = 'all' | 'task' | 'idea' | 'question' | 'problem' | 'insight' | 'thought'

export function NodeList({
  nodes,
  onNodeClick,
  onNodeEdit,
  onNodeDelete,
  className,
  emptyMessage = 'No nodes found',
  showFilters = true,
  viewMode: defaultViewMode = 'list',
}: NodeListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(defaultViewMode)
  const [showCompleted, setShowCompleted] = useState(true)

  // Filter and sort nodes
  const filteredAndSortedNodes = useMemo(() => {
    let filtered = nodes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(node => nodeMatchesSearch(node, searchTerm))
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(node => node.type === filterType)
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(node => !node.completed)
    }

    // Sort nodes
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField as keyof Node]
      let bValue: any = b[sortField as keyof Node]

      // Handle undefined values
      if (aValue === undefined) aValue = ''
      if (bValue === undefined) bValue = ''

      // Convert dates to timestamps for comparison
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted
  }, [nodes, searchTerm, filterType, sortField, sortOrder, showCompleted])

  const typeFilters: { value: FilterType; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'text-gray-700' },
    { value: 'task', label: 'Tasks', color: 'text-blue-600' },
    { value: 'idea', label: 'Ideas', color: 'text-yellow-600' },
    { value: 'question', label: 'Questions', color: 'text-purple-600' },
    { value: 'problem', label: 'Problems', color: 'text-red-600' },
    { value: 'insight', label: 'Insights', color: 'text-green-600' },
    { value: 'thought', label: 'Thoughts', color: 'text-gray-600' },
  ]

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'createdAt', label: 'Created' },
    { value: 'updatedAt', label: 'Updated' },
    { value: 'priority', label: 'Priority' },
    { value: 'urgency', label: 'Urgency' },
    { value: 'importance', label: 'Importance' },
    { value: 'title', label: 'Title' },
  ]

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1">
                {typeFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterType(filter.value)}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                      filterType === filter.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as SortField)}
                className="px-3 py-1 rounded-lg border border-gray-300 text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded hover:bg-gray-100"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded',
                  viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded',
                  viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Completed Toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={e => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show completed
            </label>
          </div>
        </div>
      )}

      {/* Nodes List/Grid */}
      {filteredAndSortedNodes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{emptyMessage}</div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          )}
        >
          {filteredAndSortedNodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              onClick={() => onNodeClick?.(node)}
              onEdit={() => onNodeEdit?.(node)}
              onDelete={() => onNodeDelete?.(node.id)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {nodes.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredAndSortedNodes.length} of {nodes.length} nodes
        </div>
      )}
    </div>
  )
}
