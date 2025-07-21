import { useCallback } from 'react'
import { addEdge } from '@xyflow/react'
import type { Node, Edge, Connection } from '@xyflow/react'
import { logger } from '../services/logger'
import { useBrainDumpStore } from '../store/braindump'
import { getOptimalEdgeConnection } from '../lib/floatingEdges'

export function useEdgeManager(
  nodes: Node[],
  edges: Edge[],
  setEdges: (edges: Edge[]) => void,
  nodesRef: React.RefObject<Node[]>,
  edgesRef: React.RefObject<Edge[]>
) {
  const { currentEntry, updateEntry } = useBrainDumpStore()

  // Handle edge connection with automatic positioning
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const sourceNode = nodesRef.current?.find(n => n.id === params.source)
      const targetNode = nodesRef.current?.find(n => n.id === params.target)

      if (!sourceNode || !targetNode) {
        logger.error('EDGE', 'Cannot connect - source or target node not found', {
          source: params.source,
          target: params.target,
          sourceExists: !!sourceNode,
          targetExists: !!targetNode,
        })
        return
      }

      // Get optimal connection points if handles aren't specified
      const optimalConnection = getOptimalEdgeConnection(sourceNode, targetNode)

      // Merge optimal connection with user params, preferring user's choices
      const enhancedParams = {
        ...optimalConnection,
        ...params,
        // Use optimal handles if not specified by user
        sourceHandle: params.sourceHandle || optimalConnection.sourceHandle,
        targetHandle: params.targetHandle || optimalConnection.targetHandle,
      }

      setEdges(eds => {
        const newEdges = addEdge(enhancedParams, eds)

        // Defer store update to avoid React state update during render
        if (currentEntry) {
          setTimeout(() => {
            updateEntry(currentEntry.id, {
              edges: newEdges,
            })
          }, 0)
        }

        return newEdges
      })
    },
    [setEdges, currentEntry, updateEntry, nodesRef]
  )

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      logger.info('EDGE', 'Deleting edges', {
        edgeCount: edgesToDelete.length,
        edgeIds: edgesToDelete.map(e => e.id),
      })

      setEdges(eds => {
        const remainingEdges = eds.filter(
          edge => !edgesToDelete.some(deletedEdge => deletedEdge.id === edge.id)
        )

        // Defer store update to avoid React state update during render
        if (currentEntry) {
          setTimeout(() => {
            updateEntry(currentEntry.id, {
              edges: remainingEdges,
            })
          }, 0)
        }

        return remainingEdges
      })
    },
    [setEdges, currentEntry, updateEntry]
  )

  // Delete a specific edge
  const deleteEdge = useCallback(
    (edgeToDelete: Edge) => {
      logger.info('EDGE', 'Deleting specific edge', {
        edgeId: edgeToDelete.id,
        source: edgeToDelete.source,
        target: edgeToDelete.target,
      })

      setEdges(eds => {
        const newEdges = eds.filter(edge => edge.id !== edgeToDelete.id)

        // Defer store update to avoid React state update during render
        if (currentEntry) {
          setTimeout(() => {
            updateEntry(currentEntry.id, {
              edges: newEdges,
            })
          }, 0)
        }

        return newEdges
      })
    },
    [setEdges, currentEntry, updateEntry]
  )

  // Add edge between nodes with automatic optimal positioning
  const addEdgeBetweenNodes = useCallback(
    (sourceId: string, targetId: string) => {
      const sourceNode = nodesRef.current?.find(n => n.id === sourceId)
      const targetNode = nodesRef.current?.find(n => n.id === targetId)

      if (!sourceNode || !targetNode) {
        logger.error('EDGE', 'Cannot add edge - nodes not found', {
          sourceId,
          targetId,
          sourceExists: !!sourceNode,
          targetExists: !!targetNode,
        })
        return
      }

      // Check if edge already exists
      const existingEdge = edgesRef.current?.find(
        edge => edge.source === sourceId && edge.target === targetId
      )

      if (existingEdge) {
        logger.warn('EDGE', 'Edge already exists between nodes', {
          sourceId,
          targetId,
          existingEdgeId: existingEdge.id,
        })
        return
      }

      // Get optimal connection based on node positions
      const optimalConnection = getOptimalEdgeConnection(sourceNode, targetNode)

      const newEdge: Edge = {
        id: `${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        ...optimalConnection,
      }

      logger.info('EDGE', 'Adding edge between nodes with optimal positioning', {
        sourceId,
        targetId,
        sourceType: sourceNode.type,
        targetType: targetNode.type,
        sourceHandle: newEdge.sourceHandle,
        targetHandle: newEdge.targetHandle,
      })

      setEdges(eds => {
        const newEdges = [...eds, newEdge]

        // Defer store update to avoid React state update during render
        if (currentEntry) {
          setTimeout(() => {
            updateEntry(currentEntry.id, {
              edges: newEdges,
            })
          }, 0)
        }

        return newEdges
      })
    },
    [setEdges, currentEntry, updateEntry, nodesRef, edgesRef]
  )

  return {
    onConnect,
    onEdgesDelete,
    deleteEdge,
    addEdgeBetweenNodes,
  }
}
