import type { BrainDumpNode, BrainDumpEdge } from '@/types/braindump'

export interface HierarchyNode extends BrainDumpNode {
  children: HierarchyNode[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  parentNode?: HierarchyNode
  ancestors?: HierarchyNode[]
}

/**
 * Convert a flat array of nodes to a hierarchical tree structure
 */
export function buildHierarchy(
  nodes: BrainDumpNode[],
  edges: BrainDumpEdge[] = [],
  expandedIds: Set<string> = new Set()
): HierarchyNode[] {
  const nodeMap = new Map<string, HierarchyNode>()
  const rootNodes: HierarchyNode[] = []

  // Create hierarchy nodes with initial properties
  nodes.forEach(node => {
    const hierarchyNode: HierarchyNode = {
      ...node,
      children: [],
      depth: 0,
      isExpanded: expandedIds.has(node.id) || node.data.isCollapsed === false,
      hasChildren: false,
      parentNode: undefined,
    }
    nodeMap.set(node.id, hierarchyNode)
  })

  // Build parent-child relationships using both edges and data fields
  nodes.forEach(node => {
    const hierarchyNode = nodeMap.get(node.id)
    if (!hierarchyNode) return

    // Method 1: Use edges to find children
    const childEdges = edges.filter(edge => edge.source === node.id)
    childEdges.forEach(edge => {
      const childNode = nodeMap.get(edge.target)
      if (childNode && !hierarchyNode.children.includes(childNode)) {
        hierarchyNode.children.push(childNode)
        childNode.parentNode = hierarchyNode
      }
    })

    // Method 2: Use data field children
    if (node.data.children) {
      node.data.children.forEach(childId => {
        const childNode = nodeMap.get(childId)
        if (childNode && !hierarchyNode.children.includes(childNode)) {
          hierarchyNode.children.push(childNode)
          childNode.parentNode = hierarchyNode
        }
      })
    }

    // Method 3: Use subtasks field
    if (node.data.subtasks) {
      node.data.subtasks.forEach(subtaskId => {
        const childNode = nodeMap.get(subtaskId)
        if (childNode && !hierarchyNode.children.includes(childNode)) {
          hierarchyNode.children.push(childNode)
          childNode.parentNode = hierarchyNode
        }
      })
    }

    hierarchyNode.hasChildren = hierarchyNode.children.length > 0
  })

  // Set depths and identify root nodes
  nodeMap.forEach(node => {
    if (!node.parentNode) {
      rootNodes.push(node)
      setDepthAndAncestors(node, 0, [])
    }
  })

  return rootNodes
}

/**
 * Recursively set depth and ancestors for all nodes in a hierarchy
 */
function setDepthAndAncestors(node: HierarchyNode, depth: number, ancestors: HierarchyNode[]) {
  node.depth = depth
  node.ancestors = [...ancestors]
  node.children.forEach(child => setDepthAndAncestors(child, depth + 1, [...ancestors, node]))
}

/**
 * Flatten a hierarchical tree back to a flat array, respecting expanded state
 */
export function flattenHierarchy(
  hierarchyNodes: HierarchyNode[],
  includeCollapsed = false
): HierarchyNode[] {
  const result: HierarchyNode[] = []

  function traverse(nodes: HierarchyNode[]) {
    nodes.forEach(node => {
      result.push(node)

      if (includeCollapsed || node.isExpanded) {
        traverse(node.children)
      }
    })
  }

  traverse(hierarchyNodes)
  return result
}

/**
 * Find all descendants of a node
 */
export function findDescendants(node: HierarchyNode): HierarchyNode[] {
  const descendants: HierarchyNode[] = []

  function traverse(children: HierarchyNode[]) {
    children.forEach(child => {
      descendants.push(child)
      traverse(child.children)
    })
  }

  traverse(node.children)
  return descendants
}

/**
 * Find all ancestors of a node (path to root)
 */
export function findAncestors(node: HierarchyNode): HierarchyNode[] {
  const ancestors: HierarchyNode[] = []
  let current = node.parentNode

  while (current) {
    ancestors.unshift(current) // Add to beginning to get root-to-node order
    current = current.parentNode
  }

  return ancestors
}

/**
 * Find a node by ID in a hierarchical tree
 */
export function findNodeById(
  hierarchyNodes: HierarchyNode[],
  id: string
): HierarchyNode | undefined {
  for (const node of hierarchyNodes) {
    if (node.id === id) return node

    const found = findNodeById(node.children, id)
    if (found) return found
  }
  return undefined
}

/**
 * Toggle expand/collapse state for a node
 */
export function toggleNodeExpansion(node: HierarchyNode): HierarchyNode {
  return {
    ...node,
    isExpanded: !node.isExpanded,
  }
}

/**
 * Expand all nodes in a hierarchy
 */
export function expandAll(hierarchyNodes: HierarchyNode[]): HierarchyNode[] {
  return hierarchyNodes.map(node => ({
    ...node,
    isExpanded: true,
    children: expandAll(node.children),
  }))
}

/**
 * Collapse all nodes in a hierarchy
 */
export function collapseAll(hierarchyNodes: HierarchyNode[]): HierarchyNode[] {
  return hierarchyNodes.map(node => ({
    ...node,
    isExpanded: false,
    children: collapseAll(node.children),
  }))
}

/**
 * Get the completion status for a hierarchical task
 */
export function getHierarchicalCompletion(node: HierarchyNode): {
  completed: number
  total: number
  percentage: number
} {
  let completed = 0
  let total = 1 // Count the node itself

  // Count this node
  if (node.data.status === 'completed') {
    completed++
  }

  // Recursively count children
  function countChildren(children: HierarchyNode[]) {
    children.forEach(child => {
      total++
      if (child.data.status === 'completed') {
        completed++
      }
      countChildren(child.children)
    })
  }

  countChildren(node.children)

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Filter hierarchy nodes while preserving structure
 * Shows parent nodes if any descendant matches the filter
 */
export function filterHierarchy(
  hierarchyNodes: HierarchyNode[],
  predicate: (node: HierarchyNode) => boolean
): HierarchyNode[] {
  function filterNode(node: HierarchyNode): HierarchyNode | null {
    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is HierarchyNode => child !== null)

    // Include node if it matches the predicate OR has matching descendants
    if (predicate(node) || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
        isExpanded: filteredChildren.length > 0 ? true : node.isExpanded, // Auto-expand if has matching children
      }
    }

    return null
  }

  return hierarchyNodes.map(filterNode).filter((node): node is HierarchyNode => node !== null)
}
