import { useCallback, useState, useEffect, useMemo, useRef } from 'react'
import { logger } from '../services/logger'
import { useAuth } from '../contexts/AuthContext'
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  getConnectedEdges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBrainDumpStore } from '../store/braindump'
import { Button } from './Button'
import {
  Download,
  Maximize2,
  Minimize2,
  Plus,
  ZoomIn,
  Save,
  Check,
  CloudUpload,
  X,
  GitBranch,
  Loader2,
  Target,
} from 'lucide-react'
import type { BrainDumpNode, BrainDumpEdge } from '../types/braindump'
import { useFullscreen } from '../hooks/useFullscreen'
import { ConfirmDialog } from './ConfirmDialog'
import { InputDialog } from './InputDialog'
import NodeContextMenu from './NodeContextMenu'
import { PaneContextMenu } from './PaneContextMenu'
import { BrainDumpSelectDialog } from './BrainDumpSelectDialog'
import { SynonymMatchDialog } from './SynonymMatchDialog'
import { TopicBrainDumpDialog } from './TopicBrainDumpDialog'
import { debounce } from '../lib/debounce'
import {
  calculateHorizontalLayout,
  getNewNodePosition,
  calculateParentChildLayout,
} from '../lib/mindMapLayout'
import { SynonymService } from '../services/synonymService'
import { useNavigate } from 'react-router-dom'

// Custom node components
import { CategoryNode } from './nodes/CategoryNode'
import { ThoughtNode } from './nodes/ThoughtNode'
import { RootNode } from './nodes/RootNode'
import { GhostNode } from './nodes/GhostNode'
import { LinkNode } from './nodes/LinkNode'
import { ErrorBoundary } from './ErrorBoundary'

const nodeTypes = {
  category: CategoryNode,
  thought: ThoughtNode,
  root: RootNode,
  ghost: GhostNode,
  link: LinkNode,
}

