import { useState, useEffect, useRef } from 'react'
import { Edit3, Trash2, Tag, X } from 'lucide-react'
import type { Edge } from '@xyflow/react'

interface EdgeClickMenuProps {
  edge: Edge | null
  position: { x: number; y: number }
  isVisible: boolean
  onLabel: (edgeId: string, label: string) => void
  onDelete: (edge: Edge) => void
  onClose: () => void
}

export function EdgeClickMenu({
  edge,
  position,
  isVisible,
  onLabel,
  onDelete,
  onClose,
}: EdgeClickMenuProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelValue, setLabelValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (edge) {
      setLabelValue(edge.label || '')
    }
  }, [edge])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  if (!isVisible || !edge) return null

  const handleLabelSubmit = () => {
    onLabel(edge.id, labelValue)
    setIsEditingLabel(false)
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit()
    } else if (e.key === 'Escape') {
      setLabelValue(edge.label || '')
      setIsEditingLabel(false)
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-48"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translate(0, -100%)', // Position just above and to the right of cursor
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-500">
          Edge: {edge.source} → {edge.target}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* Label Section */}
      <div className="mb-2">
        {isEditingLabel ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={labelValue}
              onChange={e => setLabelValue(e.target.value)}
              onKeyDown={handleLabelKeyDown}
              onBlur={handleLabelSubmit}
              placeholder="Enter edge label..."
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setIsEditingLabel(true)}
            className="flex items-center gap-2 w-full p-2 text-xs hover:bg-gray-50 rounded transition-colors text-left"
          >
            <Tag className="w-3 h-3 text-gray-500" />
            <span className="flex-1">{edge.label ? `Label: "${edge.label}"` : 'Add label...'}</span>
            <Edit3 className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-1">
        <div className="border-t border-gray-100 pt-2">
          <button
            onClick={() => onDelete(edge)}
            className="flex items-center gap-2 w-full p-2 text-xs hover:bg-red-50 hover:text-red-700 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete edge</span>
          </button>
        </div>
      </div>
    </div>
  )
}
