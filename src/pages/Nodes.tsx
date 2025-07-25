import { useState, useEffect } from 'react'
import { useNodesStore } from '@/store/nodes'
import { NodeList } from '@/components/NodeList'
import { NodeJsonEditor } from '@/components/NodeJsonEditor'
import { Button } from '@/components/Button'
import { QuickAddModal } from '@/components/QuickAddModal'
import { Plus, Download, Upload, Brain } from 'lucide-react'
import { useAuthWrapper } from '@/hooks/useAuthWrapper'
import { firebaseService } from '@/services/firebase'
import { format } from 'date-fns'
import type { Node } from '@/types'

export function Nodes() {
  const { user } = useAuthWrapper()
  const { nodes, loadNodes, updateNode, deleteNode } = useNodesStore()
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load nodes on mount
  useEffect(() => {
    if (user?.id) {
      loadNodes().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [user?.id, loadNodes])

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node)
    setShowJsonEditor(true)
  }

  const handleNodeEdit = (node: Node) => {
    setSelectedNode(node)
    setShowJsonEditor(true)
  }

  const handleNodeDelete = async (nodeId: string) => {
    if (!user?.id) return

    if (confirm('Are you sure you want to delete this node?')) {
      try {
        await firebaseService.deleteNode(user.id, nodeId)
        await loadNodes()
      } catch (error) {
        console.error('Failed to delete node:', error)
      }
    }
  }

  const handleNodeSave = async (updatedNode: Node) => {
    if (!user?.id) return

    try {
      await updateNode(updatedNode.id, updatedNode)
      setShowJsonEditor(false)
      setSelectedNode(null)
    } catch (error) {
      console.error('Failed to update node:', error)
    }
  }

  const handleToggleComplete = async (node: Node) => {
    if (!user?.id) return

    try {
      await updateNode(node.id, { completed: !node.completed })
    } catch (error) {
      console.error('Failed to toggle node completion:', error)
    }
  }

  const exportNodes = () => {
    const dataStr = JSON.stringify(nodes, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `brain-space-nodes-${format(new Date(), 'yyyy-MM-dd')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importNodes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) return

    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedNodes = JSON.parse(text) as Node[]

      // Import each node
      for (const node of importedNodes) {
        const { id, userId, ...nodeData } = node
        await firebaseService.createNode({
          ...nodeData,
          userId: user.id,
        })
      }

      await loadNodes()
      alert(`Successfully imported ${importedNodes.length} nodes`)
    } catch (error) {
      console.error('Failed to import nodes:', error)
      alert('Failed to import nodes. Please check the file format.')
    }

    // Reset input
    event.target.value = ''
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-gray-500">Please sign in to view your nodes</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brain-100 rounded-lg">
              <Brain className="w-6 h-6 text-brain-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Nodes</h1>
              <p className="text-gray-600">Organize your thoughts, tasks, and ideas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Import */}
            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={importNodes} className="hidden" />
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </label>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportNodes}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>

            {/* Add Node */}
            <Button
              variant="primary"
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{nodes.length}</div>
            <div className="text-sm text-gray-600">Total Nodes</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">
              {nodes.filter(n => n.type === 'task' && !n.completed).length}
            </div>
            <div className="text-sm text-gray-600">Active Tasks</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {nodes.filter(n => n.type === 'idea').length}
            </div>
            <div className="text-sm text-gray-600">Ideas</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {nodes.filter(n => n.completed).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Nodes List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading nodes...</div>
      ) : (
        <NodeList
          nodes={nodes}
          onNodeClick={handleNodeClick}
          onNodeEdit={handleNodeEdit}
          onNodeDelete={handleNodeDelete}
          emptyMessage="No nodes yet. Create your first node!"
        />
      )}

      {/* JSON Editor Modal */}
      {selectedNode && (
        <NodeJsonEditor
          node={selectedNode}
          isOpen={showJsonEditor}
          onClose={() => {
            setShowJsonEditor(false)
            setSelectedNode(null)
          }}
          onSave={handleNodeSave}
          title={`Edit Node: ${selectedNode.title || 'Untitled'}`}
        />
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSuccess={() => {
          loadNodes()
          setShowQuickAdd(false)
        }}
      />
    </div>
  )
}
