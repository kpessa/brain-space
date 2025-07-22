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
} from 'lucide-react'
import type { BrainDumpNode } from '../types/braindump'
import { useFullscreen } from '../hooks/useFullscreen'
import { ConfirmDialog } from './ConfirmDialog'
import { InputDialog } from './InputDialog'
import NodeContextMenu from './NodeContextMenu'
import { PaneContextMenu } from './PaneContextMenu'
import { SynonymMatchDialog } from './SynonymMatchDialog'
import { TopicBrainDumpDialog } from './TopicBrainDumpDialog'
import { EdgeClickMenu } from './EdgeClickMenu'
import { debounce } from '../lib/debounce'
import { calculateHorizontalLayout, getNewNodePosition } from '../lib/mindMapLayout'
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
  const { currentEntry, updateEntry, isSyncing, updateNode, createTopicBrainDump } = useBrainDumpStore()

  // UI state
  const { elementRef, isFullscreen, toggleFullscreen } = useFullscreen()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pendingChanges, setPendingChanges] = useState(0)
  // quickDeleteEdges removed - using EdgeClickMenu instead
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)
  const [lassoMode, setLassoMode] = useState<'off' | 'partial' | 'full'>('off')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph')
  const [topicDumpDialog, setTopicDumpDialog] = useState<{
    isOpen: boolean
    node: BrainDumpNode | null
  }>({
    isOpen: false,
    node: null,
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
            nodes: nodesRef.current || [],
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
    setDraggedNode,
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
      const updatedNodes = calculateHorizontalLayout(nodes, edges)
      setNodes(updatedNodes)

      await updateEntry(currentEntry.id, { nodes: updatedNodes as BrainDumpNode[] })
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
        nodes: nodesRef.current || [],
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
      const node = nodes.find(n => n.id === nodeId)
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
        const branchNodes = nodes.filter(n => nodeIds.includes(n.id))
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

        // Update the original node to show it has a topic dump
        await updateNode(topicDumpDialog.node.id, {
          hasTopicBrainDump: true,
          topicBrainDumpId: result.id,
        })

        setTopicDumpDialog({ isOpen: false, node: null })
      } catch (error) {
        logger.error('TOPIC_DUMP', 'Failed to create topic dump', { error })
        logger.error('TOPIC_DUMP', 'Failed to create topic dump', { error })
      }
    },
    [topicDumpDialog.node, currentEntry, nodes, edges, createTopicBrainDump, updateNode]
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
    <div ref={elementRef} className="w-full h-full relative">
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
          onPaneContextMenu={eventHandlers.onPaneContextMenu}
          onReconnect={handleEdgeReconnect}
          onReconnectStart={handleEdgeReconnectStart}
          onReconnectEnd={handleEdgeReconnectEnd}
          onConnectEnd={eventHandlers.onConnectEnd}
          reconnectRadius={20}
          onPaneClick={(event: React.MouseEvent) => {
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
          connectionMode="loose"
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
            nodeStrokeColor={(n: Node) => {
              if (n.type === 'category') return '#3b82f6'
              if (n.type === 'thought') return '#10b981'
              if (n.type === 'root') return '#8b5cf6'
              return '#6b7280'
            }}
            nodeColor={(n: Node) => {
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
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white rounded-lg shadow-lg p-2">
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
          onClick={handleAutoLayout}
          disabled={!currentEntry || nodes.length === 0}
          className="flex items-center gap-1"
        >
          <Target className="w-4 h-4" />
          {isMobile ? '' : 'Auto Layout'}
        </Button>

        <div className="flex items-center gap-1 border-l pl-2 ml-1">
          <Button
            variant={lassoMode === 'partial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLassoMode(lassoMode === 'partial' ? 'off' : 'partial')}
            disabled={!currentEntry}
            className="flex items-center gap-1"
            title="Partial lasso select - select nodes touched by lasso"
          >
            <Lasso className="w-4 h-4" />
            {!isMobile && lassoMode === 'partial' && 'Partial'}
          </Button>

          <Button
            variant={lassoMode === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLassoMode(lassoMode === 'full' ? 'off' : 'full')}
            disabled={!currentEntry}
            className="flex items-center gap-1"
            title="Full lasso select - select nodes fully enclosed by lasso"
          >
            <Lasso className="w-4 h-4" />
            {!isMobile && lassoMode === 'full' && 'Full'}
          </Button>
        </div>

        <div className="flex items-center gap-1 border-l pl-2 ml-1">
          <Button
            variant={viewMode === 'graph' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('graph')}
            disabled={!currentEntry}
            className="flex items-center gap-1"
            title="Graph view"
          >
            <GitBranch className="w-4 h-4" />
            {!isMobile && 'Graph'}
          </Button>

          <Button
            variant={viewMode === 'matrix' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('matrix')}
            disabled={!currentEntry}
            className="flex items-center gap-1"
            title="Eisenhower Matrix view"
          >
            <Grid3X3 className="w-4 h-4" />
            {!isMobile && 'Matrix'}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fitView({ padding: 0.2 })}
          disabled={!currentEntry}
          className="flex items-center gap-1"
          title="Fit all nodes in view. Tip: Drag edge endpoints to reconnect them!"
        >
          <ZoomIn className="w-4 h-4" />
          {isMobile ? '' : 'Fit View'}
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
      </div>

      {/* Lasso Mode Indicator */}
      {lassoMode !== 'off' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Lasso className="w-4 h-4" />
          <span className="font-medium">
            {lassoMode === 'partial' ? 'Partial' : 'Full'} Lasso Mode
          </span>
          <span className="text-sm opacity-75">(Press ESC to exit)</span>
        </div>
      )}

      {/* Save Status */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2">
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
            {!isMobile && 'Export'}
          </Button>
        </div>

        {lastSaved && (
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

      <InputDialog
        isOpen={dialogManager.nodeInputDialog.isOpen}
        title="Add Node"
        placeholder="Enter node text..."
        onSubmit={(text: string) => {
          if (dialogManager.nodeInputDialog.position) {
            eventHandlers.handleNodeInputSubmit(
              text,
              'thought',
              dialogManager.nodeInputDialog.position,
              dialogManager.nodeInputDialog.parentNodeId
            )
          }
        }}
        onCancel={() => dialogManager.setNodeInputDialog({ isOpen: false, position: null, parentNodeId: undefined })}
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
          }

          const updatedNodes = nodes.map(n => (n.id === nodeId ? updatedNode : n))
          setNodes(updatedNodes)

          // Persist the changes
          if (currentEntry) {
            setSaveStatus('saving')
            try {
              await updateEntry(currentEntry.id, {
                nodes: updatedNodes as BrainDumpNode[],
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

          const updatedNodes = nodes.filter(n => n.id !== nodeId)
          const updatedEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId)

          setNodes(updatedNodes)
          setEdges(updatedEdges)

          if (currentEntry) {
            setSaveStatus('saving')
            try {
              await updateEntry(currentEntry.id, {
                nodes: updatedNodes as BrainDumpNode[],
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

                const updatedNodes = nodes.map(n => {
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
                    nodes: updatedNodes as BrainDumpNode[],
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
            logger.info('NODE_ADD_CHILD', 'Cannot add children to nodes that have topic brain dumps')
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

          const updatedNodes = nodes.map(n => (n.id === nodeId ? updatedNode : n))
          setNodes(updatedNodes)

          // Persist the changes
          if (currentEntry) {
            setSaveStatus('saving')
            try {
              await updateEntry(currentEntry.id, {
                nodes: updatedNodes as BrainDumpNode[],
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
          position: { x: number; y: number }
        ) => {
          eventHandlers.handleNodeInputSubmit(text, type as 'thought' | 'category', position)
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

            const updatedNodes = [...nodes, ghostNode]
            setNodes(updatedNodes)

            if (currentEntry) {
              updateEntry(currentEntry.id, { nodes: updatedNodes as BrainDumpNode[] })
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
