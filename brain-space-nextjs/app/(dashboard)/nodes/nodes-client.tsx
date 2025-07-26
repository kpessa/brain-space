'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useNodesStore } from '@/store/nodeStore'
import { createAIService } from '@/services/ai'
import type { Node, NodeType } from '@/types/node'
import { getNodeTypeColor, getNodeTypeIcon, getEisenhowerQuadrant } from '@/types/node'
import { AIProviderSelector } from '@/components/AIProviderSelector'
import { 
  Network, 
  Plus, 
  Search, 
  Filter, 
  Zap, 
  MoreHorizontal,
  Tag,
  Calendar,
  Star,
  Brain,
  ArrowRight,
  CheckCircle,
  Circle,
  Clock,
  Target,
  Download,
  Upload
} from 'lucide-react'
import { format } from 'date-fns'

interface NodeCreateModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

function NodeCreateModal({ isOpen, onClose, userId }: NodeCreateModalProps) {
  const [text, setText] = useState('')
  const [shouldUseAI, setShouldUseAI] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createNode, loadNodes } = useNodesStore()
  const aiService = createAIService()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    try {
      let nodeData: Partial<Node> = {
        title: text.substring(0, 100),
        description: text,
        type: 'thought',
        tags: ['misc'],
        urgency: 5,
        importance: 5,
        userId: userId,
      }

      if (shouldUseAI) {
        console.log('Enhancing node with AI...')
        const result = await aiService.enhanceNode(text)
        console.log('AI enhancement result:', result)
        
        // Build enhanced node data, excluding undefined values
        nodeData = {
          ...nodeData,
          type: result.nodeData.type as NodeType,
          title: result.nodeData.title || text.substring(0, 100),
          description: result.nodeData.description || text,
          tags: result.nodeData.tags || ['misc'],
          urgency: result.nodeData.urgency || 5,
          importance: result.nodeData.importance || 5,
        }
        
        // Only add dueDate if it exists
        if (result.nodeData.dueDate && result.nodeData.dueDate.date) {
          nodeData.dueDate = { type: 'exact', date: result.nodeData.dueDate.date }
        }
      }

      console.log('Creating node with data:', nodeData)
      const nodeId = await createNode(nodeData)
      console.log('Created node ID:', nodeId)
      
      if (nodeId) {
        setText('')
        onClose()
        // Reload nodes to ensure the new node appears
        await loadNodes(userId)
      } else {
        throw new Error('Failed to create node - no ID returned')
      }
    } catch (error) {
      console.error('Failed to create node:', error)
      setError(error instanceof Error ? error.message : 'Failed to create node')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Node">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's on your mind?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brain-500 focus:border-transparent"
            placeholder="Enter a thought, idea, task, or question..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox"
            id="useAI"
            checked={shouldUseAI}
            onChange={(e) => setShouldUseAI(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="useAI" className="text-sm text-gray-700">
            Enhance with AI (categorize, extract tags, expand ideas)
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !text.trim()}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                {shouldUseAI ? 'Create & Enhance' : 'Create Node'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface NodeCardProps {
  node: Node
}

function NodeCard({ node }: NodeCardProps) {
  const { updateNode, deleteNode } = useNodesStore()
  const [showDetails, setShowDetails] = useState(false)

  const handleCompletionToggle = () => {
    updateNode(node.id, { completed: !node.completed })
  }

  const getQuadrantColor = (urgency?: number, importance?: number) => {
    const quadrant = getEisenhowerQuadrant(urgency, importance)
    switch (quadrant) {
      case 'do-first': return 'text-red-600 bg-red-100'
      case 'schedule': return 'text-blue-600 bg-blue-100'
      case 'delegate': return 'text-yellow-600 bg-yellow-100'
      case 'eliminate': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleCompletionToggle}
                className="flex-shrink-0"
              >
                {node.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getNodeTypeIcon(node.type)}</span>
                <h3 className={`font-medium ${node.completed ? 'line-through text-gray-500' : 'text-gray-900'} line-clamp-2`}>
                  {node.title || node.description?.substring(0, 100) || 'Untitled'}
                </h3>
              </div>
            </div>
            
            {node.description && node.description !== node.title && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                {node.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getQuadrantColor(node.urgency, node.importance)}`}>
              {getEisenhowerQuadrant(node.urgency, node.importance).replace('-', ' ')}
            </span>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getNodeTypeColor(node.type)} bg-opacity-10`}>
              {node.type}
            </span>
            
            {node.tags && node.tags.length > 0 && (
              <div className="flex gap-1">
                {node.tags.slice(0, 2).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    #{tag}
                  </span>
                ))}
                {node.tags.length > 2 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{node.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {node.updatedAt ? new Date(node.updatedAt).toLocaleDateString() : 'Recently'}
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="text-xs text-gray-600">
              <strong>Created:</strong> {node.createdAt ? new Date(node.createdAt).toLocaleString() : 'Unknown'}
            </div>
            <div className="text-xs text-gray-600">
              <strong>Last Updated:</strong> {node.updatedAt ? new Date(node.updatedAt).toLocaleString() : 'Unknown'}
            </div>
            {node.tags && node.tags.length > 0 && (
              <div className="text-xs text-gray-600">
                <strong>All Tags:</strong> {node.tags.join(', ')}
              </div>
            )}
            {node.urgency && node.importance && (
              <div className="text-xs text-gray-600">
                <strong>Priority:</strong> Urgency {node.urgency}/10, Importance {node.importance}/10
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Less' : 'More'} Details
          </Button>
          <Button size="sm" variant="danger" onClick={() => deleteNode(node.id)} className="text-xs">
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NodesClient({ userId }: { userId: string }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<NodeType | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  
  const { nodes, isLoading, error, loadNodes, getNodesByType, getNodesByTag } = useNodesStore()

  useEffect(() => {
    loadNodes(userId)
  }, [userId, loadNodes])

  // Filter nodes based on search and filters
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = !searchQuery || 
      node.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = selectedType === 'all' || node.type === selectedType
    const matchesTag = selectedTag === 'all' || node.tags?.includes(selectedTag)
    
    return matchesSearch && matchesType && matchesTag
  })

  // Get unique tags
  const allTags = Array.from(new Set(nodes.flatMap(node => node.tags || []))).sort()

  // Export nodes to JSON
  const exportNodes = () => {
    const dataStr = JSON.stringify(nodes, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const exportFileDefaultName = `brain-space-nodes-${format(new Date(), 'yyyy-MM-dd')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Import nodes from JSON
  const importNodes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const importedNodes = JSON.parse(text) as Node[]
      
      // Import each node
      for (const node of importedNodes) {
        const { id, userId, ...nodeData } = node
        await useNodesStore.getState().createNode({
          ...nodeData,
          userId: userId,
        })
      }
      
      await loadNodes(userId)
      alert(`Successfully imported ${importedNodes.length} nodes`)
    } catch (error) {
      console.error('Failed to import nodes:', error)
      alert('Failed to import nodes. Please check the file format.')
    }
    
    // Reset input
    event.target.value = ''
  }


  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading nodes...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 -m-8 p-8 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Network className="w-12 h-12 text-white" />
                <div>
                  <h1 className="text-4xl font-bold text-white">My Nodes</h1>
                  <p className="text-white/80 text-lg">
                    Organize your thoughts, tasks, and ideas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Import */}
                <label className="cursor-pointer">
                  <input type="file" accept=".json" onChange={importNodes} className="hidden" />
                  <Button variant="outline" className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Upload className="w-4 h-4" />
                    Import
                  </Button>
                </label>
                
                {/* Export */}
                <Button
                  variant="outline"
                  onClick={exportNodes}
                  className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                
                {/* Add Node */}
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Node
                </Button>
              </div>
            </div>
            
            {/* AI Provider Selector */}
            <div className="mt-4 flex justify-end">
              <AIProviderSelector />
            </div>
          </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brain-100 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-brain-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Nodes</p>
                  <p className="text-2xl font-bold text-gray-900">{nodes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {nodes.filter(n => n.completed).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {nodes.filter(n => n.type === 'task').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tags</p>
                  <p className="text-2xl font-bold text-gray-900">{allTags.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search nodes..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brain-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as NodeType | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brain-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="goal">Goals</option>
                  <option value="project">Projects</option>
                  <option value="task">Tasks</option>
                  <option value="idea">Ideas</option>
                  <option value="question">Questions</option>
                  <option value="problem">Problems</option>
                  <option value="insight">Insights</option>
                  <option value="thought">Thoughts</option>
                  <option value="concern">Concerns</option>
                </select>
                
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brain-500 focus:border-transparent"
                >
                  <option value="all">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nodes Grid */}
        {filteredNodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-brain-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8 text-brain-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No nodes found</h3>
              <p className="text-gray-500 mb-4">
                {nodes.length === 0 
                  ? "Create your first node to start organizing your thoughts with AI assistance."
                  : "Try adjusting your search or filters."}
              </p>
              {nodes.length === 0 && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Node
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <NodeCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          userId={userId}
        />
        </div>
      </div>
  )
}