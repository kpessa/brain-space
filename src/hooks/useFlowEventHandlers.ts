import { useCallback, useState } from 'react'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import { logger } from '../services/logger'
import { useBrainDumpStore } from '../store/braindump'
import { getNewNodePosition } from '../lib/mindMapLayout'
import { SynonymService } from '../services/synonymService'

interface FlowEventHandlersProps {
  nodes: Node[]
  edges: Edge[]
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  nodesRef: React.RefObject<Node[]>
  edgesRef: React.RefObject<Edge[]>
  setPendingChanges: (updater: (prev: number) => number) => void
  debouncedSave: {
    (entryId: string): void
    cancel(): void
  }
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void
  setLastSaved: (date: Date) => void
  setDraggedNode: (node: Node | null) => void
  // quickDeleteEdges and setDeleteEdgeDialog removed - using EdgeClickMenu instead
  setNodeInputDialog: (state: {
    isOpen: boolean
    position: { x: number; y: number } | null
  }) => void
  setSynonymMatchDialog: (state: any) => void
  setContextMenu: (state: any) => void
  setSelectedNodeId: (id: string | null) => void
  setEdgeHoverMenu: (state: any) => void
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number }
  addEdgeBetweenNodes: (sourceId: string, targetId: string) => void
}

export function useFlowEventHandlers({
  nodes,
  edges,
  setNodes,
  setEdges,
  nodesRef,
  edgesRef,
  setPendingChanges,
  debouncedSave,
  setSaveStatus,
  setLastSaved,
  setDraggedNode,
  // quickDeleteEdges and setDeleteEdgeDialog removed
  setNodeInputDialog,
  setSynonymMatchDialog,
  setContextMenu,
  setSelectedNodeId,
  setEdgeHoverMenu,
  screenToFlowPosition,
  addEdgeBetweenNodes,
}: FlowEventHandlersProps) {
  const { currentEntry, updateEntry, addNode } = useBrainDumpStore()

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = useCallback(
    (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1
      const dy = y2 - y1
      const length = Math.sqrt(dx * dx + dy * dy)

      if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)

      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length ** 2))
      const projX = x1 + t * dx
      const projY = y1 + t * dy

      return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
    },
    []
  )

  // Helper function to find edge near drop position
  const findEdgeNearPosition = useCallback(
    (flowPosition: { x: number; y: number }) => {
      const EDGE_DROP_THRESHOLD = 30 // pixels

      for (const edge of edges) {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)

        if (!sourceNode || !targetNode) continue

        // Get node centers
        const sourceX =
          sourceNode.position.x + (sourceNode.measured?.width || sourceNode.width || 200) / 2
        const sourceY =
          sourceNode.position.y + (sourceNode.measured?.height || sourceNode.height || 100) / 2
        const targetX =
          targetNode.position.x + (targetNode.measured?.width || targetNode.width || 200) / 2
        const targetY =
          targetNode.position.y + (targetNode.measured?.height || targetNode.height || 100) / 2

        const distance = distanceToLineSegment(
          flowPosition.x,
          flowPosition.y,
          sourceX,
          sourceY,
          targetX,
          targetY
        )

        if (distance <= EDGE_DROP_THRESHOLD) {
          return edge
        }
      }

      return null
    },
    [edges, nodes, distanceToLineSegment]
  )

  // Handle node changes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const positionChanges = changes.filter(c => c.type === 'position')
      const dimensionChanges = changes.filter(c => c.type === 'dimensions')
      const selectionChanges = changes.filter(c => c.type === 'select')
      const significantChanges = changes.filter(
        c => c.type !== 'position' && c.type !== 'dimensions' && c.type !== 'select'
      )

      const shouldAutoSave = significantChanges.length > 0

      // Removed noisy logging

      let updatedNodes = [...nodes]

      // Store original positions before applying changes
      const originalPositions = new Map<string, { x: number; y: number }>()
      changes.forEach(change => {
        if (change.type === 'position' && change.dragging) {
          const originalNode = nodes.find(n => n.id === change.id)
          if (originalNode) {
            originalPositions.set(change.id, originalNode.position)
          }
        }
      })

      updatedNodes = applyNodeChanges(changes, updatedNodes)

      // Handle parent-child movement
      const movedNodes = new Set<string>()

      changes.forEach(change => {
        if (change.type === 'position' && change.position && change.dragging) {
          const originalPosition = originalPositions.get(change.id)
          if (!originalPosition) return

          const deltaX = change.position.x - originalPosition.x
          const deltaY = change.position.y - originalPosition.y

          if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) return

          // Parent node movement detected

          const findDescendants = (nodeId: string, visited = new Set<string>()): string[] => {
            // Prevent infinite recursion by checking if we've already visited this node
            if (visited.has(nodeId)) {
              return []
            }
            visited.add(nodeId)

            const descendants: string[] = []
            edges.forEach(edge => {
              if (edge.source === nodeId) {
                descendants.push(edge.target)
                descendants.push(...findDescendants(edge.target, visited))
              }
            })
            return descendants
          }

          const descendantIds = findDescendants(change.id)

          descendantIds.forEach(descendantId => {
            if (movedNodes.has(descendantId)) return

            const nodeIndex = updatedNodes.findIndex(n => n.id === descendantId)
            if (nodeIndex !== -1) {
              const oldPosition = updatedNodes[nodeIndex].position
              updatedNodes[nodeIndex] = {
                ...updatedNodes[nodeIndex],
                position: {
                  x: updatedNodes[nodeIndex].position.x + deltaX,
                  y: updatedNodes[nodeIndex].position.y + deltaY,
                },
              }
              movedNodes.add(descendantId)
            }
          })
        }
      })

      // Don't clean nodes after applying changes - let React Flow handle internal state
      setNodes(updatedNodes)

      if (currentEntry && significantChanges.length > 0) {
        setPendingChanges(prev => prev + 1)
        debouncedSave(currentEntry.id)
      }
    },
    [nodes, edges, currentEntry, debouncedSave, setNodes, setPendingChanges]
  )

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges)
      setEdges(newEdges)
      if (currentEntry) {
        setPendingChanges(prev => prev + 1)
        debouncedSave(currentEntry.id)
      }
    },
    [edges, currentEntry, debouncedSave, setEdges, setPendingChanges]
  )

  // Handle edge deletion
  const handleDeleteEdge = useCallback(
    async (edge: Edge) => {
      debouncedSave.cancel()

      const newEdges = edges.filter(e => e.id !== edge.id)
      setEdges(newEdges)

      if (currentEntry) {
        setSaveStatus('saving')
        try {
          await updateEntry(currentEntry.id, { edges: newEdges })
          setSaveStatus('saved')
          setLastSaved(new Date())
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          logger.error('EDGE', 'Failed to delete edge:', error)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }

      const selectedEdges = document.querySelectorAll('.selected-edge')
      selectedEdges.forEach(el => el.classList.remove('selected-edge'))
    },
    [edges, currentEntry, updateEntry, debouncedSave, setEdges, setSaveStatus, setLastSaved]
  )

  // Handle edge click - open edge menu instead of delete dialog
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation()

      // Open edge menu at click position
      setEdgeHoverMenu({
        isOpen: true,
        edge,
        position: { x: event.clientX, y: event.clientY },
      })
    },
    [setEdgeHoverMenu]
  )

  // Handle edge mouse enter (removed - using click instead)
  // const onEdgeMouseEnter = useCallback(...)

  // Handle edge mouse leave (removed - using click instead)
  // const onEdgeMouseLeave = useCallback(...)

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Close edge hover menu when clicking on nodes
      setEdgeHoverMenu({ isOpen: false, edge: null, position: { x: 0, y: 0 } })
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId, setEdgeHoverMenu]
  )

  // Handle node context menu
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        nodeId: node.id,
        nodeData: node.data,
        type: 'node' as const,
      })
    },
    [setContextMenu]
  )

  // Handle pane context menu
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        nodeId: null,
        nodeData: null,
        type: 'pane' as const,
      })
    },
    [setContextMenu]
  )

  // Handle node input submit
  const handleNodeInputSubmit = useCallback(
    async (
      text: string,
      type: 'thought' | 'category',
      position: { x: number; y: number },
      parentNodeId?: string
    ) => {
      if (!currentEntry) return

      try {
        const category = 'misc'
        const nodeType = type

        if (type === 'thought') {
          const { entries } = useBrainDumpStore.getState()
          const matches = SynonymService.findMatches(text, entries)

          if (matches.length > 0) {
            setSynonymMatchDialog({
              isOpen: true,
              matches,
              inputText: text,
              position,
              type,
              category,
            })
            return
          }
        }

        const nodePosition = position || getNewNodePosition(undefined, nodesRef.current || [])

        const newNodeId = crypto.randomUUID()

        await addNode({
          id: newNodeId,
          type: nodeType,
          position: nodePosition,
          data: {
            label: text,
            category: nodeType === 'thought' ? category : text.toLowerCase(),
            thoughts: nodeType === 'category' ? [] : undefined,
            layoutMode: 'freeform',
            parentLayoutMode: 'freeform',
            isCollapsed: false,
          },
        })

        // If there's a parent node, create an edge from parent to child
        if (parentNodeId) {
          const parentNode = nodesRef.current?.find(n => n.id === parentNodeId)
          const childNode = { id: newNodeId }

          if (parentNode) {
            // Determine appropriate source and target handles
            const sourceHandle = 'right-source' // Parent's right side
            const targetHandle = 'left' // Child's left side

            const newEdge = {
              id: `xy-edge__${parentNodeId}${sourceHandle}-${newNodeId}${targetHandle}`,
              source: parentNodeId,
              target: newNodeId,
              sourceHandle,
              targetHandle,
              type: 'floating',
              animated: true,
            }

            // Add edge to current edges
            if (edgesRef.current) {
              const updatedEdges = [...edgesRef.current, newEdge]
              setEdges(updatedEdges)

              // Save to database
              try {
                await updateEntry(currentEntry.id, { edges: updatedEdges })
                logger.info('EDGE_CREATE', 'Created edge between parent and child', {
                  parentId: parentNodeId,
                  childId: newNodeId,
                  edgeId: newEdge.id,
                })
              } catch (error) {
                logger.error('EDGE_CREATE', 'Failed to save edge to database', error)
              }
            }
          }
        }

        setNodeInputDialog({ isOpen: false, position: null, parentNodeId: undefined })
      } catch (error) {
        logger.error('NODE_INPUT', 'Failed to add node:', error)
      }
    },
    [
      currentEntry,
      addNode,
      nodesRef,
      edgesRef,
      setEdges,
      updateEntry,
      setNodeInputDialog,
      setSynonymMatchDialog,
    ]
  )

  // Handle node double click
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId]
  )

  // Handle node drag start
  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setDraggedNode(node)
    },
    [setDraggedNode]
  )

  // Handle node drag stop
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setDraggedNode(null)
    },
    [setDraggedNode]
  )

  // Handle connection end - add node when connection fails or dropped on edge
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: any) => {
      // Get the coordinates from the event
      const clientX = 'clientX' in event ? event.clientX : event.touches?.[0]?.clientX
      const clientY = 'clientY' in event ? event.clientY : event.touches?.[0]?.clientY

      if (!clientX || !clientY) return

      const flowPosition = screenToFlowPosition({ x: clientX, y: clientY })

      // Check if we're near an existing edge for splitting
      const nearEdge = findEdgeNearPosition(flowPosition)

      if (nearEdge && connectionState?.fromNode) {
        // Split the edge by inserting a new node
        logger.info('EDGE_DROP', 'Splitting edge by inserting node', {
          edgeId: nearEdge.id,
          sourceNodeId: connectionState.fromNode.id,
          dropPosition: flowPosition,
        })

        // Create new node at drop position
        const newNodeId = crypto.randomUUID()
        const newNode = {
          id: newNodeId,
          type: 'thought',
          position: flowPosition,
          data: {
            label: `Node ${newNodeId.slice(0, 8)}`,
            category: 'misc',
            layoutMode: 'freeform',
            parentLayoutMode: 'freeform',
            isCollapsed: false,
          },
        }

        // Add the new node
        setNodes(nds => nds.concat(newNode))

        // Create all new edges at once
        const newEdges: Edge[] = [
          {
            id: `${nearEdge.source}-${newNodeId}`,
            source: nearEdge.source,
            target: newNodeId,
            type: 'floating',
            animated: true,
          },
          {
            id: `${newNodeId}-${nearEdge.target}`,
            source: newNodeId,
            target: nearEdge.target,
            type: 'floating',
            animated: true,
          },
        ]

        // Add connection from the dragged node if it's different
        if (connectionState.fromNode.id !== newNodeId) {
          newEdges.push({
            id: `${connectionState.fromNode.id}-${newNodeId}`,
            source: connectionState.fromNode.id,
            target: newNodeId,
            type: 'floating',
            animated: true,
          })
        }

        // Update edges: remove the original edge and add new ones
        setEdges(eds => {
          const filtered = eds.filter(e => e.id !== nearEdge.id)
          return filtered.concat(newEdges)
        })

        // Save changes
        if (currentEntry) {
          setPendingChanges(prev => prev + 1)
          debouncedSave(currentEntry.id)
        }

        return
      }

      // If not valid connection and not near an edge, create a new node
      if (!connectionState?.isValid && connectionState?.fromNode) {
        logger.info('EDGE_DROP', 'Creating new node from failed connection', {
          sourceNodeId: connectionState.fromNode.id,
          dropPosition: flowPosition,
        })

        const newNodeId = crypto.randomUUID()
        const newNode = {
          id: newNodeId,
          type: 'thought',
          position: flowPosition,
          data: {
            label: `Node ${newNodeId.slice(0, 8)}`,
            category: 'misc',
            layoutMode: 'freeform',
            parentLayoutMode: 'freeform',
            isCollapsed: false,
          },
        }

        // Add the new node
        setNodes(nds => nds.concat(newNode))

        // Create the edge immediately
        const newEdge: Edge = {
          id: `${connectionState.fromNode.id}-${newNodeId}`,
          source: connectionState.fromNode.id,
          target: newNodeId,
          type: 'floating',
          animated: true,
        }

        setEdges(eds => eds.concat(newEdge))

        // Save changes
        if (currentEntry) {
          setPendingChanges(prev => prev + 1)
          debouncedSave(currentEntry.id)
        }
      }
    },
    [
      screenToFlowPosition,
      findEdgeNearPosition,
      nodes,
      edges,
      setNodes,
      setEdges,
      currentEntry,
      setPendingChanges,
      debouncedSave,
    ]
  )

  return {
    onNodesChange,
    onEdgesChange,
    onEdgeClick,
    onNodeClick,
    onNodeContextMenu,
    onPaneContextMenu,
    onNodeDoubleClick,
    onNodeDragStart,
    onNodeDragStop,
    onConnectEnd,
    handleDeleteEdge,
    handleNodeInputSubmit,
  }
}
