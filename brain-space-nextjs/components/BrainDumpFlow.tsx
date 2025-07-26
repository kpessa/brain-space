'use client'

import { useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import {
  Maximize2,
  Minimize2,
  Save,
  Download,
  Target,
  ArrowLeft,
  CheckSquare,
} from 'lucide-react'
import { CategoryNode } from './flow/nodes/CategoryNode'
import { ThoughtNode } from './flow/nodes/ThoughtNode'
import { useBrainDumpStore, type BrainDumpNode, type BrainDumpEdge } from '@/store/braindumpStore'
import { useNodesStore } from '@/store/nodeStore'
import { useRouter } from 'next/navigation'
import type { NodeType } from '@/types/node'

const nodeTypes = {
  category: CategoryNode,
  thought: ThoughtNode,
}

interface BrainDumpFlowProps {
  initialNodes?: BrainDumpNode[]
  initialEdges?: BrainDumpEdge[]
  onBack?: () => void
  userId?: string
}

function BrainDumpFlowInner({ initialNodes = [], initialEdges = [], onBack, userId }: BrainDumpFlowProps) {
  const [nodes, setNodes] = useState<BrainDumpNode[]>(initialNodes)
  const [edges, setEdges] = useState<BrainDumpEdge[]>(initialEdges)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { fitView } = useReactFlow()
  const { currentEntry, updateEntry } = useBrainDumpStore()
  const { createNode } = useNodesStore()
  const router = useRouter()

  // Update nodes and edges when they change
  useEffect(() => {
    if (currentEntry) {
      setNodes(currentEntry.nodes)
      setEdges(currentEntry.edges)
    }
  }, [currentEntry])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes) as BrainDumpNode[]
      setNodes(updatedNodes)
      if (currentEntry) {
        updateEntry(currentEntry.id, { nodes: updatedNodes })
      }
    },
    [nodes, currentEntry, updateEntry]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges) as BrainDumpEdge[]
      setEdges(updatedEdges)
      if (currentEntry) {
        updateEntry(currentEntry.id, { edges: updatedEdges })
      }
    },
    [edges, currentEntry, updateEntry]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      const updatedEdges = addEdge(params, edges) as BrainDumpEdge[]
      setEdges(updatedEdges)
      if (currentEntry) {
        updateEntry(currentEntry.id, { edges: updatedEdges })
      }
    },
    [edges, currentEntry, updateEntry]
  )

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 200 })
  }

  const handleSave = () => {
    console.log('Saving brain dump...', { nodes, edges })
    // TODO: Implement save functionality
  }

  const handleExport = () => {
    const data = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `braindump-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleConvertToNodes = async () => {
    if (!currentEntry || !userId) return
    
    // Extract thought nodes
    const thoughtNodes = nodes.filter(node => node.type === 'thought')
    let successCount = 0
    
    try {
      for (const thoughtNode of thoughtNodes) {
        const nodeData = thoughtNode.data
        
        // Convert to node in the nodes system
        await createNode({
          userId: userId || 'anonymous',
          title: nodeData.label,
          description: nodeData.description || nodeData.label,
          type: (nodeData.nodeType as NodeType) || 'thought',
          tags: nodeData.tags || nodeData.keywords || [],
          urgency: nodeData.urgency,
          importance: nodeData.importance,
        })
        successCount++
      }
      
      if (successCount > 0) {
        alert(`Successfully converted ${successCount} thoughts to nodes!`)
        // Navigate to nodes page
        router.push('/nodes')
      }
    } catch (error) {
      console.error('Failed to convert thoughts to nodes:', error)
      alert('Failed to convert some thoughts to nodes')
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-semibold">
            {currentEntry?.title || 'Brain Dump Flow'}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleFitView}>
            <Target className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleConvertToNodes}
            className="text-green-600 hover:text-green-700"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            To Nodes
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </Card>
  )
}

export function BrainDumpFlow(props: BrainDumpFlowProps) {
  return (
    <ReactFlowProvider>
      <BrainDumpFlowInner {...props} />
    </ReactFlowProvider>
  )
}