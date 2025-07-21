import { useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { ChevronDown, ChevronRight, Target, Edit2, Trash2, Check, X, Plus } from 'lucide-react'
import { useBrainDumpStore } from '../../store/braindump'
import { useNavigate } from 'react-router-dom'
import { calculateNodeDimensions } from '../../lib/textMeasurement'

const categoryIcons: Record<string, any> = {
  ideas: '💡',
  tasks: '✅',
  questions: '❓',
  insights: '🔍',
  problems: '⚠️',
  misc: '📌',
}

const categoryColors: Record<string, string> = {
  ideas: 'from-blue-400 to-blue-600',
  tasks: 'from-green-400 to-green-600',
  questions: 'from-amber-400 to-amber-600',
  insights: 'from-purple-400 to-purple-600',
  problems: 'from-red-400 to-red-600',
  misc: 'from-gray-400 to-gray-600',
}

export function CategoryNode({
  id,
  data,
  selected,
}: {
  id: string
  data: any
  selected?: boolean
}) {
  const navigate = useNavigate()
  const { toggleNodeCollapse, entries, setCurrentEntry, updateNode, deleteNode } =
    useBrainDumpStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(data.label)
  const isCollapsed = data.isCollapsed || false
  const category = data.category || 'misc'
  const icon = categoryIcons[category] || '📁'
  const colorClass = categoryColors[category] || categoryColors.misc
  const layoutMode = data.layoutMode || 'freeform'
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    toggleNodeCollapse(id)
  }

  const handleSave = () => {
    updateNode(id, { label: editText })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(data.label)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this category? All child nodes will also be deleted.'
      )
    ) {
      deleteNode(id)
    }
  }

  const handleAddChild = () => {
    // Emit a custom event that BrainDumpFlow can listen to
    const event = new CustomEvent('node:addChild', { detail: { nodeId: id } })
    window.dispatchEvent(event)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Check if click is on a resize handle
    const target = e.target as HTMLElement
    if (target.closest('.react-flow__resize-control')) {
      // Don't trigger edit mode if clicking on resize handle
      return
    }

    // If has topic brain dump, navigate to it
    if (data.hasTopicBrainDump && data.topicBrainDumpId) {
      const topicEntry = entries.find(e => e.id === data.topicBrainDumpId)
      if (topicEntry) {
        setCurrentEntry(topicEntry)
        navigate('/braindump')
        return
      }
    }

    // Otherwise, enter edit mode
    setIsEditing(true)
  }

  // Apply custom styles if they exist
  const customStyle = data.style
    ? {
        backgroundColor: data.style.backgroundColor,
        borderColor: data.style.borderColor,
        color: data.style.textColor,
        borderStyle: data.style.borderStyle as any,
        borderWidth: data.style.borderWidth ? `${data.style.borderWidth}px` : undefined,
      }
    : {}

  const useCustomStyle = !!data.style?.backgroundColor

  const handleResizerDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Calculate optimal dimensions based on content
    const dimensions = calculateNodeDimensions(data.label, 'category', {
      hasIcon: true, // Categories always have icons
      hasChildren: data.children && data.children.length > 0,
      hasControls: true, // Has collapse/expand chevron
      minWidth: 150,
      minHeight: 40,
      maxWidth: 400,
    })

    // Update dimensions
    updateNode(id, {
      width: dimensions.width,
      height: dimensions.height,
    })
  }

  // Add double-click handlers to resize controls
  useEffect(() => {
    if (!nodeRef.current || !selected) return

    const resizeControls = nodeRef.current.querySelectorAll('.react-flow__resize-control')

    const handleDoubleClick = (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      handleResizerDoubleClick(e as any)
    }

    resizeControls.forEach(control => {
      control.addEventListener('dblclick', handleDoubleClick)
    })

    return () => {
      resizeControls.forEach(control => {
        control.removeEventListener('dblclick', handleDoubleClick)
      })
    }
  }, [selected, data.label, data.children, handleResizerDoubleClick])

  return (
    <div className="relative group/wrapper" ref={nodeRef}>
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={40}
        onResizeEnd={(_, params) => {
          updateNode(id, {
            width: params.width,
            height: params.height,
          })
        }}
        handleStyle={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          cursor: 'pointer',
        }}
        lineStyle={{
          borderColor: '#3b82f6',
          borderWidth: '1px',
        }}
      />
      <div
        className={`px-4 py-2 shadow-lg rounded-lg ${!useCustomStyle ? `bg-gradient-to-br ${colorClass} text-white` : ''} border-2 ${!useCustomStyle ? 'border-white/20' : ''} cursor-pointer select-none group/node relative`}
        style={customStyle}
        title={
          data.hasTopicBrainDump ? 'Double-click to open topic brain dump' : 'Double-click to edit'
        }
        onDoubleClick={handleDoubleClick}
      >
        {/* Handles - 4 total (1 per side) */}
        {/* All handles are type="source" for bidirectional connections */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="w-3 h-3 !bg-blue-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          className="w-3 h-3 !bg-blue-400 opacity-0"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className="w-3 h-3 !bg-blue-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className="w-3 h-3 !bg-blue-400 opacity-0"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className="w-3 h-3 !bg-blue-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          className="w-3 h-3 !bg-blue-400 opacity-0"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-3 h-3 !bg-blue-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          className="w-3 h-3 !bg-blue-400 opacity-0"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />

        {/* Topic brain dump indicator - positioned on left to avoid clash with edit/delete */}
        {data.hasTopicBrainDump && (
          <div
            className="absolute -top-2 -left-2 bg-brain-600 rounded-full p-1 shadow-sm z-10"
            title="Has topic brain dump - double click to open"
          >
            <Target className="w-3 h-3 text-white" />
          </div>
        )}

        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full p-1 text-sm rounded border border-gray-300 text-gray-900"
              autoFocus
              onFocus={e => e.target.select()}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
            <div className="flex gap-1 justify-end">
              <button
                onClick={handleSave}
                className="p-1 hover:bg-green-200 rounded transition-colors"
              >
                <Check className="w-3 h-3 text-green-600" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-red-200 rounded transition-colors"
              >
                <X className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="group">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggle}
                className="hover:bg-white/20 rounded p-0.5 transition-all duration-200"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                )}
              </button>
              <span className="text-lg">{data.style?.icon || icon}</span>
              <div className="font-semibold">{data.label}</div>
              {data.children && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {data.children.length}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit/Delete/Add Child buttons positioned outside the node */}
      {!isEditing && (
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover/wrapper:opacity-100 transition-opacity z-20">
          {!data.hasTopicBrainDump && (
            <button
              onClick={handleAddChild}
              className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-green-100 hover:border-green-300 transition-colors"
              title="Add child node"
            >
              <Plus className="w-3 h-3 text-green-600" />
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100 transition-colors"
            title="Edit category name"
          >
            <Edit2 className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-red-100 hover:border-red-300 transition-colors"
            title="Delete category"
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </button>
        </div>
      )}
    </div>
  )
}
