import { useState, useEffect, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { logger } from '../services/logger'
import { useBrainDumpStore } from '../store/braindump'
import { useNodeManager } from './useNodeManager'

export function useReactFlowState() {
  const { currentEntry } = useBrainDumpStore()
  const { migrateHandleIds } = useNodeManager()

  const [nodes, setNodes] = useState<Node[]>(currentEntry?.nodes || [])
  const [edges, setEdges] = useState<Edge[]>(() => {
    if (!currentEntry?.edges) return []
    return currentEntry.edges.map(edge => migrateHandleIds(edge))
  })

  // Use refs to always have access to latest state in callbacks
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  // Update nodes and edges when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      logger.info('FLOW', 'CurrentEntry changed, updating nodes/edges', {
        entryId: currentEntry.id,
        title: currentEntry.title,
        type: currentEntry.type,
        nodesCount: currentEntry.nodes?.length || 0,
        edgesCount: currentEntry.edges?.length || 0,
      })

      const nodesToSet = currentEntry.nodes || []
      const rawEdges = currentEntry.edges || []

      // Migrate handle IDs for compatibility with new handle system
      const edgesToSet = rawEdges.map(edge => migrateHandleIds(edge))

      // Simply set nodes and edges - let React Flow handle the rest
      setNodes(nodesToSet)
      setEdges(edgesToSet)
    }
  }, [currentEntry, migrateHandleIds])

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    nodesRef,
    edgesRef,
  }
}
