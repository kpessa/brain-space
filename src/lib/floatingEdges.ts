import { Position } from '@xyflow/react'

// returns the position (top, right, bottom or left) based on node positions
function getParams(nodeA: any, nodeB: any): [number, number, Position] {
  const centerA = getNodeCenter(nodeA)
  const centerB = getNodeCenter(nodeB)

  const horizontalDiff = Math.abs(centerA.x - centerB.x)
  const verticalDiff = Math.abs(centerA.y - centerB.y)

  let position: Position

  // when the horizontal difference between the nodes is bigger, we use Position.Left or Position.Right for the handle
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right
  } else {
    // here the vertical difference between the nodes is bigger, so we use Position.Top or Position.Bottom for the handle
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position)
  return [x, y, position]
}

function getHandleCoordsByPosition(node: any, handlePosition: Position) {
  // Try to find handle in handleBounds
  const handleBounds = node.handleBounds ?? node.internals?.handleBounds
  const handle =
    handleBounds?.source?.find((h: any) => h.position === handlePosition) ??
    handleBounds?.target?.find((h: any) => h.position === handlePosition)

  const width = node.measured?.width ?? node.width ?? 200
  const height = node.measured?.height ?? node.height ?? 100
  const x = node.internals?.positionAbsolute?.x ?? node.positionAbsolute?.x ?? node.position?.x ?? 0
  const y = node.internals?.positionAbsolute?.y ?? node.positionAbsolute?.y ?? node.position?.y ?? 0

  if (!handle) {
    // Fallback if handle not found
    let handleX = x
    let handleY = y

    switch (handlePosition) {
      case Position.Left:
        handleX = x
        handleY = y + height / 2
        break
      case Position.Right:
        handleX = x + width
        handleY = y + height / 2
        break
      case Position.Top:
        handleX = x + width / 2
        handleY = y
        break
      case Position.Bottom:
        handleX = x + width / 2
        handleY = y + height
        break
    }

    return [handleX, handleY]
  }

  let offsetX = handle.width / 2
  let offsetY = handle.height / 2

  // this is a tiny detail to make the markerEnd of an edge visible.
  // The handle position that gets calculated has the origin top-left, so depending which side we are using, we add a little offset
  // when the handlePosition is Position.Right for example, we need to add an offset as big as the handle itself in order to get the correct position
  switch (handlePosition) {
    case Position.Left:
      offsetX = 0
      break
    case Position.Right:
      offsetX = handle.width
      break
    case Position.Top:
      offsetY = 0
      break
    case Position.Bottom:
      offsetY = handle.height
      break
  }

  return [x + handle.x + offsetX, y + handle.y + offsetY]
}

function getNodeCenter(node: any) {
  // In React Flow v12 with useInternalNode, position is in internals.positionAbsolute
  const x = node.internals?.positionAbsolute?.x ?? node.positionAbsolute?.x ?? node.position?.x ?? 0
  const y = node.internals?.positionAbsolute?.y ?? node.positionAbsolute?.y ?? node.position?.y ?? 0
  const width = node.measured?.width ?? node.width ?? 200
  const height = node.measured?.height ?? node.height ?? 100

  return {
    x: x + width / 2,
    y: y + height / 2,
  }
}

// Returns the handle ID for a given position
function getHandleId(position: Position, type: 'source' | 'target' = 'target'): string {
  const base = position.toLowerCase()
  return type === 'source' ? `${base}-source` : base
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(source: any, target: any) {
  const [sx, sy, sourcePos] = getParams(source, target)
  const [tx, ty, targetPos] = getParams(target, source)

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
    sourceHandle: getHandleId(sourcePos, 'source'),
    targetHandle: getHandleId(targetPos, 'target'),
  }
}

// Helper to automatically determine edge connection points for new edges
export function getOptimalEdgeConnection(sourceNode: any, targetNode: any) {
  const params = getEdgeParams(sourceNode, targetNode)

  return {
    sourceHandle: params.sourceHandle,
    targetHandle: params.targetHandle,
    type: 'floating',
    animated: true,
  }
}
