import { useState, useEffect } from 'react'
import { BrainDumpInput } from '../components/BrainDumpInput'
import { BrainDumpFlow } from '../components/BrainDumpFlow'
import { BrainDumpItem } from '../components/BrainDumpItem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { useBrainDumpStore } from '../store/braindump'
import {
  Brain,
  List,
  Plus,
  Calendar,
  ChevronRight,
  Menu,
  X,
  Upload,
  Target,
  SortAsc,
  Layers,
  ChevronDown,
} from 'lucide-react'
import type {
  BrainDumpEntry,
  BrainDumpNode,
  BrainDumpEdge,
  ProcessedThought,
} from '../types/braindump'
import { DEFAULT_CATEGORIES } from '../types/braindump'
import { useAuth } from '../contexts/AuthContext'
import {
  groupBrainDumpsByTopic,
  groupBrainDumpsByType,
  sortBrainDumps,
  toggleGroupCollapse,
} from '../lib/brainDumpGrouping'
import { useOrientation } from '../hooks/useOrientation'
import { cn } from '../lib/utils'

// Helper function (copied from store - should be extracted to utils)
const createNodesFromThoughts = (
  thoughts: ProcessedThought[]
): { nodes: BrainDumpNode[]; edges: BrainDumpEdge[] } => {
  const nodes: BrainDumpNode[] = []
  const edges: BrainDumpEdge[] = []

  // Create root node
  const rootNode: BrainDumpNode = {
    id: 'root',
    type: 'root',
    position: { x: 400, y: 50 },
    data: {
      label: 'Brain Dump',
      isCollapsed: false,
      children: [],
    },
  }
  nodes.push(rootNode)

  // Group thoughts by category
  const categorizedThoughts = thoughts.reduce(
    (acc, thought) => {
      if (!acc[thought.category]) {
        acc[thought.category] = []
      }
      acc[thought.category].push(thought)
      return acc
    },
    {} as Record<string, ProcessedThought[]>
  )

  // Create category nodes
  const categoryX = 100
  Object.entries(categorizedThoughts).forEach(([category, categoryThoughts], index) => {
    const categoryNode: BrainDumpNode = {
      id: `category-${category}`,
      type: 'category',
      position: { x: categoryX + index * 300, y: 200 },
      data: {
        label: category,
        category,
        isCollapsed: false,
        children: categoryThoughts.map(t => t.id),
      },
    }
    nodes.push(categoryNode)

    // Connect root to category
    edges.push({
      id: `edge-root-${category}`,
      source: 'root',
      target: categoryNode.id,
      animated: true,
    })

    // Create thought nodes
    categoryThoughts.forEach((thought, thoughtIndex) => {
      const thoughtNode: BrainDumpNode = {
        id: thought.id,
        type: 'thought',
        position: {
          x: categoryX + index * 300 - 50 + (thoughtIndex % 2) * 100,
          y: 350 + Math.floor(thoughtIndex / 2) * 100,
        },
        data: {
          label: thought.text,
          category: thought.category,
          originalText: thought.text,
          aiGenerated: false,
        },
      }
      nodes.push(thoughtNode)

      // Connect category to thought
      edges.push({
        id: `edge-${categoryNode.id}-${thought.id}`,
        source: categoryNode.id,
        target: thought.id,
      })
    })
  })

  return { nodes, edges }
}

