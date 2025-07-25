import { create } from 'zustand'
import type { Node, NodeType } from '@/types/node'
import type { RecurringCompletion, TaskType } from '@/types/recurrence'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

interface NodesStore {
  // State
  nodes: Node[]
  isLoading: boolean
  error: string | null
  selectedNodeId: string | null

  // Actions
  loadNodes: (userId: string) => Promise<void>
  createNode: (node: Partial<Node>) => Promise<string | null>
  updateNode: (nodeId: string, updates: Partial<Node>) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  completeRecurringTask: (nodeId: string, date: string) => Promise<void>

  // Utilities
  getNodeById: (nodeId: string) => Node | undefined
  getNodesByType: (type: NodeType) => Node[]
  getNodesByTag: (tag: string) => Node[]
  selectNode: (nodeId: string | null) => void

  // Clear state
  clearNodes: () => void
}

export const useNodesStore = create<NodesStore>((set, get) => ({
  // Initial state
  nodes: [],
  isLoading: false,
  error: null,
  selectedNodeId: null,

  // Load all nodes for the current user
  loadNodes: async (userId: string) => {
    if (!userId) {
      set({ error: 'User not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const nodesQuery = query(
        collection(db, 'users', userId, 'nodes'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(nodesQuery)
      
      const nodes: Node[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        nodes.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Node)
      })

      set({
        nodes,
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
  createNode: async (nodeData: Partial<Node>) => {
    if (!nodeData.userId) {
      set({ error: 'User not authenticated' })
      return null
    }

    try {
      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Build the node object, excluding undefined fields
      const newNode: any = {
        id: nodeId,
        userId: nodeData.userId,
        title: nodeData.title || 'Untitled',
        type: nodeData.type || 'thought',
        tags: nodeData.tags || ['misc'],
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Only add optional fields if they're defined
      if (nodeData.description !== undefined) newNode.description = nodeData.description
      if (nodeData.urgency !== undefined) newNode.urgency = nodeData.urgency
      if (nodeData.importance !== undefined) newNode.importance = nodeData.importance
      if (nodeData.dueDate !== undefined) newNode.dueDate = nodeData.dueDate

      // Saving node to Firestore
      
      // Create a clean object for Firestore (no undefined values)
      const firestoreData = Object.entries(newNode).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      // Save to Firestore with server timestamps
      await setDoc(doc(db, 'users', nodeData.userId, 'nodes', nodeId), {
        ...firestoreData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Node saved to Firestore successfully

      // Update local state
      const nodes = [...get().nodes, newNode]
      set({ nodes })

      return nodeId
    } catch (error) {
      // Error in createNode
      set({ error: (error as Error).message })
      return null
    }
  },

  // Update an existing node
  updateNode: async (nodeId: string, updates: Partial<Node>) => {
    const node = get().nodes.find(n => n.id === nodeId)
    if (!node) {
      set({ error: 'Node not found' })
      return
    }

    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', node.userId, 'nodes', nodeId), {
        ...updates,
        updatedAt: serverTimestamp(),
      })

      // Update local state optimistically
      const nodes = get().nodes.map(n => 
        n.id === nodeId 
          ? { ...n, ...updates, updatedAt: new Date().toISOString() } 
          : n
      )

      set({ nodes })
    } catch (error) {
      set({ error: (error as Error).message })
      // Reload to ensure consistency
      await get().loadNodes(node.userId)
    }
  },

  // Complete a recurring task for a specific date
  completeRecurringTask: async (nodeId: string, date: string) => {
    const node = get().nodes.find(n => n.id === nodeId)
    if (!node || !node.recurringCompletions) {
      return
    }

    const completion: RecurringCompletion = {
      date,
      completedAt: new Date().toISOString(),
      status: 'completed',
    }

    const existingCompletions = node.recurringCompletions || []
    const updatedCompletions = existingCompletions.filter(c => c.date !== date)
    updatedCompletions.push(completion)

    await get().updateNode(nodeId, {
      recurringCompletions: updatedCompletions,
      lastRecurringCompletionDate: date,
    })
  },

  // Delete a node
  deleteNode: async (nodeId: string) => {
    const node = get().nodes.find(n => n.id === nodeId)
    if (!node) {
      set({ error: 'Node not found' })
      return
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', node.userId, 'nodes', nodeId))

      // Update local state
      const nodes = get().nodes.filter(n => n.id !== nodeId)
      set({ nodes })

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

  getNodesByType: (type: NodeType) => {
    return get().nodes.filter(node => node.type === type)
  },

  getNodesByTag: (tag: string) => {
    return get().nodes.filter(node => node.tags?.includes(tag))
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId })
  },

  clearNodes: () => {
    set({
      nodes: [],
      isLoading: false,
      error: null,
      selectedNodeId: null,
    })
  },
}))