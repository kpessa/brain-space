'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Brain, Plus, Upload, List, SortAsc, Layers } from 'lucide-react'
import { BrainDumpInput } from '@/components/BrainDumpInput'
import { BrainDumpFlow } from '@/components/BrainDumpFlow'
import { useBrainDumpStore, type BrainDumpNode, type BrainDumpEdge } from '@/store/braindumpStore'
import { useNodesStore } from '@/store/nodeStore'
import { useAuth } from '@/contexts/AuthContext'
import { createAIService } from '@/services/ai'
import type { NodeType } from '@/types/node'
import { DashboardWrapper } from '@/components/DashboardWrapper'

// Mock data for demo purposes
const brainDumpEntries = [
  {
    id: 1,
    title: 'Project Planning Session',
    date: '2024-01-25',
    nodeCount: 15,
    categories: ['work', 'projects', 'ideas'],
    preview: 'New app features, user research, timeline planning...',
  },
  {
    id: 2,
    title: 'Weekend Goals',
    date: '2024-01-24',
    nodeCount: 8,
    categories: ['personal', 'goals'],
    preview: 'Grocery shopping, gym workout, read book...',
  },
  {
    id: 3,
    title: 'Learning Topics',
    date: '2024-01-23',
    nodeCount: 12,
    categories: ['learning', 'tech'],
    preview: 'React patterns, TypeScript advanced features...',
  },
]