export default function BrainDump() {
  const { entries, currentEntry, createEntry, setCurrentEntry, processWithAI } = useBrainDumpStore()
  const { user } = useAuth()
  const [showInput, setShowInput] = useState(!currentEntry)
  const [isProcessing, setIsProcessing] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [, forceUpdate] = useState({})
  const [sortBy, setSortBy] = useState<'date' | 'topic' | 'alphabetical'>('date')
  const [groupBy, setGroupBy] = useState<'none' | 'topic' | 'type'>('none')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isMobileLandscape } = useOrientation()

  // Force re-render when currentEntry changes to update sidebar
  useEffect(() => {
    forceUpdate({})
  }, [currentEntry?.nodes?.length, currentEntry?.updatedAt])
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
      if (window.innerWidth >= 1024 && !isMobileLandscape) {
        setSidebarOpen(true) // Keep sidebar open on desktop (but not mobile landscape)
      } else if (isMobileLandscape) {
        setSidebarOpen(false) // Auto-close in mobile landscape
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobileLandscape])

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        // Validate the imported data
        if (!data.nodes || !data.edges) {
          alert('Invalid file format')
          return
        }

        // Create new entry from imported data
        const importedEntry: BrainDumpEntry = {
          id: `imported-${Date.now()}`,
          userId: user?.id || 'demo-user',
          title: data.title || `Imported: ${file.name}`,
          rawText: data.rawText || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: data.nodes,
          edges: data.edges,
          categories: data.categories || DEFAULT_CATEGORIES,
        }

        // Add to store and sync
        const store = useBrainDumpStore.getState()
        store.entries.unshift(importedEntry)
        setCurrentEntry(importedEntry)
        setShowInput(false)

        // Sync to Supabase if authenticated
        if (user?.id && user.id !== 'demo-user') {
          await store.syncEntry(importedEntry)
        }
      } catch (error) {
        console.error('Error importing file:', error)
        alert('Failed to import file. Please check the file format.')
      }
    }
    input.click()
  }

  const handleProcess = async (text: string) => {
    setIsProcessing(true)
    try {
      if (useAI) {
        // Process with AI
        const thoughts = await processWithAI(text)
        const { nodes, edges } = createNodesFromThoughts(thoughts)

        const entry: BrainDumpEntry = {
          id: `braindump-${Date.now()}`,
          userId: user?.id || 'demo-user',
          title: `Brain Dump ${new Date().toLocaleDateString()}`,
          rawText: text,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes,
          edges,
          categories: DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            nodeCount: nodes.filter(n => n.data.category === cat.id).length,
          })),
        }

        // Add to store and sync
        useBrainDumpStore.getState().entries.unshift(entry)
        setCurrentEntry(entry)

        // Sync to Supabase
        if (user?.id && user.id !== 'demo-user') {
          await useBrainDumpStore.getState().syncEntry(entry)
        }
      } else {
        // Use simple processing through store
        const newEntry = await createEntry('', text, user?.id || 'demo-user')
        setCurrentEntry(newEntry)
      }
      setShowInput(false)
    } catch (error) {
      console.error('Error processing brain dump:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4 overflow-x-hidden">
      <div className="h-[calc(100vh-2rem)] px-4 lg:px-6 xl:px-8 2xl:px-12 3xl:px-16 4xl:px-20 max-w-screen overflow-x-hidden">
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">Brain Dump</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleImport}
                className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20"
                title="Import brain dump from JSON file"
              >
                <Upload className="w-5 h-5" />
                Import
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowInput(!showInput)}
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Brain Dump
              </Button>
            </div>
          </div>
          <p className="text-white/80 mt-2">
            Visualize your thoughts and ideas in an interactive mindmap
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-120px)] overflow-x-hidden">
          {/* Mobile menu button */}
          {(isMobile || isMobileLandscape) && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                "fixed z-50 p-2 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg lg:hidden",
                isMobileLandscape ? "top-20 left-2" : "top-24 left-4"
              )}
            >
              {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          )}
          
          {/* Overlay for mobile */}
          {(isMobile || isMobileLandscape) && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar with entries list */}
          <div
            className={cn(
              "fixed lg:relative inset-y-0 left-0 z-40 lg:w-auto lg:col-span-1 bg-white lg:bg-transparent p-4 lg:p-0 lg:space-y-4 transform transition-transform duration-300 ease-in-out h-full overflow-y-auto",
              "w-80 mobile-landscape:w-64", // Narrower in landscape
              (isMobile || isMobileLandscape) && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
              "lg:translate-x-0"
            )}
          >
            <Card className="h-full overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-brain-500" />
                  <CardTitle>Your Brain Dumps</CardTitle>
                </div>
                <CardDescription>{entries.length} saved mindmaps</CardDescription>

                {/* Sort and Group Controls */}
                <div className="flex gap-2 mt-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                      <SortAsc className="w-3 h-3" />
                      Sort
                    </label>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="w-full text-xs px-2 py-1 border rounded-md bg-white"
                    >
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
                    <select
                      value={groupBy}
                      onChange={e => setGroupBy(e.target.value as any)}
                      className="w-full text-xs px-2 py-1 border rounded-md bg-white"
                    >
                      <option value="none">None</option>
                      <option value="topic">Topic</option>
                      <option value="type">Type</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[calc(100%-180px)]">
                {entries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No brain dumps yet. Create your first one!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      // Apply grouping if needed
                      if (groupBy === 'none') {
                        // No grouping - just sort and display
                        const sorted = sortBrainDumps(entries, sortBy)
                        return sorted.map(entry => (
                          <BrainDumpItem
                            key={entry.id}
                            entry={entry}
                            isActive={currentEntry?.id === entry.id}
                            onClick={() => {
                              setCurrentEntry(entry)
                              setShowInput(false)
                            }}
                          />
                        ))
                      } else {
                        // Group entries
                        const groups =
                          groupBy === 'topic'
                            ? groupBrainDumpsByTopic(entries)
                            : groupBrainDumpsByType(entries)

                        return Object.entries(groups).map(([groupKey, group]) => {
                          const isCollapsed = collapsedGroups.has(groupKey)
                          const sortedEntries = sortBrainDumps(group.entries, sortBy)

                          return (
                            <div key={groupKey} className="space-y-1">
                              {/* Group Header */}
                              <button
                                onClick={() =>
                                  setCollapsedGroups(toggleGroupCollapse(groupKey, collapsedGroups))
                                }
                                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronDown
                                    className={`w-4 h-4 text-gray-500 transition-transform ${
                                      isCollapsed ? '-rotate-90' : ''
                                    }`}
                                  />
                                  <span className="font-medium text-sm text-gray-700">
                                    {group.title}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                                    {group.count}
                                  </span>
                                </div>
                              </button>

                              {/* Group Items */}
                              {!isCollapsed && (
                                <div className="space-y-1 ml-6">
                                  {sortedEntries.map(entry => (
                                    <BrainDumpItem
                                      key={entry.id}
                                      entry={entry}
                                      isActive={currentEntry?.id === entry.id}
                                      onClick={() => {
                                        setCurrentEntry(entry)
                                        setShowInput(false)
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })
                      }
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content area - always take full width on mobile, 3 columns on large screens */}
          <div className={cn(
            "col-span-1 lg:col-span-3 overflow-x-hidden",
            isMobileLandscape && "pl-12" // Extra padding for mobile menu button
          )}>
            {showInput ? (
              <BrainDumpInput
                onProcess={handleProcess}
                isProcessing={isProcessing}
                useAI={useAI}
                onToggleAI={setUseAI}
              />
            ) : (
              <div className="h-full min-h-[500px] bg-white rounded-lg shadow-sm border overflow-hidden">
                <BrainDumpFlow />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
