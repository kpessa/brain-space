import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

export interface BrainDumpNode extends Node {
  data: {
    label: string
    type?: string
    category?: string
    description?: string
    tags?: string[]
    urgency?: number
    importance?: number
    dueDate?: string
    confidence?: number
    keywords?: string[]
    isCollapsed?: boolean
    nodeType?: string
  }
}

export interface BrainDumpEdge extends Edge {
  data?: {
    type?: 'depends_on' | 'relates_to' | 'contradicts' | 'elaborates'
    confidence?: number
  }
}

export interface BrainDumpEntry {
  id: string
  title: string
  rawText: string
  nodes: BrainDumpNode[]
  edges: BrainDumpEdge[]
  createdAt: string
  updatedAt: string
  userId?: string
  type?: 'general' | 'topic-focused'
  topicFocus?: string
}

interface BrainDumpState {
  entries: BrainDumpEntry[]
  currentEntry: BrainDumpEntry | null
  isLoading: boolean
  error: string | null
  
  // Actions
  loadEntries: (userId: string) => Promise<void>
  createEntry: (title: string, rawText: string, userId: string) => Promise<BrainDumpEntry>
  updateEntry: (id: string, updates: Partial<BrainDumpEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  setCurrentEntry: (entry: BrainDumpEntry | null) => void
  
  // Node operations
  addNode: (node: BrainDumpNode) => void
  updateNode: (nodeId: string, updates: Partial<BrainDumpNode>) => void
  deleteNode: (nodeId: string) => void
  
  // Edge operations
  addEdge: (edge: BrainDumpEdge) => void
  updateEdge: (edgeId: string, updates: Partial<BrainDumpEdge>) => void
  deleteEdge: (edgeId: string) => void
}

export const useBrainDumpStore = create<BrainDumpState>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,
  
  loadEntries: async (userId: string) => {
    if (!userId) {
      set({ error: 'User not authenticated', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const entriesQuery = query(
        collection(db, 'users', userId, 'braindumps'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(entriesQuery)
      
      const entries: BrainDumpEntry[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        entries.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as BrainDumpEntry)
      })

      set({
        entries,
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
  
  createEntry: async (title: string, rawText: string, userId: string) => {
    const newEntry: BrainDumpEntry = {
      id: `bd-${Date.now()}`,
      title,
      rawText,
      nodes: [],
      edges: [],
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    try {
      // Save to Firestore
      await setDoc(doc(db, 'users', userId, 'braindumps', newEntry.id), {
        ...newEntry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      
      // Update local state
      set(state => ({
        entries: [...state.entries, newEntry],
        currentEntry: newEntry,
        error: null,
      }))
      
      return newEntry
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  
  updateEntry: async (id: string, updates: Partial<BrainDumpEntry>) => {
    const entry = get().entries.find(e => e.id === id)
    if (!entry || !entry.userId) {
      set({ error: 'Entry not found' })
      return
    }

    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', entry.userId, 'braindumps', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      })

      // Update local state
      set(state => ({
        entries: state.entries.map(entry =>
          entry.id === id
            ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
            : entry
        ),
        currentEntry:
          state.currentEntry?.id === id
            ? { ...state.currentEntry, ...updates, updatedAt: new Date().toISOString() }
            : state.currentEntry,
        error: null,
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
  
  deleteEntry: async (id: string) => {
    const entry = get().entries.find(e => e.id === id)
    if (!entry || !entry.userId) {
      set({ error: 'Entry not found' })
      return
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', entry.userId, 'braindumps', id))

      // Update local state
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        error: null,
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
  
  setCurrentEntry: (entry: BrainDumpEntry | null) => {
    set({ currentEntry: entry })
  },
  
  addNode: (node: BrainDumpNode) => {
    const { currentEntry } = get()
    if (!currentEntry) return
    
    const updatedNodes = [...currentEntry.nodes, node]
    get().updateEntry(currentEntry.id, { nodes: updatedNodes })
  },
  
  updateNode: (nodeId: string, updates: Partial<BrainDumpNode>) => {
    const { currentEntry } = get()
    if (!currentEntry) return
    
    const updatedNodes = currentEntry.nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    )
    get().updateEntry(currentEntry.id, { nodes: updatedNodes })
  },
  
  deleteNode: (nodeId: string) => {
    const { currentEntry } = get()
    if (!currentEntry) return
    
    const updatedNodes = currentEntry.nodes.filter(node => node.id !== nodeId)
    const updatedEdges = currentEntry.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    )
    get().updateEntry(currentEntry.id, { nodes: updatedNodes, edges: updatedEdges })
  },
  
  addEdge: (edge: BrainDumpEdge) => {
    const { currentEntry } = get()
    if (!currentEntry) return
    
    const updatedEdges = [...currentEntry.edges, edge]
    get().updateEntry(currentEntry.id, { edges: updatedEdges })
  },
  
  updateEdge: (edgeId: string, updates: Partial<BrainDumpEdge>) => {
    const { currentEntry } = get()
    if (!currentEntry) return
    
    const updatedEdges = currentEntry.edges.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    )
    get().updateEntry(currentEntry.id, { edges: updatedEdges })
  },
  
  deleteEdge: (edgeId: string) => {
    const { currentEntry } = get()
    if (!currentEntry) return
    
    const updatedEdges = currentEntry.edges.filter(edge => edge.id !== edgeId)
    get().updateEntry(currentEntry.id, { edges: updatedEdges })
  },
}))