export default function BrainDump() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [useAI, setUseAI] = useState(true)
  const [showInput, setShowInput] = useState(true)
  const [convertLoading, setConvertLoading] = useState(false)
  
  const { user } = useAuth()
  const { entries, createEntry, updateEntry, currentEntry, setCurrentEntry, loadEntries } = useBrainDumpStore()
  const { createNode } = useNodesStore()
  
  // Load entries on mount
  useEffect(() => {
    if (user) {
      loadEntries(user.uid)
    }
  }, [user, loadEntries])

  const handleProcess = async (text: string, title?: string) => {
    if (!user) return
    
    setLoading(true)
    try {
      // Create entry first
      const entry = await createEntry(title || 'Untitled Brain Dump', text, user.uid)
      
      if (useAI) {
        const aiService = createAIService()
        const categories = await aiService.categorizeThoughts(text)
        setResult(categories)
        
        // Convert AI results to nodes and edges
        const { nodes, edges } = convertToNodesAndEdges(categories)
        await updateEntry(entry.id, { nodes, edges })
      } else {
        // Simple processing without AI
        const simpleResult = {
          categories: [{
            name: 'General Thoughts',
            thoughts: text.split('\n').filter(line => line.trim()).map(line => ({ text: line.trim() })),
            confidence: 1.0,
            reasoning: 'Simple text processing without AI categorization'
          }]
        }
        setResult(simpleResult)
        
        // Convert simple results to nodes
        const { nodes, edges } = convertToNodesAndEdges(simpleResult)
        await updateEntry(entry.id, { nodes, edges })
      }
      
      setShowInput(false)
    } catch (error) {
      // Failed to process thoughts
    } finally {
      setLoading(false)
    }
  }
  
  const convertToNodesAndEdges = (result: any): { nodes: BrainDumpNode[], edges: BrainDumpEdge[] } => {
    const nodes: BrainDumpNode[] = []
    const edges: BrainDumpEdge[] = []
    
    // Create root node
    const rootNode: BrainDumpNode = {
      id: 'root',
      type: 'category',
      position: { x: 400, y: 50 },
      data: {
        label: 'Brain Dump',
        category: 'root',
      },
    }
    nodes.push(rootNode)
    
    // Create category nodes and thought nodes
    let categoryY = 200
    result.categories?.forEach((category: any, catIndex: number) => {
      const categoryId = `category-${catIndex}`
      const categoryNode: BrainDumpNode = {
        id: categoryId,
        type: 'category',
        position: { x: 200 + catIndex * 300, y: categoryY },
        data: {
          label: category.name,
          category: category.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          confidence: category.confidence,
        },
      }
      nodes.push(categoryNode)
      
      // Connect category to root
      edges.push({
        id: `edge-root-${categoryId}`,
        source: 'root',
        target: categoryId,
      })
      
      // Create thought nodes for this category
      let thoughtY = categoryY + 150
      category.thoughts?.forEach((thought: any, thoughtIndex: number) => {
        const thoughtId = `thought-${catIndex}-${thoughtIndex}`
        const thoughtNode: BrainDumpNode = {
          id: thoughtId,
          type: 'thought',
          position: { x: 200 + catIndex * 300, y: thoughtY },
          data: {
            label: thought.text,
            type: thought.nodeData?.type || 'default',
            nodeType: thought.nodeData?.type || 'thought',
            keywords: thought.keywords || [],
            tags: thought.nodeData?.tags || [],
            urgency: thought.nodeData?.urgency || thought.urgency,
            importance: thought.nodeData?.importance || thought.importance,
            description: thought.nodeData?.description || thought.text,
          },
        }
        nodes.push(thoughtNode)
        
        // Connect thought to category
        edges.push({
          id: `edge-${categoryId}-${thoughtId}`,
          source: categoryId,
          target: thoughtId,
        })
        
        thoughtY += 100
      })
    })
    
    return { nodes, edges }
  }
  
  // Convert brain dump thoughts to actual nodes
  const convertToNodes = async () => {
    if (!currentEntry || !user) return
    
    setConvertLoading(true)
    try {
      const thoughtNodes = currentEntry.nodes.filter(node => node.type === 'thought')
      let successCount = 0
      
      for (const thoughtNode of thoughtNodes) {
        const nodeData = thoughtNode.data
        
        // Convert to node in the nodes system
        await createNode({
          userId: user.uid,
          title: nodeData.label,
          description: nodeData.description || nodeData.label,
          type: (nodeData.nodeType as NodeType) || 'thought',
          tags: nodeData.tags || nodeData.keywords || [],
          urgency: nodeData.urgency,
          importance: nodeData.importance,
        })
        successCount++
      }
      
      alert(`Successfully converted ${successCount} thoughts to nodes!`)
    } catch (error) {
      // Failed to convert thoughts to nodes
      alert('Failed to convert some thoughts to nodes')
    } finally {
      setConvertLoading(false)
    }
  }

  return (
    <DashboardWrapper>
      <div className="bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 -m-8 p-8 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-12 h-12 text-white" />
                <div>
                  <h1 className="text-4xl font-bold text-white">Brain Dump</h1>
                  <p className="text-white/80 text-lg">
                    Visualize your thoughts and ideas in interactive mindmaps
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20"
                >
                  <Upload className="w-5 h-5" />
                  Import
                </Button>
                <Button
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Brain Dump
                </Button>
              </div>
            </div>
          </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with entries list */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-brain-500" />
                  <CardTitle>Your Brain Dumps</CardTitle>
                </div>
                <CardDescription>{entries.length > 0 ? entries.length : brainDumpEntries.length} saved mindmaps</CardDescription>

                {/* Sort and Group Controls */}
                <div className="flex gap-2 mt-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                      <SortAsc className="w-3 h-3" />
                      Sort
                    </label>
                    <select className="w-full text-xs px-2 py-1 border rounded-md bg-white">
                      <option value="date">Date</option>
                      <option value="topic">Topic</option>
                      <option value="alphabetical">A-Z</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                      <Layers className="w-3 h-3" />
                      Group
                    </label>
                    <select className="w-full text-xs px-2 py-1 border rounded-md bg-white">
                      <option value="none">None</option>
                      <option value="topic">Topic</option>
                      <option value="type">Type</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Show real entries from store */}
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setCurrentEntry(entry)
                        setShowInput(false)
                        setResult(null)
                      }}
                    >
                      <div className="font-medium text-gray-900 mb-1">{entry.title}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {entry.rawText.substring(0, 100)}...
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {entry.nodes.length} nodes
                        </div>
                        {entry.type && (
                          <span className="text-xs bg-brain-100 text-brain-700 px-2 py-0.5 rounded">
                            {entry.type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show mock entries if no real entries */}
                  {entries.length === 0 && brainDumpEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors opacity-50"
                    >
                      <div className="font-medium text-gray-900 mb-1">{entry.title}</div>
                      <div className="text-xs text-gray-500 mb-2">{entry.date}</div>
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {entry.preview}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {entry.nodeCount} nodes
                        </div>
                        <div className="flex gap-1">
                          {entry.categories.slice(0, 2).map((category) => (
                            <span
                              key={category}
                              className="text-xs bg-brain-100 text-brain-700 px-2 py-0.5 rounded"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {entries.length === 0 && brainDumpEntries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No brain dumps yet.</p>
                    <p className="text-sm">Create your first one!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <Card className="h-full min-h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Create New Brain Dump</CardTitle>
                    <CardDescription>
                      Capture your thoughts and let AI organize them into an interactive mindmap
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={useAI}
                        onChange={(e) => setUseAI(e.target.checked)}
                        className="rounded" 
                      />
                      Use AI Processing
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {showInput && !currentEntry ? (
                  <BrainDumpInput
                    onProcess={handleProcess}
                    isProcessing={loading}
                    useAI={useAI}
                    onToggleAI={setUseAI}
                  />
                ) : currentEntry && currentEntry.nodes.length > 0 ? (
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowInput(true)
                          setResult(null)
                        }}
                      >
                        New Brain Dump
                      </Button>
                      <Button
                        variant="primary"
                        onClick={convertToNodes}
                        disabled={convertLoading}
                      >
                        {convertLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Converting...
                          </>
                        ) : (
                          'Convert to Nodes'
                        )}
                      </Button>
                    </div>
                    <BrainDumpFlow
                      onBack={() => {
                        setShowInput(true)
                        setResult(null)
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowInput(true)
                        setResult(null)
                      }}
                    >
                      New Brain Dump
                    </Button>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div className="mt-8 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Categorized Thoughts</h2>
                    
                    {result.categories?.map((category: any, index: number) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                          <span className="text-sm text-gray-500">
                            {Math.round(category.confidence * 100)}% confidence
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{category.reasoning}</p>
                        
                        <div className="space-y-3">
                          {category.thoughts?.map((thought: any, thoughtIndex: number) => (
                            <div key={thoughtIndex} className="bg-gray-50 p-3 rounded border-l-4 border-brain-400">
                              <p className="text-gray-900">{thought.text}</p>
                              {thought.nodeData && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brain-100 text-brain-800">
                                    {thought.nodeData.type}
                                  </span>
                                  {thought.nodeData.tags?.map((tag: string, tagIndex: number) => (
                                    <span key={tagIndex} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {result.suggestions && result.suggestions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-blue-900 mb-3">Suggestions</h3>
                        <ul className="space-y-2">
                          {result.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-blue-800 flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Processing Info - only show if no results yet */}
                {!result && (
                  <div className="bg-brain-50 border border-brain-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brain-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-brain-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-brain-900 mb-2">AI-Powered Organization</h4>
                        <ul className="text-sm text-brain-700 space-y-1">
                          <li>• Automatically categorizes thoughts by topic</li>
                          <li>• Creates hierarchical relationships between ideas</li>
                          <li>• Generates visual mindmap with interactive nodes</li>
                          <li>• Identifies action items and priorities</li>
                          <li>• Suggests connections between related concepts</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Example categories */}
                {!result && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      AI will organize your thoughts into categories like:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {['Work', 'Personal', 'Ideas', 'Tasks', 'Learning', 'Projects', 'Goals'].map((category) => (
                        <span
                          key={category}
                          className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardWrapper>
  )
}