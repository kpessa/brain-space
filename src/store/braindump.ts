import { create } from 'zustand'
import type {
  BrainDumpEntry,
  BrainDumpNode,
  BrainDumpEdge,
  ProcessedThought,
} from '../types/braindump'
import { DEFAULT_CATEGORIES } from '../types/braindump'
import { createAIService } from '../services/ai'
import { supabaseService } from '../services/supabase'
import { isSupabaseConfigured } from '../lib/supabase'
import { logger } from '../services/logger'

interface ViewportState {
  x: number
  y: number
  zoom: number
}

interface BrainDumpState {
  entries: BrainDumpEntry[]
  currentEntry: BrainDumpEntry | null
  isLoading: boolean
  isSyncing: boolean
  viewportStates: Record<string, ViewportState> // Store viewport state per brain dump ID

  // Actions
  createEntry: (
    title: string,
    rawText: string,
    userId?: string,
    parentBrainDumpId?: string,
    originNodeId?: string,
    topicFocus?: string,
    type?: 'general' | 'topic-focused',
    initialNodes?: BrainDumpNode[],
    initialEdges?: BrainDumpEdge[],
    originNodeType?: string,
    originalParentNodeId?: string
  ) => Promise<BrainDumpEntry>
  updateEntry: (id: string, updates: Partial<BrainDumpEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  setCurrentEntry: (entry: BrainDumpEntry | null) => void

  // Node operations
  addNode: (node: BrainDumpNode) => Promise<void>
  updateNode: (nodeId: string, data: Partial<BrainDumpNode['data']>) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  toggleNodeCollapse: (nodeId: string) => Promise<void>

  // Edge operations
  addEdge: (edge: BrainDumpEdge) => Promise<void>
  deleteEdge: (edgeId: string) => void

  // Processing
  processRawText: (text: string) => ProcessedThought[]
  processWithAI: (text: string) => Promise<ProcessedThought[]>

  // Sync actions
  setEntries: (entries: BrainDumpEntry[]) => void
  syncEntry: (entry: BrainDumpEntry) => Promise<void>

  // Viewport actions
  saveViewportState: (entryId: string, viewport: ViewportState) => void
  getViewportState: (entryId: string) => ViewportState | null
}

// Helper function to create initial nodes from processed thoughts
const createNodesFromThoughts = (
  thoughts: ProcessedThought[]
): { nodes: BrainDumpNode[]; edges: BrainDumpEdge[] } => {
  const nodes: BrainDumpNode[] = []
  const edges: BrainDumpEdge[] = []

  // Create root node at the left
  const rootNode: BrainDumpNode = {
    id: 'root',
    type: 'root',
    position: { x: 50, y: 300 },
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

  // Create category nodes horizontally to the right of root
  const categoryX = 300
  const categorySpacing = 150
  Object.entries(categorizedThoughts).forEach(([category, categoryThoughts], index) => {
    const categoryNode: BrainDumpNode = {
      id: `category-${category}`,
      type: 'category',
      position: { x: categoryX, y: 100 + index * categorySpacing },
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
      type: 'floating',
      animated: true,
    })

    // Create thought nodes horizontally to the right of categories
    categoryThoughts.forEach((thought, thoughtIndex) => {
      const thoughtNode: BrainDumpNode = {
        id: thought.id,
        type: 'thought',
        position: {
          x: categoryX + 250,
          y: 100 + index * categorySpacing + thoughtIndex * 80 - (categoryThoughts.length - 1) * 40,
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
        type: 'floating',
        animated: true,
      })
    })
  })

  return { nodes, edges }
}

// Simple text processing (will be replaced with AI later)
const processTextSimple = (text: string): ProcessedThought[] => {
  const lines = text.split('\n').filter(line => line.trim())
  const thoughts: ProcessedThought[] = []

  lines.forEach((line, index) => {
    const lower = line.toLowerCase()
    let category = 'misc'

    // Simple keyword-based categorization
    if (lower.includes('idea:') || lower.includes('what if')) {
      category = 'ideas'
    } else if (lower.includes('todo:') || lower.includes('need to') || lower.includes('task:')) {
      category = 'tasks'
    } else if (lower.includes('?') || lower.includes('how') || lower.includes('why')) {
      category = 'questions'
    } else if (
      lower.includes('realize') ||
      lower.includes('insight:') ||
      lower.includes('learned')
    ) {
      category = 'insights'
    } else if (lower.includes('problem:') || lower.includes('issue:') || lower.includes('bug:')) {
      category = 'problems'
    }

    thoughts.push({
      id: `thought-${Date.now()}-${index}`,
      text: line.trim(),
      category,
      confidence: 0.8,
      relatedThoughts: [],
    })
  })

  return thoughts
}

export const useBrainDumpStore = create<BrainDumpState>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  isSyncing: false,
  viewportStates: {},

