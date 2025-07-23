import { useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeResizer } from '@xyflow/react'
import { Brain, Edit2, Check, X, Plus } from 'lucide-react'
import { useBrainDumpStore } from '../../store/braindump'
import { calculateNodeDimensions } from '../../lib/textMeasurement'

export function RootNode({ id, data, selected }: { id: string; data: any; selected?: boolean }) {
  const { updateNode } = useBrainDumpStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(data.label)
  const layoutMode = data.layoutMode || 'freeform'
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleSave = () => {
    updateNode(id, { label: editText })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(data.label)
    setIsEditing(false)
  }

  const handleAddChild = () => {
    // Emit a custom event that BrainDumpFlow can listen to
    const event = new CustomEvent('node:addChild', { detail: { nodeId: id } })
    window.dispatchEvent(event)
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Check if click is on a resize handle
    const target = e.target as HTMLElement
    if (target.closest('.react-flow__resize-control')) {
      // Don't trigger edit mode if clicking on resize handle
      return
    }

    setIsEditing(true)
  }

  const handleResizerDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Calculate optimal dimensions based on content
    const dimensions = calculateNodeDimensions(data.label, 'root', {
      hasIcon: true, // Root nodes have brain icon or custom icon
      hasChildren: false,
      hasControls: false,
      minWidth: 150,
      minHeight: 40,
      maxWidth: 400,
    })

    // Update dimensions - removing width/height as they're not part of BrainDumpNode data type
    // updateNode(id, {
    //   width: dimensions.width,
    //   height: dimensions.height,
    // })
  }

  // Add double-click handlers to resize controls
  useEffect(() => {
    if (!nodeRef.current || !selected) return

    const resizeControls = nodeRef.current.querySelectorAll('.react-flow__resize-control')

    const handleResizeDoubleClick = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
      handleResizerDoubleClick(e as any)
    }

    resizeControls.forEach(control => {
      control.addEventListener('dblclick', handleResizeDoubleClick)
    })

    return () => {
      resizeControls.forEach(control => {
        control.removeEventListener('dblclick', handleResizeDoubleClick)
      })
    }
  }, [selected, data.label, handleResizerDoubleClick])

  return (
    <div className="relative group/wrapper" ref={nodeRef}>
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={40}
        onResizeEnd={(_, params) => {
          // Width/height not part of BrainDumpNode data type
          // updateNode(id, {
          //   width: params.width,
          //   height: params.height,
          // })
        }}
        handleStyle={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#8b5cf6',
          border: '2px solid white',
          cursor: 'pointer',
        }}
        lineStyle={{
          borderColor: '#8b5cf6',
          borderWidth: '1px',
        }}
      />
      <div
        className={`px-4 py-2 shadow-lg rounded-lg ${!useCustomStyle ? 'bg-gradient-to-br from-brain-500 to-space-500 text-white border-brain-600' : ''} border-2 group/node`}
        style={customStyle}
        onDoubleClick={handleDoubleClick}
        title="Double-click to edit"
      >
        {/* Handles - 4 total (1 per side) */}
        {/* All handles are type="source" for bidirectional connections */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="w-3 h-3 !bg-purple-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          className="w-3 h-3 !bg-purple-400 opacity-0"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className="w-3 h-3 !bg-purple-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className="w-3 h-3 !bg-purple-400 opacity-0"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className="w-3 h-3 !bg-purple-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          className="w-3 h-3 !bg-purple-400 opacity-0"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-3 h-3 !bg-purple-400 opacity-60 group-hover/node:opacity-100 hover:!opacity-100 transition-opacity border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          className="w-3 h-3 !bg-purple-400 opacity-0"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />

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
          <div className="flex items-center gap-2">
            {data.style?.icon ? (
              <span className="text-xl">{data.style.icon}</span>
            ) : (
              <Brain className="w-5 h-5" />
            )}
            <div className="font-bold">{data.label}</div>
          </div>
        )}
      </div>

      {/* Edit/Add Child buttons positioned outside the node */}
      {!isEditing && (
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover/wrapper:opacity-100 transition-opacity z-20">
          <button
            onClick={handleAddChild}
            className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-green-100 hover:border-green-300 transition-colors"
            title="Add child node"
          >
            <Plus className="w-3 h-3 text-green-600" />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100 transition-colors"
            title="Edit root node name"
          >
            <Edit2 className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  )
}
