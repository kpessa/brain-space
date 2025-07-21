import { useRef, type PointerEvent } from 'react'
import { useReactFlow, useStore } from '@xyflow/react'
import { getSvgPathFromStroke } from '../lib/lassoUtils'

type NodePoints = ([number, number] | [number, number, number])[]
type NodePointObject = Record<string, NodePoints>

interface LassoProps {
  partial: boolean
  isActive: boolean
  onSelectionComplete?: () => void
}

export function Lasso({ partial, isActive, onSelectionComplete }: LassoProps) {
  const { flowToScreenPosition, setNodes } = useReactFlow()
  const { width, height, nodeLookup } = useStore(state => ({
    width: state.width,
    height: state.height,
    nodeLookup: state.nodeLookup,
  }))
  const canvas = useRef<HTMLCanvasElement>(null)
  const ctx = useRef<CanvasRenderingContext2D | undefined | null>(null)

  const nodePoints = useRef<NodePointObject>({})
  const pointRef = useRef<[number, number][]>([])
  const isDrawing = useRef(false)

  function handlePointerDown(e: PointerEvent) {
    if (!isActive) return

    isDrawing.current = true
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    const points = pointRef.current

    const nextPoints = [...points, [e.pageX, e.pageY]] satisfies [number, number][]
    pointRef.current = nextPoints

    nodePoints.current = {}
    for (const node of nodeLookup.values()) {
      const { x, y } = node.internals.positionAbsolute
      const { width = 0, height = 0 } = node.measured
      const points = [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height],
      ] satisfies NodePoints
      nodePoints.current[node.id] = points
    }

    ctx.current = canvas.current?.getContext('2d')
    if (!ctx.current) return
    ctx.current.lineWidth = 2
    ctx.current.fillStyle = 'rgba(139, 92, 246, 0.1)' // Purple fill matching brain-space theme
    ctx.current.strokeStyle = 'rgba(139, 92, 246, 0.8)' // Purple stroke
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isActive || !isDrawing.current || e.buttons !== 1) return

    const points = pointRef.current
    const nextPoints = [...points, [e.pageX, e.pageY]] satisfies [number, number][]
    pointRef.current = nextPoints

    const path = new Path2D(getSvgPathFromStroke(nextPoints))

    if (!ctx.current) return
    ctx.current.clearRect(0, 0, width, height)
    ctx.current.fill(path)
    ctx.current.stroke(path)

    const nodesToSelect = new Set<string>()

    for (const [nodeId, points] of Object.entries(nodePoints.current)) {
      if (partial) {
        // Partial selection: select node if any point is in the path
        for (const point of points) {
          const { x, y } = flowToScreenPosition({ x: point[0], y: point[1] })
          if (ctx.current.isPointInPath(path, x, y)) {
            nodesToSelect.add(nodeId)
            break
          }
        }
      } else {
        // Full selection: select node only if all points are in the path
        let allPointsInPath = true
        for (const point of points) {
          const { x, y } = flowToScreenPosition({ x: point[0], y: point[1] })
          if (!ctx.current.isPointInPath(path, x, y)) {
            allPointsInPath = false
            break
          }
        }
        if (allPointsInPath) {
          nodesToSelect.add(nodeId)
        }
      }
    }

    setNodes(nodes =>
      nodes.map(node => ({
        ...node,
        selected: nodesToSelect.has(node.id),
      }))
    )
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isActive || !isDrawing.current) return

    isDrawing.current = false
    ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
    pointRef.current = []
    if (ctx.current) {
      ctx.current.clearRect(0, 0, width, height)
    }

    if (onSelectionComplete) {
      onSelectionComplete()
    }
  }

  if (!isActive) return null

  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      className="absolute inset-0 z-[100] pointer-events-auto touch-none"
      style={{ cursor: 'crosshair' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  )
}
