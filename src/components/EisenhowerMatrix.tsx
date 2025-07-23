import { useEffect, useRef, useState } from 'react'
import type { Node, Edge } from '@xyflow/react'
import {
  getQuadrant,
  getQuadrantInfo,
  getPositionInQuadrant,
  logToLinear,
} from '../lib/priorityUtils'
import { getDueDateDescription, isOverdue } from '../lib/dateUtils'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface EisenhowerMatrixProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
  onNodeDragEnd?: (nodeId: string, importance: number, urgency: number) => void
  onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void
  selectedNodes?: string[]
}

interface MatrixNode {
  id: string
  label: string
  importance: number
  urgency: number
  x: number
  y: number
  isDragging?: boolean
  style?: any
}

const MATRIX_SIZE = 600 // Size of the matrix square
const MARGIN = 50
const NODE_SIZE = 40
const GRID_PADDING = 20

export function EisenhowerMatrix({
  nodes,
  edges,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDragEnd,
  onNodeContextMenu,
  selectedNodes = [],
}: EisenhowerMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Convert React Flow nodes to matrix nodes
  const matrixNodes: MatrixNode[] = nodes
    .filter(node => node.type === 'thought' || node.type === 'category')
    .map(node => {
      const importance = logToLinear(Number(node.data.importance ?? 5))
      const urgency = logToLinear(Number(node.data.urgency ?? 5))

      // Calculate position based on importance/urgency
      const x = MARGIN + (urgency / 10) * MATRIX_SIZE
      const y = MARGIN + MATRIX_SIZE - (importance / 10) * MATRIX_SIZE // Invert Y so high importance is at top

      return {
        id: node.id,
        label: String(node.data.label || ''),
        importance,
        urgency,
        x,
        y,
        style: node.data.style,
      }
    })

  // Draw the matrix
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context state
    ctx.save()

    // Apply transformations
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Draw grid background
    ctx.fillStyle = '#f9fafb'
    ctx.fillRect(MARGIN, MARGIN, MATRIX_SIZE, MATRIX_SIZE)

    // Draw quadrant backgrounds
    // Note: y is inverted in canvas (0 is top), but we've already inverted importance in node positioning
    const quadrants = [
      { x: 0, y: 1, quadrant: 'eliminate' }, // bottom-left (low importance, low urgency)
      { x: 1, y: 1, quadrant: 'delegate' }, // bottom-right (low importance, high urgency)
      { x: 0, y: 0, quadrant: 'schedule' }, // top-left (high importance, low urgency)
      { x: 1, y: 0, quadrant: 'do-first' }, // top-right (high importance, high urgency)
    ]

    quadrants.forEach(({ x, y, quadrant }) => {
      const info = getQuadrantInfo(quadrant)
      const qx = MARGIN + x * (MATRIX_SIZE / 2)
      const qy = MARGIN + y * (MATRIX_SIZE / 2)

      // Draw quadrant background
      ctx.fillStyle = info.color.includes('gray')
        ? '#f3f4f6'
        : info.color.includes('red')
          ? '#fee2e2'
          : info.color.includes('blue')
            ? '#dbeafe'
            : info.color.includes('yellow')
              ? '#fef3c7'
              : '#f3f4f6'
      ctx.fillRect(qx, qy, MATRIX_SIZE / 2, MATRIX_SIZE / 2)

      // Draw quadrant label
      ctx.fillStyle = '#374151'
      ctx.font = 'bold 16px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${info.icon} ${info.label}`, qx + MATRIX_SIZE / 4, qy + 20)

      // Draw description
      ctx.font = '12px Inter'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(info.description, qx + MATRIX_SIZE / 4, qy + 40)
    })

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])

    // Vertical center line
    ctx.beginPath()
    ctx.moveTo(MARGIN + MATRIX_SIZE / 2, MARGIN)
    ctx.lineTo(MARGIN + MATRIX_SIZE / 2, MARGIN + MATRIX_SIZE)
    ctx.stroke()

    // Horizontal center line
    ctx.beginPath()
    ctx.moveTo(MARGIN, MARGIN + MATRIX_SIZE / 2)
    ctx.lineTo(MARGIN + MATRIX_SIZE, MARGIN + MATRIX_SIZE / 2)
    ctx.stroke()

    ctx.setLineDash([])

    // Draw border
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 2
    ctx.strokeRect(MARGIN, MARGIN, MATRIX_SIZE, MATRIX_SIZE)

    // Draw axis labels
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 14px Inter'

    // X-axis (Urgency)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('Low Urgency', MARGIN + MATRIX_SIZE / 4, MARGIN + MATRIX_SIZE + 10)
    ctx.fillText('High Urgency', MARGIN + (3 * MATRIX_SIZE) / 4, MARGIN + MATRIX_SIZE + 10)
    ctx.fillText('→ URGENCY →', MARGIN + MATRIX_SIZE / 2, MARGIN + MATRIX_SIZE + 30)

    // Y-axis (Importance)
    ctx.save()
    ctx.translate(MARGIN - 30, MARGIN + MATRIX_SIZE / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('→ IMPORTANCE →', 0, 0)
    ctx.restore()

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText('Low', MARGIN - 10, MARGIN + (3 * MATRIX_SIZE) / 4)
    ctx.fillText('High', MARGIN - 10, MARGIN + MATRIX_SIZE / 4)

    // Draw nodes
    matrixNodes.forEach(node => {
      const isSelected = selectedNodes.includes(node.id)
      const isDraggingThis = draggedNode === node.id

      // Node position (adjust if dragging)
      let nodeX = node.x
      let nodeY = node.y

      if (isDraggingThis) {
        // Calculate position based on mouse
        const rect = canvas.getBoundingClientRect()
        const canvasX = (mousePos.x - rect.left - offset.x) / scale
        const canvasY = (mousePos.y - rect.top - offset.y) / scale

        // Constrain to matrix bounds
        nodeX = Math.max(
          MARGIN + NODE_SIZE / 2,
          Math.min(MARGIN + MATRIX_SIZE - NODE_SIZE / 2, canvasX)
        )
        nodeY = Math.max(
          MARGIN + NODE_SIZE / 2,
          Math.min(MARGIN + MATRIX_SIZE - NODE_SIZE / 2, canvasY)
        )
      }

      // Draw node shadow
      if (isDraggingThis) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 5
      }

      // Draw node background
      ctx.fillStyle = node.style?.backgroundColor || '#ffffff'
      ctx.strokeStyle = isSelected ? '#3b82f6' : node.style?.borderColor || '#d1d5db'
      ctx.lineWidth = isSelected ? 3 : 2

      ctx.beginPath()
      ctx.arc(nodeX, nodeY, NODE_SIZE / 2, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Draw icon if available
      if (node.style?.icon) {
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.style.icon, nodeX, nodeY)
      } else {
        // Draw label (truncated)
        ctx.fillStyle = node.style?.textColor || '#111827'
        ctx.font = '10px Inter'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const maxWidth = NODE_SIZE - 4
        let text = node.label
        if (ctx.measureText(text).width > maxWidth) {
          while (text.length > 0 && ctx.measureText(`${text}...`).width > maxWidth) {
            text = text.slice(0, -1)
          }
          text += '...'
        }
        ctx.fillText(text, nodeX, nodeY)
      }

      // Draw due date indicator if present
      const nodeData = nodes.find(n => n.id === node.id)?.data
      if (nodeData?.dueDate) {
        const dueDesc = getDueDateDescription(String(nodeData.dueDate))
        const overdue = isOverdue(String(nodeData.dueDate))

        // Draw due date badge below node
        ctx.font = '8px Inter'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        // Background for due date
        const textWidth = ctx.measureText(dueDesc).width + 8
        const badgeY = nodeY + NODE_SIZE / 2 + 4

        ctx.fillStyle = overdue ? '#fee2e2' : '#f3f4f6'
        ctx.strokeStyle = overdue ? '#ef4444' : '#9ca3af'
        ctx.lineWidth = 1

        ctx.beginPath()
        // Use roundRect if available, otherwise fallback to regular rect
        if (ctx.roundRect) {
          ctx.roundRect(nodeX - textWidth / 2, badgeY, textWidth, 14, 7)
        } else {
          ctx.rect(nodeX - textWidth / 2, badgeY, textWidth, 14)
        }
        ctx.fill()
        ctx.stroke()

        // Text for due date
        ctx.fillStyle = overdue ? '#dc2626' : '#4b5563'
        ctx.fillText(dueDesc, nodeX, badgeY + 3)
      }
    })

    // Restore context state
    ctx.restore()
  }, [matrixNodes, selectedNodes, scale, offset, draggedNode, mousePos])

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore right clicks
    if (e.button === 2) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - offset.x) / scale
    const y = (e.clientY - rect.top - offset.y) / scale

    // Check if clicking on a node
    const clickedNode = matrixNodes.find(node => {
      const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2))
      return dist <= NODE_SIZE / 2
    })

    if (clickedNode) {
      setDraggedNode(clickedNode.id)
      onNodeClick?.(clickedNode.id)
    } else {
      // Start panning
      setIsDragging(true)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - offset.x) / scale
    const y = (e.clientY - rect.top - offset.y) / scale

    // Check if right-clicking on a node
    const clickedNode = matrixNodes.find(node => {
      const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2))
      return dist <= NODE_SIZE / 2
    })

    if (clickedNode) {
      onNodeContextMenu?.(clickedNode.id, { x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })

    if (isDragging) {
      setOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }))
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedNode) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - offset.x) / scale
      const y = (e.clientY - rect.top - offset.y) / scale

      // Constrain to matrix bounds
      const nodeX = Math.max(MARGIN, Math.min(MARGIN + MATRIX_SIZE, x))
      const nodeY = Math.max(MARGIN, Math.min(MARGIN + MATRIX_SIZE, y))

      // Convert position to importance/urgency values
      const urgency = ((nodeX - MARGIN) / MATRIX_SIZE) * 10
      const importance = ((MARGIN + MATRIX_SIZE - nodeY) / MATRIX_SIZE) * 10

      onNodeDragEnd?.(draggedNode, importance, urgency)
    }

    setIsDragging(false)
    setDraggedNode(null)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - offset.x) / scale
    const y = (e.clientY - rect.top - offset.y) / scale

    // Check if double-clicking on a node
    const clickedNode = matrixNodes.find(node => {
      const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2))
      return dist <= NODE_SIZE / 2
    })

    if (clickedNode) {
      onNodeDoubleClick?.(clickedNode.id)
    }
  }

  // Zoom controls
  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)))
  }

  const handleFit = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-50 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false)
          setDraggedNode(null)
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{
          cursor: draggedNode ? 'grabbing' : isDragging ? 'grabbing' : 'grab',
        }}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
          title="Fit to view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-4 max-w-xs">
        <h3 className="font-semibold text-sm mb-2">Eisenhower Matrix</h3>
        <p className="text-xs text-gray-600 mb-3">
          Organize tasks by importance and urgency. Drag nodes to reposition them.
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Do First - Important & Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Schedule - Important, Not Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Delegate - Urgent, Not Important</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Eliminate - Not Important or Urgent</span>
          </div>
        </div>
      </div>
    </div>
  )
}
