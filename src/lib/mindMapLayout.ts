import type { Node, Edge } from '@xyflow/react'
import type { BrainDumpNode } from '../types/braindump'

interface LayoutOptions {
  nodeWidth: number
  nodeHeight: number
  horizontalSpacing: number
  verticalSpacing: number
}

const DEFAULT_OPTIONS: LayoutOptions = {
  nodeWidth: 250,
  nodeHeight: 80,
  horizontalSpacing: 200,
  verticalSpacing: 100,
}

export function calculateHorizontalLayout(
  nodes: BrainDumpNode[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): BrainDumpNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Create adjacency list for tree structure
  const childrenMap = new Map<string, string[]>()
  const parentMap = new Map<string, string>()

  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, [])
    }
    childrenMap.get(edge.source)!.push(edge.target)
    parentMap.set(edge.target, edge.source)
  })

  // Find root node (node with no parent)
  const rootNode = nodes.find(node => node.type === 'root' || !parentMap.has(node.id))

  if (!rootNode) {
    console.warn('No root node found, returning original nodes')
    return nodes
  }

  // Track vertical positions for each level
  const levelYPositions = new Map<number, number>()
  const nodePositions = new Map<string, { x: number; y: number }>()

  // Calculate positions recursively
  function calculateNodePositions(nodeId: string, level: number, parentY: number): number {
    const children = childrenMap.get(nodeId) || []

    if (children.length === 0) {
      // Leaf node - position at next available Y for this level
      const currentY = levelYPositions.get(level) || parentY
      levelYPositions.set(level, currentY + opts.verticalSpacing)

      nodePositions.set(nodeId, {
        x: level * opts.horizontalSpacing,
        y: currentY,
      })

      return currentY
    }

    // Non-leaf node - position children first
    let totalChildrenHeight = 0
    const childYPositions: number[] = []

    children.forEach((childId, index) => {
      const childY = calculateNodePositions(childId, level + 1, parentY + totalChildrenHeight)
      childYPositions.push(childY)

      // Get the max Y position used by this child's subtree
      const childSubtreeHeight = getSubtreeHeight(
        childId,
        childrenMap,
        nodePositions,
        opts.verticalSpacing
      )
      totalChildrenHeight +=
        childSubtreeHeight + (index < children.length - 1 ? opts.verticalSpacing : 0)
    })

    // Position parent node centered vertically relative to its children
    const minChildY = Math.min(...childYPositions)
    const maxChildY = Math.max(...childYPositions)
    const centerY = (minChildY + maxChildY) / 2

    nodePositions.set(nodeId, {
      x: level * opts.horizontalSpacing,
      y: centerY,
    })

    return centerY
  }

  // Start layout from root
  calculateNodePositions(rootNode.id, 0, 0)

  // Apply calculated positions to nodes
  const updatedNodes = nodes.map(node => {
    const position = nodePositions.get(node.id)
    if (position) {
      return {
        ...node,
        position,
      }
    }
    return node
  })

  return updatedNodes
}

function getSubtreeHeight(
  nodeId: string,
  childrenMap: Map<string, string[]>,
  nodePositions: Map<string, { x: number; y: number }>,
  verticalSpacing: number
): number {
  const children = childrenMap.get(nodeId) || []
  if (children.length === 0) {
    return 0
  }

  const childPositions = children
    .map(childId => nodePositions.get(childId)?.y || 0)
    .filter(y => y !== undefined)

  if (childPositions.length === 0) {
    return 0
  }

  const minY = Math.min(...childPositions)
  const maxY = Math.max(...childPositions)

  return maxY - minY
}

// Auto-position new nodes to the right of their parent
export function getNewNodePosition(
  parentNode: Node | undefined,
  existingNodes: Node[],
  horizontalSpacing = 200,
  verticalOffset = 0
): { x: number; y: number } {
  if (!parentNode || !parentNode.position) {
    // If no parent or parent has no position, position to the right of the rightmost node
    const maxX = Math.max(...existingNodes.map(n => n.position.x), 0)
    return { x: maxX + horizontalSpacing, y: 100 + verticalOffset }
  }

  // Position to the right of parent
  const baseX = parentNode.position.x + horizontalSpacing
  const baseY = parentNode.position.y + verticalOffset

  // Check if position is occupied and adjust if needed
  const occupiedPositions = existingNodes.map(n => ({
    x: n.position.x,
    y: n.position.y,
  }))

  let finalY = baseY
  const tolerance = 50 // Minimum distance between nodes

  while (
    occupiedPositions.some(
      pos => Math.abs(pos.x - baseX) < tolerance && Math.abs(pos.y - finalY) < tolerance
    )
  ) {
    finalY += tolerance
  }

  return { x: baseX, y: finalY }
}

// Calculate horizontal layout for a specific parent node and its children
export function calculateParentChildLayout(
  parentId: string,
  nodes: BrainDumpNode[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): BrainDumpNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Find parent node
  const parentNode = nodes.find(n => n.id === parentId)
  if (!parentNode) {
    console.warn('Parent node not found')
    return nodes
  }

  // Find all direct children of this parent
  const childEdges = edges.filter(e => e.source === parentId)
  const childIds = new Set(childEdges.map(e => e.target))
  const childNodes = nodes.filter(n => childIds.has(n.id))

  if (childNodes.length === 0) {
    console.log('No children found for parent node')
    return nodes
  }

  // Calculate vertical spacing for children
  const totalHeight =
    childNodes.length * opts.nodeHeight + (childNodes.length - 1) * opts.verticalSpacing
  const startY = parentNode.position.y - totalHeight / 2

  // Position children vertically centered around parent
  const updatedNodes = nodes.map(node => {
    if (node.id === parentId) {
      return node // Keep parent position unchanged
    }

    const childIndex = childNodes.findIndex(child => child.id === node.id)
    if (childIndex !== -1) {
      // This is a direct child - position it
      return {
        ...node,
        position: {
          x: parentNode.position.x + opts.horizontalSpacing,
          y: startY + childIndex * (opts.nodeHeight + opts.verticalSpacing) + opts.nodeHeight / 2,
        },
      }
    }

    // For grandchildren and beyond, we need to recursively position them
    if (isDescendantOf(node.id, parentId, edges) && !childIds.has(node.id)) {
      // Find this node's parent
      const nodeParentEdge = edges.find(e => e.target === node.id)
      if (nodeParentEdge) {
        const nodeParent = nodes.find(n => n.id === nodeParentEdge.source)
        if (nodeParent && childIds.has(nodeParent.id)) {
          // This is a grandchild - position relative to its parent
          const parentIndex = childNodes.findIndex(child => child.id === nodeParent.id)
          const parentY =
            startY + parentIndex * (opts.nodeHeight + opts.verticalSpacing) + opts.nodeHeight / 2

          // Count siblings to position this node
          const siblings = edges.filter(e => e.source === nodeParent.id).map(e => e.target)
          const siblingIndex = siblings.indexOf(node.id)

          return {
            ...node,
            position: {
              x: parentNode.position.x + opts.horizontalSpacing * 2,
              y: parentY + (siblingIndex - siblings.length / 2) * opts.verticalSpacing,
            },
          }
        }
      }
    }

    return node
  })

  return updatedNodes
}

// Helper to check if a node is a descendant of another
function isDescendantOf(nodeId: string, ancestorId: string, edges: Edge[]): boolean {
  const parent = edges.find(e => e.target === nodeId)?.source
  if (!parent) return false
  if (parent === ancestorId) return true
  return isDescendantOf(parent, ancestorId, edges)
}
