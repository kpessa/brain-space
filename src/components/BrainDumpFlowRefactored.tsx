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
} from '@xyflow/react'
import type { Node } from '@xyflow/react'
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
} from 'lucide-react'
import type { BrainDumpNode } from '../types/braindump'
import { useFullscreen } from '../hooks/useFullscreen'
import { ConfirmDialog } from './ConfirmDialog'
import { InputDialog } from './InputDialog'
import NodeContextMenu from './NodeContextMenu'
import { PaneContextMenu } from './PaneContextMenu'
import { SynonymMatchDialog } from './SynonymMatchDialog'
import { TopicBrainDumpDialog } from './TopicBrainDumpDialog'
import { debounce } from '../lib/debounce'
import { calculateHorizontalLayout, getNewNodePosition } from '../lib/mindMapLayout'
// Custom node components
import { CategoryNode } from './nodes/CategoryNode'
import { ThoughtNode } from './nodes/ThoughtNode'
import { RootNode } from './nodes/RootNode'
import { GhostNode } from './nodes/GhostNode'
import { LinkNode } from './nodes/LinkNode'

// New hooks
import { useDialogManager } from '../hooks/useDialogManager'
import { useReactFlowState } from '../hooks/useReactFlowState'
import { useFlowVisibility } from '../hooks/useFlowVisibility'
import { useEdgeManager } from '../hooks/useEdgeManager'
import { useFlowEventHandlers } from '../hooks/useFlowEventHandlers'

const nodeTypes = {
  category: CategoryNode,
  thought: ThoughtNode,
  root: RootNode,
  ghost: GhostNode,
  link: LinkNode,
}

function BrainDumpFlowInner() {
  const { fitView, screenToFlowPosition } = useReactFlow()
  const { currentEntry, updateEntry, isSyncing } = useBrainDumpStore()

  // UI state
  const { elementRef, isFullscreen, toggleFullscreen } = useFullscreen()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pendingChanges, setPendingChanges] = useState(0)
  const [quickDeleteEdges] = useState(false)
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)

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
    quickDeleteEdges,
    setDeleteEdgeDialog: dialogManager.setDeleteEdgeDialog,
    setNodeInputDialog: dialogManager.setNodeInputDialog,
    setSynonymMatchDialog: dialogManager.setSynonymMatchDialog,
    setContextMenu: dialogManager.setContextMenu,
    setSelectedNodeId,
    screenToFlowPosition,
  })

  // Memoize nodeTypes to prevent React Flow warning
  const memoizedNodeTypes = useMemo(() => nodeTypes, [])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Handle delete edge confirmation
  const handleDeleteEdgeConfirm = useCallback(async () => {
    if (dialogManager.deleteEdgeDialog.edge) {
      await eventHandlers.handleDeleteEdge(dialogManager.deleteEdgeDialog.edge)
      dialogManager.setDeleteEdgeDialog({ isOpen: false, edge: null })
    }
  }, [
    dialogManager.deleteEdgeDialog.edge,
    eventHandlers.handleDeleteEdge,
    dialogManager.setDeleteEdgeDialog,
  ])

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
        parentNodeId: nodeId,
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
        onPaneClick={(event: React.MouseEvent) => {
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
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          deletable: true,
          type: 'default',
        }}
        className="bg-white"
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
      >
        <Background />
        <Controls showInteractive={false} />
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => fitView({ padding: 0.2 })}
          disabled={!currentEntry}
          className="flex items-center gap-1"
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
      <ConfirmDialog
        isOpen={dialogManager.deleteEdgeDialog.isOpen}
        title="Delete Connection"
        message="Are you sure you want to delete this connection?"
        onConfirm={handleDeleteEdgeConfirm}
        onCancel={() => dialogManager.setDeleteEdgeDialog({ isOpen: false, edge: null })}
      />

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
        nodeData={dialogManager.contextMenu.nodeData}
        onStyleChange={() => {}}
        onMakeLink={() => {}}
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
        isOpen={dialogManager.topicDumpDialog.isOpen}
        node={dialogManager.topicDumpDialog.node}
        parentEntry={currentEntry}
        onConfirm={(topicFocus: string) => {
          dialogManager.setTopicDumpDialog({ isOpen: false, node: null })
        }}
        onClose={() => dialogManager.setTopicDumpDialog({ isOpen: false, node: null })}
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
