import { useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { logger } from '../services/logger'
import { useBrainDumpStore } from '../store/braindump'

export function useFlowVisibility(nodes: Node[], edges: Edge[]) {
  const { currentEntry } = useBrainDumpStore()

  // Filter nodes and edges based on collapsed state
  const getVisibleNodesAndEdges = useCallback(() => {
    if (!currentEntry) return { visibleNodes: [], visibleEdges: [] }

    const collapsedNodes = new Set<string>()
    const hiddenNodes = new Set<string>()

    // For topic-focused dumps, always use currentEntry's nodes/edges
    // For regular dumps, prefer local state if available
    const currentNodes =
      currentEntry.type === 'topic-focused'
        ? currentEntry.nodes || []
        : nodes.length > 0
          ? nodes
          : currentEntry.nodes || []
    const currentEdges =
      currentEntry.type === 'topic-focused'
        ? currentEntry.edges || []
        : edges.length > 0
          ? edges
          : currentEntry.edges || []

    if (currentEntry.type === 'topic-focused') {
      logger.debug('FLOW', 'getVisibleNodesAndEdges for topic dump', {
        entryId: currentEntry.id,
        currentNodesCount: currentNodes.length,
        currentEdgesCount: currentEdges.length,
        nodesFromState: nodes.length,
        edgesFromState: edges.length,
        nodeDetails: currentNodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label })),
      })
    }

    // Find all collapsed nodes (both categories and thoughts)
    currentNodes.forEach(node => {
      if (node.data.isCollapsed) {
        collapsedNodes.add(node.id)
      }
    })

    // Recursive function to find all descendant nodes
    const findDescendants = (nodeId: string): string[] => {
      const descendants: string[] = []

      // Find direct children through edges
      currentEdges.forEach(edge => {
        if (edge.source === nodeId) {
          descendants.push(edge.target)
          // Recursively find descendants of this child
          descendants.push(...findDescendants(edge.target))
        }
      })

      // For category nodes, also hide nodes by category
      const node = currentNodes.find(n => n.id === nodeId)
      if (node?.type === 'category') {
        currentNodes.forEach(n => {
          if (n.type === 'thought' && n.data.category === node.data.category) {
            if (!descendants.includes(n.id)) {
              descendants.push(n.id)
              descendants.push(...findDescendants(n.id))
            }
          }
        })
      }

      return descendants
    }

    // Hide all descendants of collapsed nodes
    collapsedNodes.forEach(nodeId => {
      findDescendants(nodeId).forEach(descendantId => {
        hiddenNodes.add(descendantId)
      })
    })

    // Update children count and layout mode for all nodes
    const updatedNodes = currentNodes.map(node => {
      const children = currentEdges.filter(edge => edge.source === node.id).map(edge => edge.target)

      // Find parent node
      const parentEdge = currentEdges.find(edge => edge.target === node.id)
      const parent = parentEdge ? currentNodes.find(n => n.id === parentEdge.source) : null

      // Determine effective layout mode for this node
      const effectiveLayoutMode = node.data.layoutMode || 'freeform'

      // Pass parent's layout mode separately so child can determine handle positions
      const parentLayoutMode = parent?.data?.layoutMode || 'freeform'

      return {
        ...node,
        data: {
          ...node.data,
          children,
          layoutMode: effectiveLayoutMode,
          parentLayoutMode,
        },
      }
    })

    // Filter visible nodes
    const visibleNodes = updatedNodes.filter(node => !hiddenNodes.has(node.id))

    // Filter visible edges (hide edges connected to hidden nodes)
    const visibleEdges = currentEdges.filter(edge => {
      return !hiddenNodes.has(edge.source) && !hiddenNodes.has(edge.target)
    })

    if (currentEntry.type === 'topic-focused') {
      logger.debug('FLOW', 'Filtered results for topic dump', {
        hiddenNodesCount: hiddenNodes.size,
        hiddenNodeIds: Array.from(hiddenNodes),
        visibleNodesCount: visibleNodes.length,
        visibleEdgesCount: visibleEdges.length,
      })
    }

    return { visibleNodes, visibleEdges }
  }, [nodes, edges, currentEntry])

  return getVisibleNodesAndEdges()
}
