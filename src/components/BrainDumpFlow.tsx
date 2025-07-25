import { useCallback, useState, useEffect, useMemo } from 'react'
import { logger } from '../services/logger'
import { useAuth } from '../contexts/AuthContext'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  reconnectEdge,
} from '@xyflow/react'
import type { Node, Edge, Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBrainDumpStore } from '../store/braindump'
import { Button } from './Button'
import {
  Maximize2,
  Minimize2,
  Plus,
  ZoomIn,
  Save,
  Check,
  CloudUpload,
  X,
  Loader2,
  Target,
  Lasso,
  Download,
  Grid3X3,
  GitBranch,
  MoreVertical,
  Trash2,
  MousePointer2,
  ArrowLeft,
  ChevronLeft,
} from 'lucide-react'
import type { BrainDumpNode } from '../types/braindump'
import { useFullscreen } from '../hooks/useFullscreen'
import { ConfirmDialog } from './ConfirmDialog'
import { InputDialog } from './InputDialog'
import { EnhancedInputDialog } from './EnhancedInputDialog'
import NodeContextMenu from './NodeContextMenu'
import { PaneContextMenu } from './PaneContextMenu'
import { SynonymMatchDialog } from './SynonymMatchDialog'
import { TopicBrainDumpDialog } from './TopicBrainDumpDialog'
import { EdgeClickMenu } from './EdgeClickMenu'
import { NodeJsonEditor } from './NodeJsonEditor'
import { debounce } from '../lib/debounce'
import { calculateHorizontalLayout, getNewNodePosition } from '../lib/mindMapLayout'
import { cn } from '../lib/utils'
import {
  transformNodeForStorage,
  transformNodeForReactFlow,
  transformNodesForStorage,
} from '../lib/nodeTransform'
// Custom node components
import { CategoryNode } from './nodes/CategoryNode'
import { ThoughtNode } from './nodes/ThoughtNode'
import { RootNode } from './nodes/RootNode'
import { GhostNode } from './nodes/GhostNode'
import { LinkNode } from './nodes/LinkNode'

// Custom edge components
import SimpleFloatingEdge from './edges/SimpleFloatingEdge'

// New hooks
import { useDialogManager } from '../hooks/useDialogManager'
import { useReactFlowState } from '../hooks/useReactFlowState'
import { useFlowVisibility } from '../hooks/useFlowVisibility'
import { useEdgeManager } from '../hooks/useEdgeManager'
import { useFlowEventHandlers } from '../hooks/useFlowEventHandlers'

// Lasso selection component
import { Lasso as LassoComponent } from './Lasso'

// Export functionality
import { ExportDialog } from './ExportDialog'
import { graphToYaml, graphToJson, downloadFile } from '../lib/graphExport'

// Recurrence functionality
import { RecurrenceDialog } from './RecurrenceDialog'

// Eisenhower Matrix view
import { EisenhowerMatrix } from './EisenhowerMatrix'
import { linearToLog } from '../lib/priorityUtils'

const nodeTypes = {
  category: CategoryNode,
  thought: ThoughtNode,
  root: RootNode,
  ghost: GhostNode,
  link: LinkNode,
}

const edgeTypes = {
  floating: SimpleFloatingEdge,
}

