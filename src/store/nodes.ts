import { create } from 'zustand'
import { firebaseService } from '@/services/firebase'
import type { Node } from '@/types/node'
import { auth } from '@/lib/firebase'

interface NodesStore {
  // State
  nodes: Node[]
  categories: Node[] // Nodes with type === 'category'
  isLoading: boolean
  error: string | null
  selectedNodeId: string | null

  // Actions
  loadNodes: () => Promise<void>
  createNode: (node: Partial<Node>) => Promise<string | null>
  updateNode: (nodeId: string, updates: Partial<Node>) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>

  // Utilities
  getNodeById: (nodeId: string) => Node | undefined
  getCategoryNodes: () => Node[]
  getNodesByType: (type: string) => Node[]
  selectNode: (nodeId: string | null) => void

  // Clear state
  clearNodes: () => void
}

export const useNodesStore = create<NodesStore>((set, get) => ({
  // Initial state
  nodes: [],
  categories: [],
  isLoading: false,
  error: null,
  selectedNodeId: null,

  // Load all nodes for the current user
  loadNodes: async () => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      set({ error: 'User not authenticated', isLoading: false })
      return
    }
    const userId = currentUser.uid

    set({ isLoading: true, error: null })
    try {
      const nodes = await firebaseService.getNodes(userId)
      const categories = nodes.filter(n => n.type === 'category')

      set({
        nodes,
        categories,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      })
    }
  },

  // Create a new node
  createNode: async (node: Partial<Node>) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      set({ error: 'User not authenticated' })
      return null
    }
    const userId = currentUser.uid

    try {
      const nodeId = await firebaseService.createNode({
        ...node,
        userId,
      })

      // Reload nodes to get the latest data
      await get().loadNodes()

      return nodeId
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    }
  },

  // Update an existing node
  updateNode: async (nodeId: string, updates: Partial<Node>) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      set({ error: 'User not authenticated' })
      return
    }
    const userId = currentUser.uid

    try {
      await firebaseService.updateNode(userId, nodeId, updates)

      // Update local state optimistically
      const nodes = get().nodes.map(node => (node.id === nodeId ? { ...node, ...updates } : node))
      const categories = nodes.filter(n => n.type === 'category')

      set({ nodes, categories })
    } catch (error) {
      set({ error: (error as Error).message })
      // Reload to ensure consistency
      await get().loadNodes()
    }
  },

  // Delete a node
  deleteNode: async (nodeId: string) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      set({ error: 'User not authenticated' })
      return
    }
    const userId = currentUser.uid

    try {
      await firebaseService.deleteNode(userId, nodeId)

      // Update local state
      const nodes = get().nodes.filter(node => node.id !== nodeId)
      const categories = nodes.filter(n => n.type === 'category')

      set({ nodes, categories })

      // Clear selection if deleted node was selected
      if (get().selectedNodeId === nodeId) {
        set({ selectedNodeId: null })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  // Utility functions
  getNodeById: (nodeId: string) => {
    return get().nodes.find(node => node.id === nodeId)
  },

  getCategoryNodes: () => {
    return get().nodes.filter(node => node.type === 'category')
  },

  getNodesByType: (type: string) => {
    return get().nodes.filter(node => node.type === type)
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId })
  },

  clearNodes: () => {
    set({
      nodes: [],
      categories: [],
      isLoading: false,
      error: null,
      selectedNodeId: null,
    })
  },
}))
