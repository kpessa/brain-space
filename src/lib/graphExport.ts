import type { Node, Edge } from '@xyflow/react'

interface GraphNode {
  id: string
  label: string
  type: string
  category?: string
  children: GraphNode[]
  style?: {
    backgroundColor?: string
    borderColor?: string
    textColor?: string
    borderStyle?: string
    borderWidth?: number
    icon?: string
  }
}

/**
 * Build adjacency list from edges
 */
function buildAdjacencyList(edges: Edge[]): Map<string, Set<string>> {
  const adjacencyList = new Map<string, Set<string>>()

  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, new Set())
    }
    adjacencyList.get(edge.source)!.add(edge.target)
  })

  return adjacencyList
}

/**
 * Find root nodes (nodes with no incoming edges)
 */
function findRootNodes(nodes: Node[], edges: Edge[]): string[] {
  const targetNodes = new Set(edges.map(edge => edge.target))
  const rootNodes = nodes.filter(node => !targetNodes.has(node.id)).map(node => node.id)

  // If no roots found (circular graph), start with 'root' type nodes
  if (rootNodes.length === 0) {
    const rootTypeNodes = nodes.filter(node => node.type === 'root')
    if (rootTypeNodes.length > 0) {
      return rootTypeNodes.map(node => node.id)
    }
    // Fallback to first node
    return nodes.length > 0 ? [nodes[0].id] : []
  }

  return rootNodes
}

/**
 * Build hierarchical structure from graph
 */
function buildHierarchy(
  nodeId: string,
  nodes: Map<string, Node>,
  adjacencyList: Map<string, Set<string>>,
  visited: Set<string>
): GraphNode | null {
  if (visited.has(nodeId)) {
    return null // Avoid cycles
  }

  visited.add(nodeId)

  const node = nodes.get(nodeId)
  if (!node) return null

  const children: GraphNode[] = []
  const childIds = adjacencyList.get(nodeId) || new Set()

  childIds.forEach(childId => {
    const child = buildHierarchy(childId, nodes, adjacencyList, visited)
    if (child) {
      children.push(child)
    }
  })

  return {
    id: node.id,
    label: node.data.label || '',
    type: node.type || 'thought',
    category: node.data.category,
    style: node.data.style,
    children: children.sort((a, b) => a.label.localeCompare(b.label)),
  }
}

/**
 * Convert graph node to YAML string with proper indentation
 */
function nodeToYaml(node: GraphNode, indent: number = 0): string {
  const spaces = '  '.repeat(indent)
  let yaml = `${spaces}- ${node.label}`

  // Add metadata as inline comment
  const metadata: string[] = []
  if (node.type !== 'thought') metadata.push(`type: ${node.type}`)
  if (node.category) metadata.push(`category: ${node.category}`)
  if (node.style?.icon) metadata.push(`icon: ${node.style.icon}`)

  if (metadata.length > 0) {
    yaml += ` # ${metadata.join(', ')}`
  }

  yaml += '\n'

  // Add children
  if (node.children.length > 0) {
    node.children.forEach(child => {
      yaml += nodeToYaml(child, indent + 1)
    })
  }

  return yaml
}

/**
 * Convert graph to YAML format
 */
export function graphToYaml(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) {
    return '# Empty brain dump\n'
  }

  const nodeMap = new Map(nodes.map(node => [node.id, node]))
  const adjacencyList = buildAdjacencyList(edges)
  const rootNodeIds = findRootNodes(nodes, edges)

  let yaml = '# Brain Dump Export\n'
  yaml += `# Total nodes: ${nodes.length}\n`
  yaml += `# Total connections: ${edges.length}\n`
  yaml += `# Export date: ${new Date().toLocaleString()}\n`
  yaml += '\n'

  // Process each root and its descendants
  const globalVisited = new Set<string>()

  rootNodeIds.forEach(rootId => {
    const visited = new Set<string>()
    const hierarchy = buildHierarchy(rootId, nodeMap, adjacencyList, visited)
    if (hierarchy) {
      yaml += nodeToYaml(hierarchy)
      visited.forEach(id => globalVisited.add(id))
    }
  })

  // Add orphaned nodes (not connected to any root)
  const orphanedNodes = nodes.filter(node => !globalVisited.has(node.id))
  if (orphanedNodes.length > 0) {
    yaml += '\n# Unconnected nodes:\n'
    orphanedNodes.forEach(node => {
      yaml += `- ${node.data.label || 'Untitled'}`
      if (node.type !== 'thought') yaml += ` # type: ${node.type}`
      yaml += '\n'
    })
  }

  return yaml
}

/**
 * Convert graph to JSON format (alternative export)
 */
export function graphToJson(nodes: Node[], edges: Edge[]): string {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
    nodes: nodes.map(node => ({
      id: node.id,
      label: node.data.label,
      type: node.type,
      category: node.data.category,
      style: node.data.style,
      data: {
        isCollapsed: node.data.isCollapsed,
        hasTopicBrainDump: node.data.hasTopicBrainDump,
        synonyms: node.data.synonyms,
      },
    })),
    edges: edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      label: edge.label,
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