  createEntry: async (
    title,
    rawText,
    userId = 'demo-user',
    parentBrainDumpId,
    originNodeId,
    topicFocus,
    type = 'general',
    initialNodes,
    initialEdges,
    originNodeType,
    originalParentNodeId
  ) => {
    logger.info('STORE', 'createEntry called', {
      title,
      userId,
      type,
      topicFocus,
      hasInitialNodes: !!initialNodes,
      initialNodesCount: initialNodes?.length,
      hasInitialEdges: !!initialEdges,
      initialEdgesCount: initialEdges?.length,
    })
    // For topic-focused dumps, create a minimal initial structure
    let nodes: BrainDumpNode[]
    let edges: BrainDumpEdge[]

    if (type === 'topic-focused' && topicFocus) {
      // If initial nodes are provided (from parent), use them
      if (initialNodes && initialNodes.length > 0) {
        logger.info('STORE', 'Using provided initial nodes for topic-focused dump', {
          nodesCount: initialNodes.length,
          edgesCount: initialEdges?.length || 0,
          nodeDetails: initialNodes.map(n => ({
            id: n.id,
            type: n.type,
            label: n.data?.label,
            position: n.position,
          })),
          edgeDetails: initialEdges?.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
          })),
        })
        nodes = initialNodes
        edges = initialEdges || []
      } else {
        logger.warn(
          'STORE',
          'No initial nodes provided for topic-focused dump, creating default root'
        )
        // Otherwise create just a root node for the topic
        const rootNode: BrainDumpNode = {
          id: 'root',
          type: 'root',
          position: { x: 400, y: 50 },
          data: {
            label: topicFocus,
            isCollapsed: false,
            children: [],
          },
        }
        nodes = [rootNode]
        edges = []
      }
    } else {
      // Regular brain dump processing
      const thoughts = get().processRawText(rawText)
      const result = createNodesFromThoughts(thoughts)
      nodes = result.nodes
      edges = result.edges

      // Ensure we always have at least a root node
      if (nodes.length === 0) {
        const rootNode: BrainDumpNode = {
          id: 'root',
          type: 'root',
          position: { x: 400, y: 300 },
          data: {
            label: title || 'Brain Dump',
            isCollapsed: false,
            children: [],
          },
        }
        nodes = [rootNode]
        edges = []
      }
    }

    const entry: BrainDumpEntry = {
      id: `braindump-${Date.now()}`,
      userId,
      title:
        title ||
        (type === 'topic-focused' && topicFocus
          ? `Topic: ${topicFocus}`
          : `Brain Dump ${new Date().toLocaleDateString()}`),
      rawText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      categories: DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        nodeCount: nodes.filter(n => n.data.category === cat.id).length,
      })),
      parentBrainDumpId,
      originNodeId,
      originNodeType,
      originalParentNodeId,
      topicFocus,
      type,
    }

    logger.info('STORE', 'Created entry object', {
      entryId: entry.id,
      title: entry.title,
      nodesCount: entry.nodes.length,
      edgesCount: entry.edges.length,
      type: entry.type,
    })

    set(state => {
      logger.info('STORE', 'Adding entry to state', {
        entryId: entry.id,
        previousEntriesCount: state.entries.length,
        newEntriesCount: state.entries.length + 1,
      })
      return {
        entries: [entry, ...state.entries],
        currentEntry: entry,
      }
    })

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && userId !== 'demo-user') {
      logger.info('STORE', 'Syncing entry to Supabase', { entryId: entry.id })
      await get().syncEntry(entry)
    } else {
      logger.info('STORE', 'Skipping Supabase sync', {
        isConfigured: isSupabaseConfigured(),
        userId,
        isDemoUser: userId === 'demo-user',
      })
    }

    logger.info('STORE', 'createEntry completed', {
      entryId: entry.id,
      nodesCount: entry.nodes.length,
    })

    return entry
  },

  updateEntry: async (id, updates) => {
    const updatedAt = new Date().toISOString()

    logger.info('STORE', 'updateEntry called', {
      id,
      hasNodes: !!updates.nodes,
      nodesCount: updates.nodes?.length,
      hasEdges: !!updates.edges,
      edgesCount: updates.edges?.length,
      otherKeys: Object.keys(updates).filter(k => k !== 'nodes' && k !== 'edges'),
    })

    set(state => ({
      entries: state.entries.map(entry =>
        entry.id === id ? { ...entry, ...updates, updatedAt } : entry
      ),
      currentEntry:
        state.currentEntry?.id === id
          ? { ...state.currentEntry, ...updates, updatedAt }
          : state.currentEntry,
    }))

    // Sync to Supabase if configured
    const { currentEntry } = get()
    if (isSupabaseConfigured() && currentEntry && currentEntry.userId !== 'demo-user') {
      logger.info('STORE', 'Syncing update to Supabase', { id, userId: currentEntry.userId })
      const { error } = await supabaseService.updateBrainDump(id, { ...updates, updatedAt })
      if (error) {
        logger.error('STORE', 'Failed to sync brain dump update', {
          id,
          error: error.message,
        })
      } else {
        logger.info('STORE', 'Update synced successfully', { id })
      }
    } else {
      logger.info('STORE', 'Skipping update sync', {
        isConfigured: isSupabaseConfigured(),
        hasCurrentEntry: !!currentEntry,
        userId: currentEntry?.userId,
        isDemoUser: currentEntry?.userId === 'demo-user',
      })
    }
  },

  deleteEntry: async id => {
    const { entries } = get()
    const entryToDelete = entries.find(e => e.id === id)

    // Update local state immediately
    set(state => ({
      entries: state.entries.filter(entry => entry.id !== id),
      currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
    }))

    // Sync with Supabase if the entry was from a non-demo user
    if (entryToDelete && entryToDelete.userId !== 'demo-user' && isSupabaseConfigured()) {
      try {
        const { error } = await supabaseService.deleteBrainDump(id)

        if (error) {
          logger.error('STORE', 'Failed to delete from Supabase', { error, id })
          // Optionally restore the entry on failure
          set(state => ({
            entries: [...state.entries, entryToDelete],
          }))
        } else {
          logger.info('STORE', 'Successfully deleted from Supabase', { id })
        }
      } catch (error) {
        logger.error('STORE', 'Error deleting from Supabase', { error, id })
      }
    }
  },

  setCurrentEntry: entry => {
    const prevEntry = get().currentEntry

    logger.info('STORE', 'Setting current entry', {
      previousId: prevEntry?.id,
      newId: entry?.id,
      newTitle: entry?.title,
      newNodesCount: entry?.nodes?.length || 0,
      newEdgesCount: entry?.edges?.length || 0,
      newType: entry?.type,
    })

    set({ currentEntry: entry })

    // Log details for topic dumps
    if (entry && entry.type === 'topic-focused') {
      logger.debug('STORE', 'Set topic-focused entry as current', {
        id: entry.id,
        nodesInEntry: entry.nodes?.length || 0,
        edgesInEntry: entry.edges?.length || 0,
        nodeDetails: entry.nodes?.map(n => ({
          id: n.id,
          type: n.type,
          label: n.data?.label,
        })),
      })
    }

    // Save current entry ID to localStorage for persistence
    if (entry) {
      localStorage.setItem('currentBrainDumpId', entry.id)
      logger.debug('STORE', 'Saved current entry ID to localStorage', { id: entry.id })
    } else {
      localStorage.removeItem('currentBrainDumpId')
      logger.debug('STORE', 'Removed current entry ID from localStorage')
    }
  },

  addNode: async node => {
    const { currentEntry, updateEntry } = get()
    if (!currentEntry) {
      logger.error('STORE', 'Cannot add node - no current entry')
      return
    }

    logger.info('STORE', 'Adding node', {
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: node.data?.label,
      currentEntryId: currentEntry.id,
      currentNodesCount: currentEntry.nodes.length,
    })

    // Update local state immediately
    set(state => {
      const updatedEntry = {
        ...currentEntry,
        nodes: [...currentEntry.nodes, node],
      }

      return {
        currentEntry: updatedEntry,
        entries: state.entries.map(e => (e.id === currentEntry.id ? updatedEntry : e)),
      }
    })

    // Persist to database
    try {
      await updateEntry(currentEntry.id, {
        nodes: [...currentEntry.nodes, node],
      })
      logger.info('STORE', 'Node persisted successfully', { nodeId: node.id })
    } catch (error) {
      logger.error('STORE', 'Failed to persist node', { nodeId: node.id, error })
    }
  },

  updateNode: async (nodeId, data) => {
    const { currentEntry, updateEntry } = get()
    if (!currentEntry) return

    const updatedNodes = currentEntry.nodes.map(node =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    )

    // Update local state immediately
    set(state => {
      const updatedEntry = {
        ...currentEntry,
        nodes: updatedNodes,
      }

      return {
        currentEntry: updatedEntry,
        entries: state.entries.map(e => (e.id === currentEntry.id ? updatedEntry : e)),
      }
    })

    // Save to database
    await updateEntry(currentEntry.id, { nodes: updatedNodes })
  },

  deleteNode: async nodeId => {
    const { currentEntry, updateEntry } = get()
    if (!currentEntry) return

    logger.info('STORE', 'Deleting node', { nodeId })

    // Update local state
    const updatedNodes = currentEntry.nodes.filter(n => n.id !== nodeId)
    const updatedEdges = currentEntry.edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )

    set(state => {
      const updatedEntry = {
        ...currentEntry,
        nodes: updatedNodes,
        edges: updatedEdges,
      }

      return {
        currentEntry: updatedEntry,
        entries: state.entries.map(e => (e.id === currentEntry.id ? updatedEntry : e)),
      }
    })

    // Persist to database
    try {
      await updateEntry(currentEntry.id, {
        nodes: updatedNodes,
        edges: updatedEdges,
      })
      logger.info('STORE', 'Node deleted successfully', { nodeId })
    } catch (error) {
      logger.error('STORE', 'Failed to delete node', { nodeId, error })
    }
  },

  toggleNodeCollapse: async nodeId => {
    const { currentEntry } = get()
    if (!currentEntry) return

    const node = currentEntry.nodes.find(n => n.id === nodeId)
    if (!node) return

    await get().updateNode(nodeId, { isCollapsed: !node.data.isCollapsed })
  },

  addEdge: async edge => {
    const { currentEntry, updateEntry } = get()
    if (!currentEntry) {
      logger.error('STORE', 'Cannot add edge - no current entry')
      return
    }

    logger.info('STORE', 'Adding edge', {
      edgeId: edge.id,
      source: edge.source,
      target: edge.target,
      currentEntryId: currentEntry.id,
      currentEdgesCount: currentEntry.edges.length,
    })

    // Update local state immediately
    set(state => {
      const updatedEntry = {
        ...currentEntry,
        edges: [...currentEntry.edges, edge],
      }

      return {
        currentEntry: updatedEntry,
        entries: state.entries.map(e => (e.id === currentEntry.id ? updatedEntry : e)),
      }
    })

    // Persist to database
    try {
      await updateEntry(currentEntry.id, {
        edges: [...currentEntry.edges, edge],
      })
      logger.info('STORE', 'Edge persisted successfully', { edgeId: edge.id })
    } catch (error) {
      logger.error('STORE', 'Failed to persist edge', { edgeId: edge.id, error })
    }
  },

  deleteEdge: edgeId => {
    const { currentEntry } = get()
    if (!currentEntry) return

    set(state => {
      const updatedEntry = {
        ...currentEntry,
        edges: currentEntry.edges.filter(e => e.id !== edgeId),
      }

      return {
        currentEntry: updatedEntry,
        entries: state.entries.map(e => (e.id === currentEntry.id ? updatedEntry : e)),
      }
    })
  },

  processRawText: processTextSimple,

  processWithAI: async (text: string) => {
    const aiService = createAIService()
    const result = await aiService.categorizeThoughts(text)

    // Convert AI results to ProcessedThought format
    const thoughts: ProcessedThought[] = []
    let thoughtId = 0

    result.categories.forEach(category => {
      category.thoughts.forEach(thought => {
        thoughts.push({
          id: `thought-ai-${Date.now()}-${thoughtId++}`,
          text: thought.text,
          category: thought.category,
          confidence: thought.confidence,
          relatedThoughts: result.relationships.filter(r => r.from === thought.text).map(r => r.to),
        })
      })
    })

    return thoughts
  },

  setEntries: entries => {
    set({ entries })
  },

  syncEntry: async entry => {
    if (!isSupabaseConfigured()) {
      logger.warn('STORE', 'Cannot sync - Supabase not configured')
      return
    }

    logger.info('STORE', 'Syncing entry to Supabase', {
      entryId: entry.id,
      title: entry.title,
      nodesCount: entry.nodes?.length || 0,
      edgesCount: entry.edges?.length || 0,
    })

    set({ isSyncing: true })
    try {
      await supabaseService.createBrainDump(entry)
      logger.info('STORE', 'Successfully synced entry', { entryId: entry.id })
    } catch (error) {
      logger.error('STORE', 'Failed to sync brain dump', {
        entryId: entry.id,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      set({ isSyncing: false })
    }
  },

  saveViewportState: (entryId, viewport) => {
    set(state => ({
      viewportStates: {
        ...state.viewportStates,
        [entryId]: viewport,
      },
    }))
  },

  getViewportState: entryId => {
    return get().viewportStates[entryId] || null
  },
}))
