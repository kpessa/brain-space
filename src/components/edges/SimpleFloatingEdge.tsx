import { getBezierPath, useInternalNode } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

import { getEdgeParams } from '../../lib/floatingEdges'

function SimpleFloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) {
    return null
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  })

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      strokeWidth={2}
      markerEnd={markerEnd}
      style={style}
    />
  )
}

export default SimpleFloatingEdge