function BrainDumpFlowInner() {
  const { fitView, screenToFlowPosition, getViewport, setViewport } = useReactFlow()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    entries,
    currentEntry,
    updateEntry,
    addNode,
    updateNode,
    deleteNode,
    isSyncing,
    createEntry,
    setCurrentEntry,
    saveViewportState,
    getViewportState,
  } = useBrainDumpStore()
  const [nodes, setNodes] = useState<Node[]>(currentEntry?.nodes || [])
  const [edges, setEdges] = useState<Edge[]>(currentEntry?.edges || [])
  const { elementRef, isFullscreen, toggleFullscreen } = useFullscreen()
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pendingChanges, setPendingChanges] = useState(0)
  const [quickDeleteEdges, setQuickDeleteEdges] = useState(false)
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)

  // Dialog states
  const [deleteEdgeDialog, setDeleteEdgeDialog] = useState<{ isOpen: boolean; edge: Edge | null }>({
    isOpen: false,
    edge: null,
  })
  const [nodeInputDialog, setNodeInputDialog] = useState<{
    isOpen: boolean
    position: { x: number; y: number } | null
  }>({
    isOpen: false,
    position: null,
  })
  const [linkNodeDialog, setLinkNodeDialog] = useState<{
    isOpen: boolean
    nodeId: string | null
  }>({
    isOpen: false,
    nodeId: null,
  })
  const [synonymMatchDialog, setSynonymMatchDialog] = useState<{
    isOpen: boolean
    matches: any[]
    inputText: string
    position: { x: number; y: number } | null
    type: string
    category: string
  }>({
    isOpen: false,
    matches: [],
    inputText: '',
    position: null,
    type: 'thought',
    category: 'misc',
  })
  const [topicDumpDialog, setTopicDumpDialog] = useState<{
    isOpen: boolean
    node: BrainDumpNode | null
  }>({
    isOpen: false,
    node: null,
  })
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    nodeId: string | null
    nodeData: any | null
    type: 'node' | 'pane'
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    nodeId: null,
    nodeData: null,
    type: 'node',
  })

  // Use refs to always have access to latest state in callbacks
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  nodesRef.current = nodes
  edgesRef.current = edges

  // Helper function to clean nodes by removing ALL internal React Flow properties
  const cleanNodes = useCallback((nodesToClean: Node[]): Node[] => {
    return nodesToClean.map(node => {
      // Create a completely new node object with only the properties we need
      const cleanNode: Node = {
        id: node.id,
        type: node.type,
        position: { ...node.position },
        data: node.data ? { ...node.data } : {},
        // Only include these optional properties if they exist and are valid
        ...(node.style && { style: { ...node.style } }),
        ...(node.className && { className: node.className }),
        ...(node.targetPosition && { targetPosition: node.targetPosition }),
        ...(node.sourcePosition && { sourcePosition: node.sourcePosition }),
        ...(node.hidden !== undefined && { hidden: node.hidden }),
        ...(node.selected !== undefined && { selected: node.selected }),
        ...(node.dragging !== undefined && { dragging: node.dragging }),
        ...(node.selectable !== undefined && { selectable: node.selectable }),
        ...(node.connectable !== undefined && { connectable: node.connectable }),
        ...(node.deletable !== undefined && { deletable: node.deletable }),
        ...(node.dragHandle && { dragHandle: node.dragHandle }),
        ...(node.width !== undefined && { width: node.width }),
        ...(node.height !== undefined && { height: node.height }),
        ...(node.zIndex !== undefined && { zIndex: node.zIndex }),
        ...(node.extent && { extent: node.extent }),
        ...(node.expandParent !== undefined && { expandParent: node.expandParent }),
        ...(node.positionAbsolute && { positionAbsolute: { ...node.positionAbsolute } }),
        ...(node.ariaLabel && { ariaLabel: node.ariaLabel }),
        ...(node.focusable !== undefined && { focusable: node.focusable }),
        // Explicitly exclude parentNode and any other React Flow internals
      }

      logger.debug('CLEAN_NODES', `Cleaned node ${node.id}`, {
        originalKeys: Object.keys(node),
        cleanedKeys: Object.keys(cleanNode),
        hadParentNode: 'parentNode' in node,
      })

      return cleanNode
    })
  }, [])

  // Helper function to clean and validate edges
  const cleanEdges = useCallback((edgesToClean: Edge[], validNodes: Node[]): Edge[] => {
    const nodeIds = new Set(validNodes.map(n => n.id))

    return edgesToClean.filter(edge => {
      // Only keep edges where both source and target nodes exist
      const sourceExists = nodeIds.has(edge.source)
      const targetExists = nodeIds.has(edge.target)

      if (!sourceExists || !targetExists) {
        logger.debug('CLEAN_EDGES', 'Removing invalid edge', {
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          sourceExists,
          targetExists,
        })
        return false
      }

      return true
    })
  }, [])

  // Force reset React Flow state by clearing and re-setting nodes
  const forceResetReactFlow = useCallback(
    (nodesToSet: Node[], edgesToSet: Edge[]) => {
      logger.info('FORCE_RESET', 'Force resetting React Flow state', {
        nodeCount: nodesToSet.length,
        edgeCount: edgesToSet.length,
      })

      // First clear everything
      setNodes([])
      setEdges([])

      // Then set the cleaned data after a brief delay
      setTimeout(() => {
        const deepCleanedNodes = cleanNodes(nodesToSet)
        const deepCleanedEdges = cleanEdges(edgesToSet, deepCleanedNodes)

        logger.info('FORCE_RESET', 'Setting deep cleaned nodes and edges', {
          cleanedNodeCount: deepCleanedNodes.length,
          cleanedEdgeCount: deepCleanedEdges.length,
        })

        setNodes(deepCleanedNodes)
        setEdges(deepCleanedEdges)
      }, 50) // Small delay to ensure React Flow clears internal state
    },
    [cleanNodes, cleanEdges]
  )

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save viewport state when currentEntry changes
  useEffect(() => {
    const saveCurrentViewport = () => {
      if (currentEntry?.id) {
        const viewport = getViewport()
        saveViewportState(currentEntry.id, viewport)
      }
    }

    // Save the current viewport before switching
    return saveCurrentViewport
  }, [currentEntry?.id, getViewport, saveViewportState])

  // Update nodes and edges when currentEntry changes, and restore viewport
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
      const edgesToSet = currentEntry.edges || []

      logger.info('FLOW', 'Setting nodes and edges', {
        nodesToSetCount: nodesToSet.length,
        edgesToSetCount: edgesToSet.length,
        nodeIds: nodesToSet.map(n => ({ id: n.id, type: n.type, label: n.data?.label })),
        edgeDetails: edgesToSet.map(e => ({ id: e.id, source: e.source, target: e.target })),
      })

      // Clean nodes to prevent React Flow parent node errors
      logger.info('FLOW', 'About to clean and set nodes', {
        originalNodesCount: nodesToSet.length,
        originalEdgesCount: edgesToSet.length,
        originalNodeIds: nodesToSet.map(n => n.id),
      })

      const cleanedNodes = cleanNodes(nodesToSet)
      const cleanedEdges = cleanEdges(edgesToSet, cleanedNodes)

      logger.info('FLOW', 'Cleaned nodes and edges', {
        cleanedNodesCount: cleanedNodes.length,
        cleanedEdgesCount: cleanedEdges.length,
        cleanedNodeIds: cleanedNodes.map(n => n.id),
      })

      // Use force reset for brain dump switching to avoid parent node errors
      if (nodesToSet.length > 0) {
        forceResetReactFlow(nodesToSet, edgesToSet)
      } else {
        setNodes(cleanedNodes)
        setEdges(cleanedEdges)
      }

      // Restore viewport or fit to view
      const savedViewport = getViewportState(currentEntry.id)
      if (savedViewport) {
        // Restore saved viewport
        setViewport(savedViewport, { duration: 200 })
      } else {
        // First time viewing this brain dump - fit to view
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 500 })
        }, 100)
      }
    }
  }, [currentEntry, fitView, setViewport, getViewportState, forceResetReactFlow])

  // Track when changes are saved
  useEffect(() => {
    if (currentEntry?.updatedAt) {
      setLastSaved(new Date(currentEntry.updatedAt))
    }
  }, [currentEntry?.updatedAt])

  // Create debounced save function
  const debouncedSave = useMemo(
    () =>
      debounce(async (id: string) => {
        // Always use the current state from refs
        const currentNodes = nodesRef.current
        const currentEdges = edgesRef.current

        console.log('[DEBOUNCED] Debounced save triggered for:', id)
        console.log('[DEBOUNCED] Current nodes count:', currentNodes.length)
        console.log('[DEBOUNCED] Current edges count:', currentEdges.length)
        console.log(
          '[DEBOUNCED] Node IDs:',
          currentNodes.map((n: any) => n.id)
        )

        setSaveStatus('saving')
        try {
          await updateEntry(id, {
            nodes: currentNodes as BrainDumpNode[],
            edges: currentEdges as BrainDumpEdge[],
          })
          setSaveStatus('saved')
          setLastSaved(new Date())
          setPendingChanges(0)

          // Reset status after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('[DEBOUNCED] Failed to save:', error)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }, 30000), // 30 second debounce
    [updateEntry]
  )

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

  const { visibleNodes, visibleEdges } = getVisibleNodesAndEdges()

  // Log visible nodes for debugging
  useEffect(() => {
    if (currentEntry?.type === 'topic-focused') {
      logger.debug('FLOW', 'Visible nodes in topic dump', {
        entryId: currentEntry.id,
        totalNodes: nodes.length,
        visibleNodesCount: visibleNodes.length,
        visibleNodeIds: visibleNodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label })),
        hiddenCount: nodes.length - visibleNodes.length,
      })
    }
  }, [visibleNodes, currentEntry])

  // Memoize nodeTypes to prevent React Flow warning
  const memoizedNodeTypes = useMemo(() => nodeTypes, [])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Categorize changes
      const positionChanges = changes.filter(c => c.type === 'position')
      const dimensionChanges = changes.filter(c => c.type === 'dimensions')
      const selectionChanges = changes.filter(c => c.type === 'select')
      const significantChanges = changes.filter(
        c => c.type !== 'position' && c.type !== 'dimensions' && c.type !== 'select'
      )

      // Only significant changes trigger auto-save (not position, dimension, or selection)
      const shouldAutoSave = significantChanges.length > 0

      if (significantChanges.length > 0) {
        console.log('[NODES_CHANGE] Significant changes:', significantChanges)
      }

      let updatedNodes = [...nodes]

      // First apply the changes
      updatedNodes = applyNodeChanges(changes, updatedNodes)

      // Then handle parent-child movement
      const movedNodes = new Set<string>()

      changes.forEach(change => {
        if (change.type === 'position' && change.position && change.dragging) {
          const parentNode = updatedNodes.find(n => n.id === change.id)
          if (!parentNode) return

          const deltaX = change.position.x - (parentNode.position?.x || 0)
          const deltaY = change.position.y - (parentNode.position?.y || 0)

          // Skip if no actual movement
          if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) return

          // Find all descendants recursively
          const findDescendants = (nodeId: string): string[] => {
            const descendants: string[] = []

            // Find direct children through edges
            edges.forEach(edge => {
              if (edge.source === nodeId) {
                descendants.push(edge.target)
                // Recursively find descendants of this child
                descendants.push(...findDescendants(edge.target))
              }
            })

            return descendants
          }

          const descendantIds = findDescendants(change.id)

          // Move each descendant node by the same delta
          descendantIds.forEach(descendantId => {
            // Skip if already moved by another parent
            if (movedNodes.has(descendantId)) return

            const nodeIndex = updatedNodes.findIndex(n => n.id === descendantId)
            if (nodeIndex !== -1) {
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

      const cleanedUpdatedNodes = cleanNodes(updatedNodes)

      logger.info('NODES_CHANGE', 'Setting cleaned nodes after changes', {
        originalCount: updatedNodes.length,
        cleanedCount: cleanedUpdatedNodes.length,
        nodeIds: cleanedUpdatedNodes.map(n => n.id),
      })

      setNodes(cleanedUpdatedNodes)

      // Only increment pending changes for significant changes (not position/dimension/selection)
      if (currentEntry && significantChanges.length > 0) {
        setPendingChanges(prev => prev + 1)
        debouncedSave(currentEntry.id)
      }
    },
    [nodes, edges, currentEntry, debouncedSave]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges)
      setEdges(newEdges)
      if (currentEntry) {
        setPendingChanges(prev => prev + 1)
        debouncedSave(currentEntry.id)
      }
    },
    [edges, currentEntry, debouncedSave]
  )

  // Handle edge deletion
  const handleDeleteEdge = useCallback(
    async (edge: Edge) => {
      // Cancel any pending debounced saves to prevent race conditions
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
          console.error('Failed to delete edge:', error)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }

      // Remove visual indicator
      const selectedEdges = document.querySelectorAll('.selected-edge')
      selectedEdges.forEach(el => el.classList.remove('selected-edge'))
    },
    [edges, currentEntry, updateEntry, debouncedSave]
  )

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation()

      if (quickDeleteEdges) {
        // Quick delete without confirmation
        handleDeleteEdge(edge)
      } else {
        // Add a visual indicator that the edge was clicked
        const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"]`)
        if (edgeElement) {
          edgeElement.classList.add('selected-edge')
        }

        setDeleteEdgeDialog({ isOpen: true, edge })
      }
    },
    [quickDeleteEdges, handleDeleteEdge]
  )

  const handleDeleteEdgeConfirm = useCallback(async () => {
    if (deleteEdgeDialog.edge) {
      await handleDeleteEdge(deleteEdgeDialog.edge)
    }
    setDeleteEdgeDialog({ isOpen: false, edge: null })
  }, [deleteEdgeDialog.edge, handleDeleteEdge])

  const onConnect = useCallback(
    async (params: Edge | Connection) => {
      // Check if the source node has a topic brain dump
      const sourceNode = nodes.find(n => n.id === params.source)
      if (sourceNode?.data?.hasTopicBrainDump) {
        // Show a message or do nothing - can't add children to nodes with topic dumps
        console.info('Cannot add children to nodes that have topic brain dumps')
        return
      }

      // Determine edge type based on source node's layout mode
      const targetNode = nodes.find(n => n.id === params.target)
      const sourceLayoutMode = sourceNode.data.layoutMode || 'freeform'
      const targetParentLayoutMode = targetNode?.data?.parentLayoutMode || 'freeform'

      const edgeType =
        sourceLayoutMode === 'horizontal' || targetParentLayoutMode === 'horizontal'
          ? 'smoothstep'
          : 'default'

      // Determine handles based on layout modes
      let sourceHandle = params.sourceHandle
      let targetHandle = params.targetHandle

      // If source is in horizontal mode, force right handle
      if (sourceLayoutMode === 'horizontal' && !sourceHandle) {
        sourceHandle = 'right'
      }

      // If target's parent is in horizontal mode, force left handle
      if (targetParentLayoutMode === 'horizontal' && !targetHandle) {
        targetHandle = 'left'
      }

      // Create a proper edge with all required properties
      const newEdge: BrainDumpEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        sourceHandle,
        targetHandle,
        type: edgeType,
        animated: true,
      }

      const newEdges = [...edges, newEdge]
      setEdges(newEdges)

      if (currentEntry) {
        setSaveStatus('saving')
        try {
          await updateEntry(currentEntry.id, { edges: newEdges })
          setSaveStatus('saved')
          setLastSaved(new Date())
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('Failed to save new edge:', error)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }
    },
    [edges, currentEntry, updateEntry, nodes]
  )

  const handleExport = () => {
    if (!currentEntry) return

    // Export as JSON
    const exportData = {
      id: currentEntry.id,
      title: currentEntry.title,
      nodes: currentEntry.nodes,
      edges: currentEntry.edges,
      categories: currentEntry.categories,
      createdAt: currentEntry.createdAt,
      exportedAt: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `brain-dump-${currentEntry.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 800 })
  }

  const handleAutoLayout = useCallback(async () => {
    if (!currentEntry || nodes.length === 0) return

    setSaveStatus('saving')
    const layoutedNodes = calculateHorizontalLayout(nodes as BrainDumpNode[], edges)
    setNodes(layoutedNodes)

    try {
      await updateEntry(currentEntry.id, { nodes: layoutedNodes })
      setSaveStatus('saved')
      setLastSaved(new Date())
      setTimeout(() => {
        setSaveStatus('idle')
        fitView({ padding: 0.2, duration: 800 })
      }, 100)
    } catch (error) {
      console.error('Failed to save layout:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [currentEntry, nodes, edges, updateEntry, fitView])

  const handleAddNode = () => {
    setIsAddingNode(true)
  }

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isAddingNode || !currentEntry) return

      // Get the position where the user clicked
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Open input dialog instead of using prompt
      setNodeInputDialog({ isOpen: true, position })
    },
    [isAddingNode, currentEntry, screenToFlowPosition]
  )

  const handleNodeInputSubmit = useCallback(
    async (text: string) => {
      if (!nodeInputDialog.position || !currentEntry) return

      // Determine category based on selected parent node
      let category = 'misc'
      let parentId = null

      if (selectedNodeId) {
        const parentNode = nodes.find(n => n.id === selectedNodeId)

        // Check if parent node has a topic brain dump
        if (parentNode?.data?.hasTopicBrainDump) {
          console.info('Cannot add children to nodes that have topic brain dumps')
          setNodeInputDialog({ isOpen: false, position: null })
          setIsAddingNode(false)
          setSelectedNodeId(null)
          return
        }

        if (parentNode?.type === 'category') {
          category = parentNode.data.category || 'misc'
          parentId = parentNode.id
        } else if (parentNode?.type === 'thought') {
          category = parentNode.data.category || 'misc'
          // Find the category node
          const categoryNode = nodes.find(
            n => n.type === 'category' && n.data.category === category
          )
          parentId = categoryNode?.id || null
        }
      }

      // Get position based on parent or use clicked position
      const parentNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : undefined
      const position = nodeInputDialog.position

      // Create new node
      const newNode: BrainDumpNode = {
        id: `thought-${Date.now()}`,
        type: 'thought',
        position,
        parentId: selectedNodeId || undefined,
        data: {
          label: text,
          category,
          originalText: text,
          aiGenerated: false,
          parentId,
        },
      }

      // Add node to store
      addNode(newNode)
      const updatedNodes = [...nodes, newNode]
      setNodes(updatedNodes)

      // Save immediately
      if (currentEntry) {
        setSaveStatus('saving')
        try {
          await updateEntry(currentEntry.id, { nodes: updatedNodes as BrainDumpNode[] })

          // Create edge if parent exists
          if (parentId) {
            const parentNode = nodes.find(n => n.id === parentId)
            const parentLayoutMode = parentNode?.data?.layoutMode || 'freeform'
            const edgeType = parentLayoutMode === 'horizontal' ? 'smoothstep' : 'default'

            // Determine handles based on parent's layout mode
            const sourceHandle = parentLayoutMode === 'horizontal' ? 'right' : undefined
            const targetHandle = parentLayoutMode === 'horizontal' ? 'left' : undefined

            const newEdge: BrainDumpEdge = {
              id: `edge-${parentId}-${newNode.id}`,
              source: parentId,
              target: newNode.id,
              sourceHandle,
              targetHandle,
              type: edgeType,
              animated: true,
            }
            const updatedEdges = [...edges, newEdge]
            setEdges(updatedEdges)
            await updateEntry(currentEntry.id, {
              nodes: updatedNodes as BrainDumpNode[],
              edges: updatedEdges as BrainDumpEdge[],
            })
          }

          setSaveStatus('saved')
          setLastSaved(new Date())
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('Failed to save new node:', error)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }

      setIsAddingNode(false)
      setSelectedNodeId(null)
      setNodeInputDialog({ isOpen: false, position: null })
    },
    [nodeInputDialog.position, currentEntry, addNode, nodes, edges, selectedNodeId, updateEntry]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (isAddingNode) {
        setSelectedNodeId(node.id)
      }
    },
    [isAddingNode]
  )

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      nodeId: node.id,
      nodeData: node.data,
      type: 'node',
    })
  }, [])

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()

      // Get the position where the user right-clicked
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      setContextMenu({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        nodeId: null,
        nodeData: { flowPosition },
        type: 'pane',
      })
    },
    [screenToFlowPosition]
  )

  const handleNodeStyleChange = useCallback(
    (nodeId: string, style: any) => {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        updateNode(nodeId, { style })
      }
    },
    [nodes, updateNode]
  )

  const handleMakeLink = useCallback((nodeId: string) => {
    // Open the brain dump selection dialog
    setLinkNodeDialog({ isOpen: true, nodeId })
  }, [])

  const handleUpdateSynonyms = useCallback(
    async (nodeId: string, synonyms: string[]) => {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        await updateNode(nodeId, { synonyms })

        // Update the local state
        const updatedNodes = nodes.map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data, synonyms } } : n
        )
        setNodes(updatedNodes)
      }
    },
    [nodes, updateNode]
  )

  const handleAddChild = useCallback(
    (nodeId: string) => {
      const parentNode = nodes.find(n => n.id === nodeId)
      if (!parentNode) return

      // Check if parent has topic brain dump
      if (parentNode.data.hasTopicBrainDump) {
        console.info('Cannot add children to nodes that have topic brain dumps')
        return
      }

      // Set up for adding a child node
      setSelectedNodeId(nodeId)
      setIsAddingNode(true)

      // Calculate position for new node
      const childCount = edges.filter(e => e.source === nodeId).length
      const offsetX = parentNode.data.layoutMode === 'horizontal' ? 250 : 100
      const offsetY = parentNode.data.layoutMode === 'horizontal' ? childCount * 80 : 100

      const position = {
        x: parentNode.position.x + offsetX,
        y: parentNode.position.y + offsetY,
      }

      // Open the input dialog
      setNodeInputDialog({ isOpen: true, position })
    },
    [nodes, edges]
  )

  // Listen for add child events from nodes
  useEffect(() => {
    const handleAddChildEvent = (event: CustomEvent) => {
      const { nodeId } = event.detail
      handleAddChild(nodeId)
    }

    window.addEventListener('node:addChild', handleAddChildEvent as EventListener)
    return () => window.removeEventListener('node:addChild', handleAddChildEvent as EventListener)
  }, [handleAddChild])

  const handleCreateTopicDump = useCallback(
    (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        setTopicDumpDialog({ isOpen: true, node })
      }
    },
    [nodes]
  )

  const handleDissolveTopicDump = useCallback(
    async (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId)
      if (!node || !node.data.hasTopicBrainDump || !node.data.topicBrainDumpId || !currentEntry)
        return

      logger.info('DISSOLVE_TOPIC', 'Starting topic dump dissolution', {
        nodeId,
        topicBrainDumpId: node.data.topicBrainDumpId,
        nodeLabel: node.data.label,
      })

      try {
        // Find the topic brain dump entry
        const topicEntry = entries.find(e => e.id === node.data.topicBrainDumpId)
        if (!topicEntry) {
          logger.error('DISSOLVE_TOPIC', 'Topic brain dump not found', {
            topicBrainDumpId: node.data.topicBrainDumpId,
          })
          return
        }

        logger.info('DISSOLVE_TOPIC', 'Found topic entry', {
          topicEntryId: topicEntry.id,
          nodesCount: topicEntry.nodes?.length || 0,
          edgesCount: topicEntry.edges?.length || 0,
          originNodeType: topicEntry.originNodeType,
          currentNodeType: node.type,
        })

        // Get all nodes from the topic dump (except the root which is our original node)
        const topicNodes = topicEntry.nodes?.filter(n => n.id !== 'root') || []
        const topicEdges = topicEntry.edges || []

        // Calculate position offset to place nodes near the original
        const offsetX = node.position.x - 400 // Assuming root was at 400,300 in topic dump
        const offsetY = node.position.y - 300

        // Adjust positions of nodes from topic dump
        const adjustedNodes = topicNodes.map(n => ({
          ...n,
          position: {
            x: n.position.x + offsetX,
            y: n.position.y + offsetY,
          },
        }))

        // Find edges that connect to the root in topic dump and redirect them to our node
        const adjustedEdges = topicEdges.map(e => {
          if (e.source === 'root') {
            return { ...e, source: nodeId, id: `${e.id}-dissolved` }
          }
          if (e.target === 'root') {
            return { ...e, target: nodeId, id: `${e.id}-dissolved` }
          }
          return { ...e, id: `${e.id}-dissolved` }
        })

        logger.info('DISSOLVE_TOPIC', 'Adjusted nodes and edges', {
          adjustedNodesCount: adjustedNodes.length,
          adjustedEdgesCount: adjustedEdges.length,
        })

        // Update the node to remove topic dump status and restore original type
        const updatedNode = {
          ...node,
          type: topicEntry.originNodeType || node.type, // Restore original node type
          data: {
            ...node.data,
            hasTopicBrainDump: false,
            topicBrainDumpId: undefined,
            isGhost: false,
            // Reset style to normal
            style: undefined,
          },
        }

        // Restore original parent connection if it exists
        const restoredEdges = [...adjustedEdges]
        if (topicEntry.originalParentNodeId) {
          // Check if the original parent node still exists in the current brain dump
          const originalParentExists = nodes.some(n => n.id === topicEntry.originalParentNodeId)
          if (originalParentExists) {
            // Create a new edge to restore the parent connection
            const newParentEdge = {
              id: `edge-${topicEntry.originalParentNodeId}-${nodeId}-restored`,
              source: topicEntry.originalParentNodeId,
              target: nodeId,
              type: 'default',
              animated: false,
            }
            restoredEdges.push(newParentEdge)

            logger.info('DISSOLVE_TOPIC', 'Restored original parent connection', {
              originalParentNodeId: topicEntry.originalParentNodeId,
              targetNodeId: nodeId,
              newEdgeId: newParentEdge.id,
            })
          } else {
            logger.warn(
              'DISSOLVE_TOPIC',
              'Original parent node not found, cannot restore connection',
              {
                originalParentNodeId: topicEntry.originalParentNodeId,
              }
            )
          }
        }

        // Merge nodes and edges back into current brain dump
        const mergedNodes = [...nodes.filter(n => n.id !== nodeId), updatedNode, ...adjustedNodes]
        const mergedEdges = [...edges, ...restoredEdges]

        logger.info('DISSOLVE_TOPIC', 'Updating current brain dump', {
          mergedNodesCount: mergedNodes.length,
          mergedEdgesCount: mergedEdges.length,
        })

        // Update the current brain dump
        await updateEntry(currentEntry.id, {
          nodes: mergedNodes as BrainDumpNode[],
          edges: mergedEdges as BrainDumpEdge[],
        })

        // Update local state
        const cleanedMergedNodes = cleanNodes(mergedNodes)
        const cleanedMergedEdges = cleanEdges(mergedEdges, cleanedMergedNodes)
        setNodes(cleanedMergedNodes)
        setEdges(cleanedMergedEdges)

        // Delete the topic brain dump entry
        const { deleteEntry } = useBrainDumpStore.getState()
        deleteEntry(topicEntry.id)

        logger.info('DISSOLVE_TOPIC', 'Topic dump dissolved successfully', {
          deletedEntryId: topicEntry.id,
        })

        // Fit view to show all nodes
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 800 })
        }, 100)
      } catch (error) {
        logger.error('DISSOLVE_TOPIC', 'Failed to dissolve topic dump', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
    [nodes, edges, currentEntry, entries, updateEntry, fitView]
  )

  const handleConfirmTopicDump = useCallback(
    async (thoughts: string) => {
      if (!topicDumpDialog.node || !currentEntry) return

      logger.info('TOPIC_DUMP', 'Starting topic dump creation', {
        nodeId: topicDumpDialog.node.id,
        nodeType: topicDumpDialog.node.type,
        nodeLabel: topicDumpDialog.node.data.label,
        currentEntryId: currentEntry.id,
        thoughts,
      })

      try {
        // Helper function to gather all child nodes recursively
        const gatherChildNodes = (
          nodeId: string,
          collectedNodes: Set<string> = new Set()
        ): Set<string> => {
          collectedNodes.add(nodeId)

          // Find edges where this node is the source
          const childEdges = edges.filter(e => e.source === nodeId)

          logger.debug('TOPIC_DUMP', `Found ${childEdges.length} child edges for node ${nodeId}`, {
            nodeId,
            childEdges: childEdges.map(e => ({ source: e.source, target: e.target })),
          })

          // For each child edge, gather the target node and its children
          childEdges.forEach(edge => {
            if (!collectedNodes.has(edge.target)) {
              gatherChildNodes(edge.target, collectedNodes)
            }
          })

          return collectedNodes
        }

        // Find the parent node that this node was connected to (if any)
        const parentEdge = edges.find(e => e.target === topicDumpDialog.node.id)
        const originalParentNodeId = parentEdge?.source || null

        logger.info('TOPIC_DUMP', 'Found original parent connection', {
          parentEdge: parentEdge
            ? { source: parentEdge.source, target: parentEdge.target, id: parentEdge.id }
            : null,
          originalParentNodeId,
        })

        // Gather the node and all its children
        const nodeIds = gatherChildNodes(topicDumpDialog.node.id)

        logger.info('TOPIC_DUMP', 'Gathered nodes', {
          totalNodeIds: nodeIds.size,
          nodeIds: Array.from(nodeIds),
        })

        // Filter nodes and edges to include only the relevant ones
        const relevantNodes = nodes.filter(n => nodeIds.has(n.id))
        const relevantEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))

        logger.info('TOPIC_DUMP', 'Filtered relevant nodes and edges', {
          relevantNodesCount: relevantNodes.length,
          relevantEdgesCount: relevantEdges.length,
          relevantNodeIds: relevantNodes.map(n => n.id),
        })

        // Calculate position offset
        const rootNode = topicDumpDialog.node
        const rootNewPosition = { x: 400, y: 300 }
        const offsetX = rootNewPosition.x - rootNode.position.x
        const offsetY = rootNewPosition.y - rootNode.position.y

        // Update positions for all nodes relative to the new root position
        const initialNodes = relevantNodes.map(n => {
          if (n.id === topicDumpDialog.node.id) {
            return {
              ...n,
              type: 'root',
              position: rootNewPosition,
              data: {
                ...n.data,
                label: n.data.label || topicDumpDialog.node.data.label,
              },
            } as BrainDumpNode
          }
          // Adjust other nodes' positions relative to the root
          return {
            ...n,
            position: {
              x: n.position.x + offsetX,
              y: n.position.y + offsetY,
            },
          } as BrainDumpNode
        })

        // Ensure we have valid nodes
        if (initialNodes.length === 0) {
          logger.error('TOPIC_DUMP', 'No nodes to create topic dump with!', {
            relevantNodesCount: relevantNodes.length,
            nodeIds: Array.from(nodeIds),
          })
          return
        }

        logger.info('TOPIC_DUMP', 'Prepared initial nodes for new entry', {
          initialNodesCount: initialNodes.length,
          initialNodes: initialNodes.map(n => ({
            id: n.id,
            type: n.type,
            position: n.position,
            label: n.data?.label,
          })),
        })

        // Create a new topic-focused brain dump with initial nodes
        logger.info('TOPIC_DUMP', 'Creating entry with createEntry', {
          title: `Topic: ${topicDumpDialog.node.data.label}`,
          type: 'topic-focused',
          initialNodesCount: initialNodes.length,
          relevantEdgesCount: relevantEdges.length,
        })

        // Use authenticated user ID if available, otherwise use current entry's user ID
        const effectiveUserId = user?.id || currentEntry.userId

        logger.info('TOPIC_DUMP', 'Using user ID for new entry', {
          authUserId: user?.id,
          currentEntryUserId: currentEntry.userId,
          effectiveUserId,
        })

        logger.info('TOPIC_DUMP', 'About to call createEntry', {
          initialNodesCount: initialNodes.length,
          relevantEdgesCount: relevantEdges.length,
          initialNodeDetails: initialNodes.map(n => ({
            id: n.id,
            type: n.type,
            label: n.data?.label,
            dataKeys: Object.keys(n.data || {}),
          })),
        })

        const newEntry = await createEntry(
          `Topic: ${topicDumpDialog.node.data.label}`,
          thoughts,
          effectiveUserId,
          currentEntry.id,
          topicDumpDialog.node.id,
          topicDumpDialog.node.data.label,
          'topic-focused',
          initialNodes,
          relevantEdges,
          topicDumpDialog.node.type, // Store the original node type
          originalParentNodeId // Store the original parent connection
        )

        // Verify the entry was created with nodes
        if (!newEntry.nodes || newEntry.nodes.length === 0) {
          logger.error('TOPIC_DUMP', 'Entry created without nodes!', {
            newEntryId: newEntry.id,
            hasNodes: !!newEntry.nodes,
            nodeCount: newEntry.nodes?.length || 0,
          })
        } else {
          logger.info('TOPIC_DUMP', 'Entry created successfully', {
            newEntryId: newEntry.id,
            nodeCount: newEntry.nodes.length,
            edgeCount: newEntry.edges?.length || 0,
          })
        }

        // Remove child nodes from the original brain dump (keep only the root node)
        const nodesToRemove = new Set(nodeIds)
        nodesToRemove.delete(topicDumpDialog.node.id) // Keep the original node

        // Filter out the child nodes and their edges
        const remainingNodes = nodes.filter(n => !nodesToRemove.has(n.id))
        const remainingEdges = edges.filter(
          e => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target)
        )

        // Update the original node to mark it as having a topic brain dump and style it as a ghost/reference
        const updatedRemainingNodes = remainingNodes.map(n =>
          n.id === topicDumpDialog.node.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  hasTopicBrainDump: true,
                  topicBrainDumpId: newEntry.id,
                  children: [], // Clear children since they're moved to topic dump
                  // Style as ghost/reference node
                  style: {
                    backgroundColor: '#f3f4f6',
                    borderColor: '#9ca3af',
                    textColor: '#6b7280',
                    borderStyle: 'dashed' as const,
                    borderWidth: 2,
                  },
                  isGhost: true, // Mark as ghost for visual cues
                },
              }
            : n
        )

        // Update both store and local state
        logger.info('TOPIC_DUMP', 'Updating original entry', {
          entryId: currentEntry.id,
          originalUserId: currentEntry.userId,
          remainingNodesCount: updatedRemainingNodes.length,
          remainingEdgesCount: remainingEdges.length,
        })

        await updateEntry(currentEntry.id, {
          nodes: updatedRemainingNodes as BrainDumpNode[],
          edges: remainingEdges as BrainDumpEdge[],
        })

        const cleanedRemainingNodes = cleanNodes(updatedRemainingNodes)
        const cleanedRemainingEdges = cleanEdges(remainingEdges, cleanedRemainingNodes)
        setNodes(cleanedRemainingNodes)
        setEdges(cleanedRemainingEdges)

        // Close the dialog
        setTopicDumpDialog({ isOpen: false, node: null })

        // Set the new entry as current
        logger.info('TOPIC_DUMP', 'Setting new entry as current', {
          newEntryId: newEntry.id,
          newEntryNodesCount: newEntry.nodes?.length || 0,
        })

        setCurrentEntry(newEntry)

        logger.info('TOPIC_DUMP', 'Topic dump creation completed successfully')
      } catch (error) {
        logger.error('TOPIC_DUMP', 'Failed to create topic brain dump', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    },
    [
      topicDumpDialog.node,
      currentEntry,
      createEntry,
      navigate,
      nodes,
      edges,
      updateEntry,
      setNodes,
      setEdges,
    ]
  )

  const handleLinkNodeSelect = useCallback(
    (linkedBrainDumpId: string) => {
      if (!linkNodeDialog.nodeId) return

      const node = nodes.find(n => n.id === linkNodeDialog.nodeId)
      if (node) {
        // Convert the node to a link node
        const updatedNodes = nodes.map(n => {
          if (n.id === linkNodeDialog.nodeId) {
            return {
              ...n,
              type: 'link',
              data: {
                ...n.data,
                isLink: true,
                linkedBrainDumpId,
              },
            }
          }
          return n
        })

        setNodes(updatedNodes)
        if (currentEntry) {
          updateEntry(currentEntry.id, { nodes: updatedNodes as BrainDumpNode[] })
        }
      }

      setLinkNodeDialog({ isOpen: false, nodeId: null })
    },
    [nodes, linkNodeDialog.nodeId, currentEntry, updateEntry]
  )

  const handleCreateGhost = useCallback(
    (nodeId: string) => {
      const originalNode = nodes.find(n => n.id === nodeId)
      if (!originalNode) return

      // Create a ghost node that references the original
      const ghostNode: BrainDumpNode = {
        id: `ghost-${nodeId}-${Date.now()}`,
        type: 'ghost',
        position: {
          x: originalNode.position.x + 150,
          y: originalNode.position.y + 50,
        },
        data: {
          label: originalNode.data.label,
          category: originalNode.data.category,
          isGhost: true,
          referencedNodeId: nodeId,
        },
      }

      // Add the ghost node
      const updatedNodes = [...nodes, ghostNode]
      setNodes(updatedNodes)

      if (currentEntry) {
        updateEntry(currentEntry.id, { nodes: updatedNodes })
      }
    },
    [nodes, currentEntry, updateEntry]
  )

  const handleNodeLayoutModeChange = useCallback(
    async (nodeId: string, layoutMode: 'horizontal' | 'freeform') => {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        await updateNode(nodeId, { layoutMode })

        // If switching to horizontal layout, auto-arrange children
        if (layoutMode === 'horizontal') {
          const childNodes = nodes.filter(n => n.parentId === nodeId)
          if (childNodes.length > 0) {
            // Auto-arrange children horizontally
            const baseX = node.position.x + 250
            const baseY = node.position.y
            const spacing = 100

            childNodes.forEach((child, index) => {
              const childIndex = nodes.findIndex(n => n.id === child.id)
              if (childIndex !== -1) {
                nodes[childIndex] = {
                  ...nodes[childIndex],
                  position: {
                    x: baseX,
                    y: baseY + (index - childNodes.length / 2) * spacing,
                  },
                }
              }
            })

            setNodes([...nodes])
            if (currentEntry) {
              await updateEntry(currentEntry.id, { nodes: nodes as BrainDumpNode[] })
            }
          }
        }
      }
    },
    [nodes, updateNode, currentEntry, updateEntry]
  )

  const handleNodeTypeChange = useCallback(
    async (nodeId: string, newType: string) => {
      if (!currentEntry) return

      logger.info('NODE_TYPE_CHANGE', 'Changing node type', {
        nodeId,
        newType,
        currentType: nodes.find(n => n.id === nodeId)?.type,
      })

      // Find the node
      const nodeIndex = nodes.findIndex(n => n.id === nodeId)
      if (nodeIndex === -1) return

      const node = nodes[nodeIndex]

      // Don't allow changing ghost or link nodes
      if (node.type === 'ghost' || node.type === 'link') {
        logger.warn('NODE_TYPE_CHANGE', 'Cannot change type of ghost or link nodes')
        return
      }

      // Create updated node with new type
      const updatedNode = {
        ...node,
        type: newType,
        data: {
          ...node.data,
          // If converting to category, ensure it has a category value
          category:
            newType === 'category'
              ? (node.data.label || 'New Category').toLowerCase().replace(/\s+/g, '-')
              : node.data.category,
        },
      }

      // Update nodes array
      const updatedNodes = [...nodes]
      updatedNodes[nodeIndex] = updatedNode

      // Update local state
      setNodes(updatedNodes)

      // Save to database
      setSaveStatus('saving')
      try {
        await updateEntry(currentEntry.id, {
          nodes: updatedNodes as BrainDumpNode[],
        })
        setSaveStatus('saved')
        setLastSaved(new Date())

        logger.info('NODE_TYPE_CHANGE', 'Node type changed successfully', {
          nodeId,
          oldType: node.type,
          newType,
        })

        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        logger.error('NODE_TYPE_CHANGE', 'Failed to save node type change', {
          error: error instanceof Error ? error.message : String(error),
        })
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    },
    [nodes, currentEntry, updateEntry]
  )

  const handleNodeAutoLayout = useCallback(
    async (nodeId: string) => {
      if (!currentEntry) return

      console.log('[AUTO-LAYOUT] Starting auto-layout for node:', nodeId)

      // Cancel any pending saves
      debouncedSave.cancel()

      // Calculate new positions for this parent and its children
      const updatedNodes = calculateParentChildLayout(
        nodeId,
        nodes as BrainDumpNode[],
        edges as BrainDumpEdge[],
        {
          horizontalSpacing: 250,
          verticalSpacing: 80,
          nodeHeight: 80,
        }
      )

      // Update local state
      const cleanedLayoutNodes = cleanNodes(updatedNodes)
      setNodes(cleanedLayoutNodes)

      // Save to database immediately
      setSaveStatus('saving')
      try {
        await updateEntry(currentEntry.id, {
          nodes: updatedNodes,
          edges: edges as BrainDumpEdge[],
        })
        setSaveStatus('saved')
        setLastSaved(new Date())
        setTimeout(() => setSaveStatus('idle'), 2000)

        // Fit view to show the rearranged nodes
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 800 })
        }, 100)
      } catch (error) {
        console.error('[AUTO-LAYOUT] Failed to save:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    },
    [nodes, edges, currentEntry, updateEntry, debouncedSave, fitView]
  )

  const handleManualSave = useCallback(async () => {
    if (!currentEntry) return

    console.log('[MANUAL SAVE] Saving current state')

    // Cancel any pending debounced saves
    debouncedSave.cancel()

    setSaveStatus('saving')
    try {
      await updateEntry(currentEntry.id, {
        nodes: nodesRef.current as BrainDumpNode[],
        edges: edgesRef.current as BrainDumpEdge[],
      })
      setSaveStatus('saved')
      setLastSaved(new Date())
      setPendingChanges(0)
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('[MANUAL SAVE] Failed to save:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [currentEntry, updateEntry, debouncedSave])

  // Add keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleManualSave])

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      console.log('[DELETE] Starting node deletion for:', nodeId)
      console.log('[DELETE] Current nodes count:', nodes.length)
      console.log(
        '[DELETE] Node IDs before deletion:',
        nodes.map(n => n.id)
      )

      if (!currentEntry) {
        console.error('[DELETE] No current entry, aborting')
        return
      }

      // Don't allow deleting root node
      const node = nodes.find(n => n.id === nodeId)
      if (node?.type === 'root') {
        console.warn('[DELETE] Cannot delete root node')
        return
      }

      console.log('[DELETE] Canceling pending debounced saves')
      // Cancel any pending debounced saves to prevent race conditions
      debouncedSave.cancel()

      console.log('[DELETE] Calling store deleteNode')
      // Delete the node from store
      deleteNode(nodeId)

      // Update local state
      const updatedNodes = nodes.filter(n => n.id !== nodeId)
      const cleanedUpdatedNodes = cleanNodes(updatedNodes)
      const cleanedUpdatedEdges = cleanEdges(
        edges.filter(e => e.source !== nodeId && e.target !== nodeId),
        cleanedUpdatedNodes
      )

      console.log('[DELETE] Updated nodes count:', cleanedUpdatedNodes.length)
      console.log(
        '[DELETE] Updated node IDs:',
        cleanedUpdatedNodes.map(n => n.id)
      )

      setNodes(cleanedUpdatedNodes)
      setEdges(cleanedUpdatedEdges)

      // Save to database immediately (not debounced)
      console.log('[DELETE] Saving to database...')
      console.log(
        '[DELETE] Saving nodes:',
        cleanedUpdatedNodes.length,
        'edges:',
        cleanedUpdatedEdges.length
      )
      setSaveStatus('saving')
      try {
        await updateEntry(currentEntry.id, {
          nodes: cleanedUpdatedNodes as BrainDumpNode[],
          edges: cleanedUpdatedEdges as BrainDumpEdge[],
        })
        console.log('[DELETE] Save successful')
        setSaveStatus('saved')
        setLastSaved(new Date())
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('[DELETE] Failed to delete node:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    },
    [nodes, edges, currentEntry, deleteNode, updateEntry, debouncedSave, cleanNodes, cleanEdges]
  )

  const handleAddNodeFromContextMenu = useCallback(
    async (
      text: string,
      type: string,
      category: string,
      clickPosition: { x: number; y: number }
    ) => {
      if (!currentEntry) return

      // Check for synonym matches
      const matches = SynonymService.findMatches(text, entries)
      if (matches.length > 0) {
        // Show synonym match dialog
        setSynonymMatchDialog({
          isOpen: true,
          matches,
          inputText: text,
          position: clickPosition,
          type,
          category,
        })
        return
      }

      // No matches, create new node directly
      createNewNode(text, type, category, clickPosition)
    },
    [currentEntry, entries, nodes]
  )

  const createNewNode = useCallback(
    async (
      text: string,
      type: string,
      category: string,
      clickPosition: { x: number; y: number }
    ) => {
      if (!currentEntry) return

      // Use the clicked position for new nodes
      const position = clickPosition

      const newNode: BrainDumpNode = {
        id: `${type}-${Date.now()}`,
        type: type as 'thought' | 'category' | 'root',
        position,
        data: {
          label: text,
          category: type === 'category' ? text.toLowerCase() : category,
          originalText: text,
          aiGenerated: false,
          isCollapsed: false,
          children: [],
        },
      }

      // Add node to store
      addNode(newNode)
      const updatedNodes = [...nodes, newNode]
      setNodes(updatedNodes)

      setSaveStatus('saving')
      try {
        await updateEntry(currentEntry.id, { nodes: updatedNodes as BrainDumpNode[] })

        // If it's a thought node, connect it to its category
        if (type === 'thought' && category) {
          const categoryNode = nodes.find(
            n => n.type === 'category' && n.data.category === category
          )
          if (categoryNode) {
            const categoryLayoutMode = categoryNode.data?.layoutMode || 'freeform'
            const edgeType = categoryLayoutMode === 'horizontal' ? 'smoothstep' : 'default'

            // Determine handles based on category's layout mode
            const sourceHandle = categoryLayoutMode === 'horizontal' ? 'right' : undefined
            const targetHandle = categoryLayoutMode === 'horizontal' ? 'left' : undefined

            const newEdge: BrainDumpEdge = {
              id: `edge-${categoryNode.id}-${newNode.id}`,
              source: categoryNode.id,
              target: newNode.id,
              sourceHandle,
              targetHandle,
              type: edgeType,
              animated: true,
            }
            const updatedEdges = [...edges, newEdge]
            setEdges(updatedEdges)
            await updateEntry(currentEntry.id, {
              nodes: updatedNodes as BrainDumpNode[],
              edges: updatedEdges as BrainDumpEdge[],
            })
          }
        } else if (type === 'category') {
          // Connect new category to root
          const rootNode = nodes.find(n => n.type === 'root')
          if (rootNode) {
            const rootLayoutMode = rootNode.data?.layoutMode || 'freeform'
            const edgeType = rootLayoutMode === 'horizontal' ? 'smoothstep' : 'default'

            // Determine handles based on root's layout mode
            const sourceHandle = rootLayoutMode === 'horizontal' ? 'right' : undefined
            const targetHandle = rootLayoutMode === 'horizontal' ? 'left' : undefined

            const newEdge: BrainDumpEdge = {
              id: `edge-${rootNode.id}-${newNode.id}`,
              source: rootNode.id,
              target: newNode.id,
              sourceHandle,
              targetHandle,
              type: edgeType,
              animated: true,
            }
            const updatedEdges = [...edges, newEdge]
            setEdges(updatedEdges)
            await updateEntry(currentEntry.id, {
              nodes: updatedNodes as BrainDumpNode[],
              edges: updatedEdges as BrainDumpEdge[],
            })
          }
        }

        setSaveStatus('saved')
        setLastSaved(new Date())
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to save new node:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }

      setContextMenu({ ...contextMenu, isOpen: false })
    },
    [currentEntry, nodes, edges, addNode, updateEntry, contextMenu]
  )

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Allow collapse/expand for category nodes
    // ThoughtNode handles its own double-click for collapse/resize
    if (node.type === 'category') {
      const { toggleNodeCollapse } = useBrainDumpStore.getState()
      toggleNodeCollapse(node.id)
    }
  }, [])

  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setDraggedNode(node)
  }, [])

  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node) => {
      if (!draggedNode || !currentEntry) {
        setDraggedNode(null)
        return
      }

      // Find nodes that the dragged node overlaps with
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
      if (!nodeElement) {
        setDraggedNode(null)
        return
      }

      const draggedRect = nodeElement.getBoundingClientRect()
      const allNodeElements = document.querySelectorAll('[data-id]')

      let potentialParent: Node | null = null
      let maxOverlapArea = 0

      // Check overlap with all other nodes
      allNodeElements.forEach(el => {
        const targetId = el.getAttribute('data-id')
        if (targetId === node.id) return // Skip self

        const targetNode = nodes.find(n => n.id === targetId)
        if (!targetNode) return

        // Don't allow dropping on nodes that have topic brain dumps
        if (targetNode.data?.hasTopicBrainDump) return

        const targetRect = el.getBoundingClientRect()

        // Calculate overlap
        const overlapLeft = Math.max(draggedRect.left, targetRect.left)
        const overlapRight = Math.min(draggedRect.right, targetRect.right)
        const overlapTop = Math.max(draggedRect.top, targetRect.top)
        const overlapBottom = Math.min(draggedRect.bottom, targetRect.bottom)

        const overlapWidth = Math.max(0, overlapRight - overlapLeft)
        const overlapHeight = Math.max(0, overlapBottom - overlapTop)
        const overlapArea = overlapWidth * overlapHeight

        // If this has more overlap than previous candidates, use it
        if (
          overlapArea > maxOverlapArea &&
          overlapArea > draggedRect.width * draggedRect.height * 0.3
        ) {
          maxOverlapArea = overlapArea
          potentialParent = targetNode
        }
      })

      if (potentialParent) {
        logger.info('DRAG_DROP', 'Making node a child', {
          draggedNodeId: node.id,
          parentNodeId: potentialParent.id,
        })

        // Remove any existing edges to this node
        const edgesToRemove = edges.filter(e => e.target === node.id)
        const newEdges = edges.filter(e => e.target !== node.id)

        // Create new edge from potential parent to dragged node
        const newEdge: BrainDumpEdge = {
          id: `edge-${potentialParent.id}-${node.id}-${Date.now()}`,
          source: potentialParent.id,
          target: node.id,
          type: potentialParent.data?.layoutMode === 'horizontal' ? 'smoothstep' : 'default',
          animated: true,
        }

        // Update edges
        const updatedEdges = [...newEdges, newEdge]
        setEdges(updatedEdges)

        // Update the node's category if dropping on a category node
        if (potentialParent.type === 'category' && node.type === 'thought') {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              category: potentialParent.data.category,
            },
          }
          const updatedNodes = nodes.map(n => (n.id === node.id ? updatedNode : n))
          const cleanedNodes = cleanNodes(updatedNodes)
          setNodes(cleanedNodes)

          // Save changes
          await updateEntry(currentEntry.id, {
            nodes: cleanedNodes as BrainDumpNode[],
            edges: updatedEdges,
          })
        } else {
          // Just save the edge changes
          await updateEntry(currentEntry.id, { edges: updatedEdges })
        }
      }

      setDraggedNode(null)
    },
    [draggedNode, nodes, edges, currentEntry, updateEntry, cleanNodes]
  )

  if (!currentEntry) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No brain dump selected. Create one to start visualizing!</p>
      </div>
    )
  }

  return (
    <div ref={elementRef} className="relative w-full h-full min-h-[500px] bg-white">
      <ErrorBoundary
        context="React Flow"
        isolate={true}
        resetKeys={[currentEntry?.id]}
        resetOnPropsChange={true}
      >
        <ReactFlow
          key={`reactflow-${currentEntry?.id || 'default'}`}
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onEdgeClick={onEdgeClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={memoizedNodeTypes}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView
          attributionPosition="bottom-left"
          className={isAddingNode ? 'cursor-crosshair' : ''}
          nodesDraggable={!isAddingNode}
          nodesConnectable={true}
          elementsSelectable={!isAddingNode}
          zoomOnScroll={!isMobile}
          zoomOnPinch={true}
          zoomOnDoubleClick={!isMobile}
          panOnScroll={isMobile}
          panOnDrag={true}
          edgesFocusable={true}
          edgesUpdatable={true}
          defaultEdgeOptions={{
            type: 'default',
            style: {
              stroke: '#b1b1b7',
              strokeWidth: 2,
            },
            animated: true,
          }}
        >
          <Background color="#f0f0f0" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={node => {
              const category = node.data?.category
              switch (category) {
                case 'ideas':
                  return '#3b82f6'
                case 'tasks':
                  return '#10b981'
                case 'questions':
                  return '#f59e0b'
                case 'insights':
                  return '#8b5cf6'
                case 'problems':
                  return '#ef4444'
                default:
                  return '#6b7280'
              }
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #e5e7eb',
            }}
          />
        </ReactFlow>
      </ErrorBoundary>

      {/* Instructions */}
      {isAddingNode && (
        <div className="absolute top-4 left-4 bg-brain-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {selectedNodeId
              ? 'Click on empty space to add a connected thought'
              : 'Click on a node to select parent, or click empty space for standalone thought'}
          </p>
          <button
            onClick={() => {
              setIsAddingNode(false)
              setSelectedNodeId(null)
            }}
            className="text-xs underline mt-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Mobile-friendly touch hint */}
      {isMobile && !isAddingNode && currentEntry && (
        <div className="absolute bottom-4 left-4 bg-gray-800/80 text-white px-3 py-1 rounded-lg text-xs">
          Pinch to zoom • Drag to pan • Tap edge to delete
        </div>
      )}

      {/* Desktop hints */}
      {!isMobile && !isAddingNode && currentEntry && (
        <div className="absolute bottom-4 left-4 bg-gray-800/80 text-white px-3 py-2 rounded-lg text-xs space-y-1">
          <div>Right-click empty space to add nodes • Right-click nodes for options</div>
          <div>Drag nodes to move • Connect from right to left handles</div>
          <div>
            Click edge to {quickDeleteEdges ? 'delete instantly' : 'confirm delete'} • Delete key
            removes selected
          </div>
          <div>Double-click to auto-resize/collapse</div>
        </div>
      )}

      {/* Topic Focus Indicator with Back Button */}
      {currentEntry?.type === 'topic-focused' && currentEntry.topicFocus && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="bg-brain-100 px-3 py-1.5 rounded-lg shadow-sm border border-brain-300 text-xs flex items-center gap-2">
            <Target className="w-3 h-3 text-brain-600" />
            <span className="text-brain-700 font-medium">Topic: {currentEntry.topicFocus}</span>
          </div>
          {currentEntry.parentBrainDumpId && (
            <button
              onClick={() => {
                const parentEntry = entries.find(e => e.id === currentEntry.parentBrainDumpId)
                if (parentEntry) {
                  logger.info('FLOW', 'Navigating back to parent brain dump', {
                    currentId: currentEntry.id,
                    parentId: parentEntry.id,
                  })
                  setCurrentEntry(parentEntry)
                }
              }}
              className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-300 text-xs flex items-center gap-1 hover:bg-gray-50 transition-colors"
              title="Back to parent brain dump"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="text-gray-700 font-medium">Back to Parent</span>
            </button>
          )}
        </div>
      )}

      {/* Save Status */}
      {!isMobile && currentEntry && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border text-xs flex items-center gap-2 min-w-[140px] justify-center">
          {saveStatus === 'saving' && (
            <>
              <CloudUpload className="w-3 h-3 text-blue-600 animate-pulse" />
              <span className="text-gray-700 font-medium">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3 h-3 text-green-600" />
              <span className="text-gray-700 font-medium">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <X className="w-3 h-3 text-red-600" />
              <span className="text-red-700 font-medium">Save failed</span>
            </>
          )}
          {saveStatus === 'idle' && pendingChanges > 0 && (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-yellow-600 font-medium">
                {pendingChanges} unsaved change{pendingChanges > 1 ? 's' : ''}
              </span>
              <span className="text-gray-500 text-xs">(Ctrl+S to save)</span>
            </>
          )}
          {saveStatus === 'idle' && pendingChanges === 0 && lastSaved && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">
                Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>
      )}

      {/* Custom Controls */}
      <div className={`absolute ${isMobile ? 'bottom-20 right-4' : 'top-4 right-4'} flex gap-2`}>
        <Button
          variant={pendingChanges > 0 ? 'primary' : 'outline'}
          size="sm"
          onClick={handleManualSave}
          className="bg-white/90 backdrop-blur"
          title="Save changes (Ctrl/Cmd+S)"
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant={isAddingNode ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            if (isAddingNode) {
              setIsAddingNode(false)
              setSelectedNodeId(null)
            } else {
              handleAddNode()
            }
          }}
          className="bg-white/90 backdrop-blur"
          title={isAddingNode ? 'Cancel adding' : 'Add new thought'}
        >
          <Plus className={`w-4 h-4 ${isAddingNode ? 'rotate-45' : ''} transition-transform`} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="bg-white/90 backdrop-blur"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFitView}
          className="bg-white/90 backdrop-blur"
          title="Fit to view"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="bg-white/90 backdrop-blur"
          title="Export as JSON"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={deleteEdgeDialog.isOpen}
        title="Delete Connection"
        message="Are you sure you want to delete this connection?"
        confirmText="Delete"
        onConfirm={handleDeleteEdgeConfirm}
        onCancel={() => {
          // Remove visual indicator
          const selectedEdges = document.querySelectorAll('.selected-edge')
          selectedEdges.forEach(el => el.classList.remove('selected-edge'))
          setDeleteEdgeDialog({ isOpen: false, edge: null })
        }}
      />

      <InputDialog
        isOpen={nodeInputDialog.isOpen}
        title="Add New Thought"
        placeholder="Enter your thought..."
        submitText="Add"
        onSubmit={handleNodeInputSubmit}
        onCancel={() => {
          setNodeInputDialog({ isOpen: false, position: null })
          setIsAddingNode(false)
          setSelectedNodeId(null)
        }}
      />

      {contextMenu.type === 'node' ? (
        <NodeContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          nodeId={contextMenu.nodeId || ''}
          nodeData={contextMenu.nodeData || {}}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          type={contextMenu.type}
          onStyleChange={handleNodeStyleChange}
          onMakeLink={handleMakeLink}
          onDelete={handleDeleteNode}
          onLayoutModeChange={handleNodeLayoutModeChange}
          onAutoLayout={handleNodeAutoLayout}
          onCreateGhost={handleCreateGhost}
          onUpdateSynonyms={handleUpdateSynonyms}
          onCreateTopicDump={handleCreateTopicDump}
          onDissolveTopicDump={handleDissolveTopicDump}
          onAddChild={handleAddChild}
          onNodeTypeChange={handleNodeTypeChange}
        />
      ) : (
        <PaneContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          flowPosition={contextMenu.nodeData?.flowPosition || { x: 0, y: 0 }}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          onAddNode={handleAddNodeFromContextMenu}
          onApplyAutoLayout={handleAutoLayout}
        />
      )}

      {/* Brain Dump Selection Dialog */}
      <BrainDumpSelectDialog
        isOpen={linkNodeDialog.isOpen}
        entries={entries}
        currentEntryId={currentEntry?.id}
        onSelect={handleLinkNodeSelect}
        onClose={() => setLinkNodeDialog({ isOpen: false, nodeId: null })}
      />

      {/* Synonym Match Dialog */}
      <SynonymMatchDialog
        isOpen={synonymMatchDialog.isOpen}
        matches={synonymMatchDialog.matches}
        inputText={synonymMatchDialog.inputText}
        onCreateNew={() => {
          createNewNode(
            synonymMatchDialog.inputText,
            synonymMatchDialog.type,
            synonymMatchDialog.category,
            synonymMatchDialog.position!
          )
          setSynonymMatchDialog({ ...synonymMatchDialog, isOpen: false })
        }}
        onCreateInstance={prototypeId => {
          const prototype = nodes.find(n => n.id === prototypeId)
          if (prototype && synonymMatchDialog.position) {
            const instance = SynonymService.createInstance(prototype, synonymMatchDialog.position)
            const updatedNodes = [...nodes, instance]
            const updatedPrototype = SynonymService.addInstanceToPrototype(prototype, instance.id)

            // Update both nodes
            const finalNodes = updatedNodes.map(n => (n.id === prototypeId ? updatedPrototype : n))

            setNodes(finalNodes)
            if (currentEntry) {
              updateEntry(currentEntry.id, { nodes: finalNodes as BrainDumpNode[] })
            }
          }
          setSynonymMatchDialog({ ...synonymMatchDialog, isOpen: false })
        }}
        onCreateGhost={referencedNodeId => {
          if (synonymMatchDialog.position) {
            const ghostNode: BrainDumpNode = {
              id: `ghost-${referencedNodeId}-${Date.now()}`,
              type: 'ghost',
              position: synonymMatchDialog.position,
              data: {
                label: synonymMatchDialog.inputText,
                category: synonymMatchDialog.category,
                isGhost: true,
                referencedNodeId,
              },
            }

            const updatedNodes = [...nodes, ghostNode]
            setNodes(updatedNodes)

            if (currentEntry) {
              updateEntry(currentEntry.id, { nodes: updatedNodes })
            }
          }
          setSynonymMatchDialog({ ...synonymMatchDialog, isOpen: false })
        }}
        onClose={() => setSynonymMatchDialog({ ...synonymMatchDialog, isOpen: false })}
      />

      {/* Topic Brain Dump Dialog */}
      <TopicBrainDumpDialog
        isOpen={topicDumpDialog.isOpen}
        node={topicDumpDialog.node}
        parentEntry={currentEntry}
        onConfirm={handleConfirmTopicDump}
        onClose={() => setTopicDumpDialog({ isOpen: false, node: null })}
      />
    </div>
  )
}

export function BrainDumpFlow() {
  return (
    <ReactFlowProvider>
      <BrainDumpFlowInner />
    </ReactFlowProvider>
  )
}