function BrainDumpFlowInner() {
  const { fitView, screenToFlowPosition } = useReactFlow()
  const {
    currentEntry,
    updateEntry,
    isSyncing,
    updateNode,
    createTopicBrainDump,
    setCurrentEntry,
    entries,
  } = useBrainDumpStore()

  // UI state
  const { elementRef, isFullscreen, toggleFullscreen } = useFullscreen()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pendingChanges, setPendingChanges] = useState(0)
  // quickDeleteEdges removed - using EdgeClickMenu instead
  const [draggedNode, setDraggedNode] = useState<BrainDumpNode | null>(null)
  const [lassoMode, setLassoMode] = useState<'off' | 'partial' | 'full'>('off')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [topicDumpDialog, setTopicDumpDialog] = useState<{
    isOpen: boolean
    node: BrainDumpNode | null
  }>({
    isOpen: false,
    node: null,
  })
  const [recurrenceDialog, setRecurrenceDialog] = useState<{
    isOpen: boolean
    nodeId: string | null
  }>({
    isOpen: false,
    nodeId: null,
  })

  // Extracted hooks
  const dialogManager = useDialogManager()
  const { nodes, edges, setNodes, setEdges, nodesRef, edgesRef } = useReactFlowState()
  const { visibleNodes, visibleEdges } = useFlowVisibility(nodes, edges)

  // Debounced save function
  const debouncedSave = useMemo(
    () =>
      debounce(async (entryId: string) => {
        if (!currentEntry) return

        try {
          setSaveStatus('saving')
          await updateEntry(entryId, {
            nodes: (nodesRef.current as BrainDumpNode[]) || [],
            edges: edgesRef.current || [],
          })
          setSaveStatus('saved')
          setLastSaved(new Date())
          setPendingChanges(0)
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          logger.error('SAVE', 'Failed to save:', error)
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }, 1000),
    [currentEntry, updateEntry, nodesRef, edgesRef]
  )

  // Edge manager
  const edgeManager = useEdgeManager(nodes, edges, setEdges, nodesRef, edgesRef)

  // Event handlers
  const eventHandlers = useFlowEventHandlers({
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
    setDraggedNode: setDraggedNode as (node: Node | null) => void,
    // quickDeleteEdges removed
    // setDeleteEdgeDialog removed - using EdgeClickMenu instead
    setNodeInputDialog: dialogManager.setNodeInputDialog,
    setSynonymMatchDialog: dialogManager.setSynonymMatchDialog,
    setContextMenu: dialogManager.setContextMenu,
    setSelectedNodeId,
    setEdgeHoverMenu: dialogManager.setEdgeHoverMenu,
    screenToFlowPosition,
    addEdgeBetweenNodes: edgeManager.addEdgeBetweenNodes,
  })

  // Memoize nodeTypes and edgeTypes to prevent React Flow warning
  const memoizedNodeTypes = useMemo(() => nodeTypes, [])
  const memoizedEdgeTypes = useMemo(() => edgeTypes, [])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard shortcuts for lasso mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        // Toggle between off -> partial -> full -> off
        if (lassoMode === 'off') {
          setLassoMode('partial')
        } else if (lassoMode === 'partial') {
          setLassoMode('full')
        } else {
          setLassoMode('off')
        }
      } else if (e.key === 'Escape' && lassoMode !== 'off') {
        setLassoMode('off')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [lassoMode])

  // Auto-layout function
  const handleAutoLayout = useCallback(async () => {
    if (!currentEntry) return

    try {
      setSaveStatus('saving')
      const updatedNodes = calculateHorizontalLayout(nodes as BrainDumpNode[], edges)
      setNodes(updatedNodes)

      await updateEntry(currentEntry.id, { nodes: updatedNodes })
      setSaveStatus('saved')
      setLastSaved(new Date())
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      logger.error('AUTO_LAYOUT', 'Failed to auto-layout:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [nodes, edges, currentEntry, updateEntry, setNodes])

  // Delete edge confirmation removed - now handled by EdgeClickMenu

  // Manual save function
  const handleManualSave = useCallback(async () => {
    if (!currentEntry) return

    debouncedSave.cancel()

    try {
      setSaveStatus('saving')
      await updateEntry(currentEntry.id, {
        nodes: (nodesRef.current as BrainDumpNode[]) || [],
        edges: edgesRef.current || [],
      })
      setSaveStatus('saved')
      setLastSaved(new Date())
      setPendingChanges(0)
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      logger.error('MANUAL_SAVE', 'Failed to save manually:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [currentEntry, updateEntry, nodesRef, edgesRef, debouncedSave])

  // Handle edge reconnection
  const handleEdgeReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      logger.info('EDGE_RECONNECT', 'Reconnecting edge', {
        oldEdgeId: oldEdge.id,
        oldSource: oldEdge.source,
        oldTarget: oldEdge.target,
        newSource: newConnection.source,
        newTarget: newConnection.target,
      })

      const newEdges = reconnectEdge(oldEdge, newConnection, edges)
      setEdges(newEdges)

      // Save the changes
      if (currentEntry) {
        setSaveStatus('saving')
        updateEntry(currentEntry.id, { edges: newEdges })
          .then(() => {
            setSaveStatus('saved')
            setLastSaved(new Date())
            setTimeout(() => setSaveStatus('idle'), 2000)
          })
          .catch(error => {
            logger.error('EDGE_RECONNECT', 'Failed to save reconnected edge:', error)
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
          })
      }
    },
    [edges, setEdges, currentEntry, updateEntry, setSaveStatus, setLastSaved]
  )

  // Handle edge reconnection start
  const handleEdgeReconnectStart = useCallback((event: React.MouseEvent, edge: Edge) => {
    logger.debug('EDGE_RECONNECT', 'Started reconnecting edge', {
      edgeId: edge.id,
      source: edge.source,
      target: edge.target,
    })
  }, [])

  // Handle edge reconnection end
  const handleEdgeReconnectEnd = useCallback((event: React.MouseEvent, edge: Edge) => {
    logger.debug('EDGE_RECONNECT', 'Finished reconnecting edge', {
      edgeId: edge.id,
      source: edge.source,
      target: edge.target,
    })
  }, [])

  // Custom event listeners for node interactions
  useEffect(() => {
    const handleAddChild = (event: CustomEvent) => {
      const { nodeId } = event.detail
      const parentNode = nodes.find(n => n.id === nodeId)
      if (!parentNode) return

      const newNodePosition = getNewNodePosition(parentNode, nodes)
      dialogManager.setNodeInputDialog({
        isOpen: true,
        position: newNodePosition,
        parentNodeId: nodeId, // Store parent node ID for edge creation
      })
    }

    const handleNodeDrop = (event: CustomEvent) => {
      const { droppedNodeId, targetNodeId } = event.detail
      if (droppedNodeId && targetNodeId) {
        edgeManager.addEdgeBetweenNodes(targetNodeId, droppedNodeId)
      }
    }

    window.addEventListener('node:addChild', handleAddChild as EventListener)
    window.addEventListener('node:drop', handleNodeDrop as EventListener)

    return () => {
      window.removeEventListener('node:addChild', handleAddChild as EventListener)
      window.removeEventListener('node:drop', handleNodeDrop as EventListener)
    }
  }, [nodes, dialogManager.setNodeInputDialog, edgeManager.addEdgeBetweenNodes])

  // Topic dump handlers
  const handleCreateTopicDump = useCallback(
    (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId) as BrainDumpNode
      if (node) {
        setTopicDumpDialog({ isOpen: true, node })
      }
    },
    [nodes]
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
          childEdges.forEach(edge => {
            if (!collectedNodes.has(edge.target)) {
              gatherChildNodes(edge.target, collectedNodes)
            }
          })

          return collectedNodes
        }

        // Gather all nodes in this branch
        const nodeIds = Array.from(gatherChildNodes(topicDumpDialog.node.id))
        const branchNodes = (nodes as BrainDumpNode[]).filter(n => nodeIds.includes(n.id))
        const branchEdges = edges.filter(
          e => nodeIds.includes(e.source) && nodeIds.includes(e.target)
        )

        logger.info('TOPIC_DUMP', 'Gathered branch data', {
          nodeCount: branchNodes.length,
          edgeCount: branchEdges.length,
          nodeIds,
        })

        // Create the topic-focused brain dump
        const result = await createTopicBrainDump({
          parentBrainDumpId: currentEntry.id,
          originNodeId: topicDumpDialog.node.id,
          topicFocus: topicDumpDialog.node.data.label,
          thoughts,
          nodes: branchNodes,
          edges: branchEdges,
        })

        logger.info('TOPIC_DUMP', 'Created topic brain dump', {
          newEntryId: result.id,
          success: true,
        })

        // Convert the original node to a ghost node
        const ghostNode: BrainDumpNode = {
          ...topicDumpDialog.node,
          type: 'ghost',
          data: {
            ...topicDumpDialog.node.data,
            referencedNodeId: topicDumpDialog.node.id,
            label: `→ ${topicDumpDialog.node.data.label}`,
            hasTopicBrainDump: true,
            topicBrainDumpId: result.id,
            isGhost: true,
          },
        }

        // Update nodes - replace original with ghost
        const updatedNodes = (nodes as BrainDumpNode[]).map(n =>
          n.id === topicDumpDialog.node!.id ? ghostNode : n
        )
        setNodes(updatedNodes)

        // Persist the changes
        await updateEntry(currentEntry.id, {
          nodes: updatedNodes,
        })

        setTopicDumpDialog({ isOpen: false, node: null })

        // Navigate to the new topic brain dump
        setCurrentEntry(result)
      } catch (error) {
        logger.error('TOPIC_DUMP', 'Failed to create topic dump', { error })
      }
    },
    [
      topicDumpDialog.node,
      currentEntry,
      nodes,
      edges,
      createTopicBrainDump,
      updateNode,
      setCurrentEntry,
    ]
  )

  if (!currentEntry) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No Brain Dump Selected</h2>
          <p className="text-gray-600 mb-4">Select or create a brain dump to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={elementRef} className="w-full h-full relative touch-pan-y">
      {viewMode === 'graph' ? (
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={eventHandlers.onNodesChange}
          onEdgesChange={eventHandlers.onEdgesChange}
          onConnect={edgeManager.onConnect}
          onEdgesDelete={edgeManager.onEdgesDelete}
          onEdgeClick={eventHandlers.onEdgeClick}
          onNodeClick={eventHandlers.onNodeClick}
          onNodeContextMenu={eventHandlers.onNodeContextMenu}
          onPaneContextMenu={eventHandlers.onPaneContextMenu as any}
          onReconnect={handleEdgeReconnect as any}
          onReconnectStart={handleEdgeReconnectStart as any}
          onReconnectEnd={handleEdgeReconnectEnd as any}
          onConnectEnd={eventHandlers.onConnectEnd}
          reconnectRadius={20}
          panOnScroll={false}
          preventScrolling={true}
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          onPaneClick={(event: any) => {
            // Close edge hover menu when clicking on pane
            dialogManager.setEdgeHoverMenu({ isOpen: false, edge: null, position: { x: 0, y: 0 } })

            // Don't create nodes if in lasso mode
            if (lassoMode !== 'off') return

            if (event.detail === 2) {
              const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
              })
              dialogManager.setNodeInputDialog({
                isOpen: true,
                position,
              })
            }
          }}
          onNodeDoubleClick={eventHandlers.onNodeDoubleClick}
          onNodeDragStart={eventHandlers.onNodeDragStart}
          onNodeDragStop={eventHandlers.onNodeDragStop}
          nodeTypes={memoizedNodeTypes}
          edgeTypes={memoizedEdgeTypes}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            deletable: true,
            type: 'floating',
            reconnectable: true,
            animated: true,
            markerEnd: undefined,
          }}
          connectionMode={'loose' as any}
          className="bg-white"
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
          }}
          nodeOrigin={[0.5, 0.5]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          // Disable pan and drag when in lasso mode
          panOnDrag={lassoMode === 'off'}
          nodesDraggable={lassoMode === 'off'}
          elementsSelectable={lassoMode === 'off'}
        >
          <Background />
          <Controls showInteractive={false} />
          <LassoComponent
            partial={lassoMode === 'partial'}
            isActive={lassoMode !== 'off'}
            onSelectionComplete={() => {
              // Optionally auto-exit lasso mode after selection
              // setLassoMode('off')
            }}
          />
          <MiniMap
            nodeStrokeColor={(n: BrainDumpNode) => {
              if (n.type === 'category') return '#3b82f6'
              if (n.type === 'thought') return '#10b981'
              if (n.type === 'root') return '#8b5cf6'
              return '#6b7280'
            }}
            nodeColor={(n: BrainDumpNode) => {
              if (n.type === 'category') return '#dbeafe'
              if (n.type === 'thought') return '#d1fae5'
              if (n.type === 'root') return '#e9d5ff'
              return '#f3f4f6'
            }}
            nodeBorderRadius={8}
            pannable
            zoomable
            position="bottom-right"
          />
        </ReactFlow>
      ) : (
        <EisenhowerMatrix
          nodes={visibleNodes}
          edges={visibleEdges}
          selectedNodes={selectedNodeId ? [selectedNodeId] : []}
          onNodeClick={nodeId => {
            setSelectedNodeId(nodeId)
          }}
          onNodeDoubleClick={nodeId => {
            const node = visibleNodes.find(n => n.id === nodeId)
            if (node) {
              eventHandlers.onNodeDoubleClick(undefined as any, node)
            }
          }}
          onNodeDragEnd={(nodeId, importance, urgency) => {
            // Convert linear values to log scale
            const logImportance = linearToLog(importance)
            const logUrgency = linearToLog(urgency)

            // Update the node with new priority values
            const updateNode = nodes.find(n => n.id === nodeId)
            if (updateNode) {
              const updatedNode = {
                ...updateNode,
                data: {
                  ...updateNode.data,
                  importance: logImportance,
                  urgency: logUrgency,
                },
              }
              setNodes(nodes.map(n => (n.id === nodeId ? updatedNode : n)))
            }
          }}
          onNodeContextMenu={(nodeId, position) => {
            const node = visibleNodes.find(n => n.id === nodeId)
            if (node) {
              dialogManager.setContextMenu({
                isOpen: true,
                type: 'node',
                position,
                nodeId,
                nodeData: node.data,
              })
            }
          }}
        />
      )}

      {/* Toolbar */}
      <div
        className="absolute left-4 z-10 flex gap-2 bg-white rounded-lg shadow-lg p-2"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        {/* Back to parent brain dump button */}
        {currentEntry?.parentBrainDumpId && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const parentEntry = entries.find(e => e.id === currentEntry.parentBrainDumpId)
                if (parentEntry) {
                  setCurrentEntry(parentEntry)
                  logger.info('NAVIGATION', 'Navigated back to parent brain dump', {
                    parentId: parentEntry.id,
                    parentTitle: parentEntry.title,
                  })
                }
              }}
              className="flex items-center gap-1"
              title="Go back to parent brain dump"
            >
              <ArrowLeft className="w-4 h-4" />
              {isMobile ? '' : 'Back'}
            </Button>
            <div className="border-l h-6 border-gray-300" />
          </>
        )}

        {/* Primary actions - always visible */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => dialogManager.setNodeInputDialog({ isOpen: true, position: null })}
          disabled={!currentEntry}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {isMobile ? '' : 'Add Node'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="flex items-center gap-1"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {isMobile ? '' : isFullscreen ? 'Exit' : 'Fullscreen'}
        </Button>

        {/* Desktop controls */}
        {!isMobile && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoLayout}
              disabled={!currentEntry || nodes.length === 0}
              className="flex items-center gap-1"
            >
              <Target className="w-4 h-4" />
              Auto Layout
            </Button>

            <div className="flex items-center gap-1 border-l pl-2 ml-1">
              <Button
                variant={lassoMode === 'partial' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setLassoMode(lassoMode === 'partial' ? 'off' : 'partial')}
                disabled={!currentEntry}
                className="flex items-center gap-1"
                title="Partial lasso select - select nodes touched by lasso"
              >
                <Lasso className="w-4 h-4" />
                {lassoMode === 'partial' && 'Partial'}
              </Button>

              <Button
                variant={lassoMode === 'full' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setLassoMode(lassoMode === 'full' ? 'off' : 'full')}
                disabled={!currentEntry}
                className="flex items-center gap-1"
                title="Full lasso select - select nodes fully enclosed by lasso"
              >
                <Lasso className="w-4 h-4" />
                {lassoMode === 'full' && 'Full'}
              </Button>
            </div>

            <div className="flex items-center gap-1 border-l pl-2 ml-1">
              <Button
                variant={viewMode === 'graph' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('graph')}
                disabled={!currentEntry}
                className="flex items-center gap-1"
                title="Graph view"
              >
                <GitBranch className="w-4 h-4" />
                Graph
              </Button>

              <Button
                variant={viewMode === 'matrix' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('matrix')}
                disabled={!currentEntry}
                className="flex items-center gap-1"
                title="Eisenhower Matrix view"
              >
                <Grid3X3 className="w-4 h-4" />
                Matrix
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fitView({ padding: 0.2 })}
              disabled={!currentEntry}
              className="flex items-center gap-1"
              title="Fit all nodes in view"
            >
              <ZoomIn className="w-4 h-4" />
              Fit View
            </Button>
          </>
        )}

        {/* Mobile menu */}
        {isMobile && (
          <div className="relative mobile-menu-container">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-1"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showMobileMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 min-w-[200px] z-50">
                {/* Back to parent brain dump button for mobile */}
                {currentEntry?.parentBrainDumpId && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const parentEntry = entries.find(
                          e => e.id === currentEntry.parentBrainDumpId
                        )
                        if (parentEntry) {
                          setCurrentEntry(parentEntry)
                          setShowMobileMenu(false)
                          logger.info(
                            'NAVIGATION',
                            'Navigated back to parent brain dump (mobile)',
                            {
                              parentId: parentEntry.id,
                              parentTitle: parentEntry.title,
                            }
                          )
                        }
                      }}
                      className="w-full justify-start mb-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Parent
                    </Button>
                    <div className="border-t my-2" />
                  </>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleAutoLayout()
                    setShowMobileMenu(false)
                  }}
                  disabled={!currentEntry || nodes.length === 0}
                  className="w-full justify-start mb-1"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Auto Layout
                </Button>

                <div className="border-t my-2" />

                <Button
                  variant={lassoMode !== 'off' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setLassoMode(
                      lassoMode === 'off' ? 'partial' : lassoMode === 'partial' ? 'full' : 'off'
                    )
                    setShowMobileMenu(false)
                  }}
                  disabled={!currentEntry}
                  className="w-full justify-start mb-1"
                >
                  <Lasso className="w-4 h-4 mr-2" />
                  Lasso Mode {lassoMode !== 'off' && `(${lassoMode})`}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    fitView({ padding: 0.2 })
                    setShowMobileMenu(false)
                  }}
                  disabled={!currentEntry}
                  className="w-full justify-start mb-1"
                >
                  <ZoomIn className="w-4 h-4 mr-2" />
                  Fit View
                </Button>

                <div className="border-t my-2" />

                <Button
                  variant={viewMode === 'graph' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setViewMode('graph')
                    setShowMobileMenu(false)
                  }}
                  disabled={!currentEntry}
                  className="w-full justify-start mb-1"
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Graph View
                </Button>

                <Button
                  variant={viewMode === 'matrix' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setViewMode('matrix')
                    setShowMobileMenu(false)
                  }}
                  disabled={!currentEntry}
                  className="w-full justify-start mb-1"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Matrix View
                </Button>

                <div className="border-t my-2" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowExportDialog(true)
                    setShowMobileMenu(false)
                  }}
                  disabled={!currentEntry}
                  className="w-full justify-start mb-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>

                {/* Delete Mode button removed - deleteMode not available on dialogManager */}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lasso Mode Indicator */}
      {lassoMode !== 'off' && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <Lasso className="w-4 h-4" />
          <span className="font-medium">
            {lassoMode === 'partial' ? 'Partial' : 'Full'} Lasso Mode
          </span>
          <span className="text-sm opacity-75">(Press ESC to exit)</span>
        </div>
      )}

      {/* Back Navigation for Topic Brain Dumps */}
      {currentEntry?.type === 'topic-focused' && currentEntry?.parentBrainDumpId && (
        <div
          className={cn(
            'absolute z-10 flex items-center gap-2',
            isMobile ? 'top-4 left-4' : 'left-4'
          )}
          style={{
            top: !isMobile ? 'calc(1rem + env(safe-area-inset-top))' : undefined,
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const parentEntry = entries.find(e => e.id === currentEntry.parentBrainDumpId)
              if (parentEntry) {
                setCurrentEntry(parentEntry)
                logger.info('NAVIGATION', 'Navigated back to parent brain dump', {
                  parentId: parentEntry.id,
                  parentTitle: parentEntry.title,
                })
              }
            }}
            className="flex items-center gap-2 bg-white shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Parent
          </Button>
          <div className="bg-white rounded-lg shadow-lg px-3 py-1">
            <p className="text-sm text-gray-600">
              Topic: <span className="font-medium">{currentEntry.topicFocus}</span>
            </p>
          </div>
        </div>
      )}

      {/* Save Status */}
      <div
        className={cn(
          'absolute z-10 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2',
          isMobile ? 'bottom-20 left-4 right-4 justify-between' : 'right-4'
        )}
        style={{
          top: !isMobile ? 'calc(1rem + env(safe-area-inset-top))' : undefined,
        }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualSave}
          disabled={saveStatus === 'saving' || pendingChanges === 0}
          className="flex items-center gap-1"
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : saveStatus === 'error' ? (
            <X className="w-4 h-4 text-red-600" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isMobile ? '' : 'Save'}
        </Button>

        {pendingChanges > 0 && (
          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {pendingChanges} pending
          </span>
        )}

        {!isMobile && (
          <div className="border-l pl-2 ml-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              disabled={!currentEntry || nodes.length === 0}
              className="flex items-center gap-1"
              title="Export brain dump"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!currentEntry || !user) return

                try {
                  setSaveStatus('saving')
                  const { firebaseService } = await import('../services/firebase')

                  // Save all non-root nodes to Firestore
                  const nodesToSave = nodes.filter(n => n.type !== 'root')
                  const transformedNodes = transformNodesForStorage(nodesToSave)

                  for (const node of transformedNodes) {
                    await firebaseService.saveUnifiedNode(user.id, {
                      ...node,
                      brainDumpId: currentEntry.id,
                      brainDumpTitle: currentEntry.title,
                    })
                  }

                  setSaveStatus('saved')
                  setLastSaved(new Date())
                  setTimeout(() => setSaveStatus('idle'), 2000)
                } catch (error) {
                  console.error('Failed to save to Firestore:', error)
                  setSaveStatus('error')
                  setTimeout(() => setSaveStatus('idle'), 3000)
                }
              }}
              disabled={!currentEntry || nodes.length === 0}
              className="flex items-center gap-1"
              title="Save nodes to Firebase Firestore"
            >
              <CloudUpload className="w-4 h-4" />
              Save to DB
            </Button>
          </div>
        )}

        {lastSaved && !isMobile && (
          <span className="text-xs text-gray-500">{lastSaved.toLocaleTimeString()}</span>
        )}

        {isSyncing && (
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <CloudUpload className="w-4 h-4" />
            {!isMobile && 'Syncing...'}
          </div>
        )}
      </div>

      {/* Dialogs */}

      <EnhancedInputDialog
        isOpen={dialogManager.nodeInputDialog.isOpen}
        title="Quick Add"
        placeholder="What's on your mind?"
        onSubmit={(text: string, nodeData?: any) => {
          // Use provided position or calculate center of viewport
          let position = dialogManager.nodeInputDialog.position
          if (!position) {
            // Get center of viewport in flow coordinates
            const viewportCenter = screenToFlowPosition({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            })
            position = viewportCenter
          }
          eventHandlers.handleNodeInputSubmit(
            text,
            'thought',
            position,
            dialogManager.nodeInputDialog.parentNodeId,
            nodeData
          )
        }}
        onCancel={() =>
          dialogManager.setNodeInputDialog({
            isOpen: false,
            position: null,
            parentNodeId: undefined,
          })
        }
      />

      <NodeContextMenu
        isOpen={dialogManager.contextMenu.isOpen && dialogManager.contextMenu.type === 'node'}
        position={dialogManager.contextMenu.position}
        nodeId={dialogManager.contextMenu.nodeId || ''}
        nodeData={dialogManager.contextMenu.nodeData || {}}
        onStyleChange={async (nodeId: string, style: any) => {
          const node = nodes.find(n => n.id === nodeId)
          if (!node) return

          // Update the node with new style
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              style,
            },
          } as BrainDumpNode

          const updatedNodes = (nodes as BrainDumpNode[]).map(n =>
            n.id === nodeId ? updatedNode : n
          )
          setNodes(updatedNodes)

          // Persist the changes
          if (currentEntry) {
            setSaveStatus('saving')
            try {
              await updateEntry(currentEntry.id, {
                nodes: updatedNodes,
              })
              setSaveStatus('saved')
              setLastSaved(new Date())
              setTimeout(() => setSaveStatus('idle'), 2000)
            } catch (error) {
              logger.error('STYLE_CHANGE', 'Failed to save style change:', error)
              setSaveStatus('error')
              setTimeout(() => setSaveStatus('idle'), 3000)
            }
          }
        }}
        onMakeLink={() => {}}
        onDelete={async (nodeId: string) => {
          const node = nodes.find(n => n.id === nodeId)
          if (node?.type === 'root') {
            logger.warn('NODE_DELETE', 'Cannot delete root node')
            return
          }

          debouncedSave.cancel()

          // Only update local state - avoid calling store.deleteNode to prevent render conflicts

          const updatedNodes = (nodes as BrainDumpNode[]).filter(n => n.id !== nodeId)
          const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId)

          setNodes(updatedNodes)
          setEdges(updatedEdges)

          if (currentEntry) {
            setSaveStatus('saving')
            try {
              await updateEntry(currentEntry.id, {
                nodes: updatedNodes,
                edges: updatedEdges,
              })
              setSaveStatus('saved')
              setLastSaved(new Date())
              setTimeout(() => setSaveStatus('idle'), 2000)
            } catch (error) {
              logger.error('DELETE_NODE', 'Failed to delete node:', error)
              setSaveStatus('error')
              setTimeout(() => setSaveStatus('idle'), 3000)
            }
          }
        }}
        onLayoutModeChange={async (nodeId: string, layoutMode: 'horizontal' | 'freeform') => {
          const { updateNode } = useBrainDumpStore.getState()
          const node = nodes.find(n => n.id === nodeId)
          if (node) {
            await updateNode(nodeId, { layoutMode })

            // If switching to horizontal layout, auto-arrange children
            if (layoutMode === 'horizontal') {
              const childEdges = edges.filter(e => e.source === nodeId)
              if (childEdges.length > 0) {
                // Auto-arrange children horizontally
                const baseX = node.position.x + 250
                const baseY = node.position.y
                const spacing = 100

                const updatedNodes = (nodes as BrainDumpNode[]).map(n => {
                  const childEdge = childEdges.find(e => e.target === n.id)
                  if (childEdge) {
                    const childIndex = childEdges.findIndex(e => e.target === n.id)
                    return {
                      ...n,
                      position: {
                        x: baseX,
                        y: baseY + (childIndex - childEdges.length / 2) * spacing,
                      },
                    }
                  }
                  return n
                })

                // Update edges to use horizontal handles
                const updatedEdges = edges.map(e => {
                  if (e.source === nodeId) {
                    return {
                      ...e,
                      type: 'floating',
                      sourceHandle: 'right-source',
                      targetHandle: 'left',
                    }
                  }
                  return e
                })

                setNodes(updatedNodes)
                setEdges(updatedEdges)

                if (currentEntry) {
                  await updateEntry(currentEntry.id, {
                    nodes: updatedNodes,
                    edges: updatedEdges,
                  })
                }
              }
            }
          }
        }}
        onAutoLayout={() => {}}
        onCreateGhost={() => {}}
        onUpdateSynonyms={() => {}}
        onCreateTopicDump={handleCreateTopicDump}
        onDissolveTopicDump={() => {}}
        onAddChild={(nodeId: string) => {
          const parentNode = nodes.find(n => n.id === nodeId)
          if (!parentNode) return

          // Check if parent has topic brain dump
          if (parentNode.data?.hasTopicBrainDump) {
            logger.info(
              'NODE_ADD_CHILD',
              'Cannot add children to nodes that have topic brain dumps'
            )
            return
          }

          // Calculate position for new node
          const childCount = edges.filter(e => e.source === nodeId).length
          const offsetX = parentNode.data?.layoutMode === 'horizontal' ? 250 : 100
          const offsetY = parentNode.data?.layoutMode === 'horizontal' ? childCount * 80 : 100

          const position = {
            x: parentNode.position.x + offsetX,
            y: parentNode.position.y + offsetY,
          }

          // Open the input dialog
          dialogManager.setNodeInputDialog({ isOpen: true, position })
          setSelectedNodeId(nodeId)
        }}
        onNodeTypeChange={() => {}}
        onUpdateNode={async (nodeId: string, data: any) => {
          const node = nodes.find(n => n.id === nodeId)
          if (!node) return

          // Update the node with new data
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          }

          const updatedNodes = (nodes as BrainDumpNode[]).map(n =>
            n.id === nodeId ? updatedNode : n
          )
          setNodes(updatedNodes)

          // Persist the changes
          if (currentEntry) {
            setSaveStatus('saving')
            try {
              await updateEntry(currentEntry.id, {
                nodes: updatedNodes,
              })
              setSaveStatus('saved')
              setLastSaved(new Date())
              setTimeout(() => setSaveStatus('idle'), 2000)
            } catch (error) {
              logger.error('UPDATE_NODE', 'Failed to update node:', error)
              setSaveStatus('error')
              setTimeout(() => setSaveStatus('idle'), 3000)
            }
          }
        }}
        onMakeRecurring={(nodeId: string) => {
          setRecurrenceDialog({ isOpen: true, nodeId })
        }}
        onEditJson={(nodeId: string) => {
          const node = nodes.find(n => n.id === nodeId)
          if (node) {
            // Transform node to have React Flow properties nested
            const transformedNode = transformNodeForStorage(node)
            dialogManager.setJsonEditor({
              isOpen: true,
              node: transformedNode,
              nodeId,
            })
          }
        }}
        onClose={() =>
          dialogManager.setContextMenu({ ...dialogManager.contextMenu, isOpen: false })
        }
      />

      <PaneContextMenu
        isOpen={dialogManager.contextMenu.isOpen && dialogManager.contextMenu.type === 'pane'}
        position={dialogManager.contextMenu.position}
        flowPosition={screenToFlowPosition(dialogManager.contextMenu.position)}
        onAddNode={(
          text: string,
          type: string,
          category: string,
          position: { x: number; y: number },
          nodeData?: any
        ) => {
          eventHandlers.handleNodeInputSubmit(text, type as 'thought' | 'category', position, undefined, nodeData)
        }}
        onApplyAutoLayout={handleAutoLayout}
        onClose={() =>
          dialogManager.setContextMenu({ ...dialogManager.contextMenu, isOpen: false })
        }
      />

      <SynonymMatchDialog
        isOpen={dialogManager.synonymMatchDialog.isOpen}
        matches={dialogManager.synonymMatchDialog.matches}
        inputText={dialogManager.synonymMatchDialog.inputText}
        onCreateNew={() => {
          if (dialogManager.synonymMatchDialog.position) {
            eventHandlers.handleNodeInputSubmit(
              dialogManager.synonymMatchDialog.inputText,
              dialogManager.synonymMatchDialog.type as 'thought' | 'category',
              dialogManager.synonymMatchDialog.position
            )
          }
          dialogManager.setSynonymMatchDialog({
            ...dialogManager.synonymMatchDialog,
            isOpen: false,
          })
        }}
        onCreateInstance={() => {}}
        onCreateGhost={referencedNodeId => {
          if (dialogManager.synonymMatchDialog.position) {
            const ghostNode: BrainDumpNode = {
              id: `ghost-${referencedNodeId}-${Date.now()}`,
              type: 'ghost',
              position: dialogManager.synonymMatchDialog.position,
              data: {
                label: dialogManager.synonymMatchDialog.inputText,
                category: dialogManager.synonymMatchDialog.category,
                isGhost: true,
                referencedNodeId,
              },
            }

            const updatedNodes = [...(nodes as BrainDumpNode[]), ghostNode]
            setNodes(updatedNodes)

            if (currentEntry) {
              updateEntry(currentEntry.id, { nodes: updatedNodes })
            }
          }
          dialogManager.setSynonymMatchDialog({
            ...dialogManager.synonymMatchDialog,
            isOpen: false,
          })
        }}
        onClose={() =>
          dialogManager.setSynonymMatchDialog({
            ...dialogManager.synonymMatchDialog,
            isOpen: false,
          })
        }
      />

      <TopicBrainDumpDialog
        isOpen={topicDumpDialog.isOpen}
        node={topicDumpDialog.node}
        parentEntry={currentEntry}
        onConfirm={handleConfirmTopicDump}
        onClose={() => setTopicDumpDialog({ isOpen: false, node: null })}
      />

      {/* Edge Click Menu */}
      <EdgeClickMenu
        edge={dialogManager.edgeHoverMenu.edge}
        position={dialogManager.edgeHoverMenu.position}
        isVisible={dialogManager.edgeHoverMenu.isOpen}
        onLabel={(edgeId: string, label: string) => {
          const updatedEdges = edges.map(e => (e.id === edgeId ? { ...e, label } : e))
          setEdges(updatedEdges)

          if (currentEntry) {
            updateEntry(currentEntry.id, { edges: updatedEdges })
              .then(() => {
                setSaveStatus('saved')
                setLastSaved(new Date())
                setTimeout(() => setSaveStatus('idle'), 2000)
              })
              .catch(error => {
                logger.error('EDGE_LABEL', 'Failed to save edge label:', error)
                setSaveStatus('error')
                setTimeout(() => setSaveStatus('idle'), 3000)
              })
          }
        }}
        onDelete={(edge: Edge) => {
          eventHandlers.handleDeleteEdge(edge)
          dialogManager.setEdgeHoverMenu({ isOpen: false, edge: null, position: { x: 0, y: 0 } })
        }}
        // Reconnection options removed - users now have multiple handles per node for easy connections
        onClose={() =>
          dialogManager.setEdgeHoverMenu({ isOpen: false, edge: null, position: { x: 0, y: 0 } })
        }
      />

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={true}
          yamlContent={graphToYaml(nodes, edges)}
          jsonContent={graphToJson(nodes, edges)}
          filename={`${currentEntry?.title || 'braindump'}-${new Date().toISOString().split('T')[0]}`}
          onClose={() => setShowExportDialog(false)}
          onExport={format => {
            const content =
              format === 'yaml' ? graphToYaml(nodes, edges) : graphToJson(nodes, edges)
            const extension = format === 'yaml' ? 'yml' : 'json'
            const mimeType = format === 'yaml' ? 'text/yaml' : 'application/json'
            const filename = `${currentEntry?.title || 'braindump'}-${new Date().toISOString().split('T')[0]}.${extension}`

            downloadFile(content, filename, mimeType)
            setShowExportDialog(false)
          }}
        />
      )}

      {/* Recurrence Dialog */}
      {recurrenceDialog.isOpen &&
        recurrenceDialog.nodeId &&
        (() => {
          const node = nodes.find(n => n.id === recurrenceDialog.nodeId)
          if (!node) return null

          return (
            <RecurrenceDialog
              taskId={recurrenceDialog.nodeId}
              taskLabel={node.data.label as string}
              currentPattern={node.data.recurrencePattern as any}
              currentTaskType={node.data.taskType as any}
              onSave={async (taskId, pattern, taskType) => {
                const targetNode = nodes.find(n => n.id === taskId)
                if (!targetNode) return

                // Update the node with recurrence data
                const updatedNode = {
                  ...targetNode,
                  data: {
                    ...targetNode.data,
                    taskType,
                    recurrencePattern: pattern,
                  },
                } as BrainDumpNode

                const updatedNodes = (nodes as BrainDumpNode[]).map(n =>
                  n.id === taskId ? updatedNode : n
                )
                setNodes(updatedNodes)

                // Persist the changes
                if (currentEntry) {
                  setSaveStatus('saving')
                  try {
                    await updateEntry(currentEntry.id, {
                      nodes: updatedNodes,
                    })
                    setSaveStatus('saved')
                    setLastSaved(new Date())
                    setTimeout(() => setSaveStatus('idle'), 2000)
                  } catch (error) {
                    logger.error('UPDATE_RECURRENCE', 'Failed to update recurrence:', error)
                    setSaveStatus('error')
                    setTimeout(() => setSaveStatus('idle'), 3000)
                  }
                }

                setRecurrenceDialog({ isOpen: false, nodeId: null })
              }}
              onClose={() => setRecurrenceDialog({ isOpen: false, nodeId: null })}
            />
          )
        })()}

      {/* JSON Editor Dialog */}
      <NodeJsonEditor
        node={dialogManager.jsonEditor.node}
        isOpen={dialogManager.jsonEditor.isOpen}
        onClose={() => dialogManager.setJsonEditor({ isOpen: false, node: null, nodeId: null })}
        onSave={async updatedNode => {
          const nodeId = dialogManager.jsonEditor.nodeId
          if (!nodeId) return

          // Transform the edited node back to React Flow format
          const reactFlowNode = transformNodeForReactFlow(updatedNode)

          // Update the node in the flow
          const updatedNodes = (nodes as BrainDumpNode[]).map(n =>
            n.id === nodeId ? reactFlowNode : n
          )
          setNodes(updatedNodes)

          // Persist the changes
          if (currentEntry) {
            setSaveStatus('saving')
            try {
              await updateEntry(currentEntry.id, { nodes: updatedNodes })
              setSaveStatus('saved')
              setLastSaved(new Date())
              setTimeout(() => setSaveStatus('idle'), 2000)
            } catch (error) {
              logger.error('JSON_EDITOR_SAVE', 'Failed to save node:', error)
              setSaveStatus('error')
              setTimeout(() => setSaveStatus('idle'), 3000)
            }
          }

          dialogManager.setJsonEditor({ isOpen: false, node: null, nodeId: null })
        }}
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
