import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Node } from '@/types/node'

export class FirebaseService {
  // Collection references
  private getUserNodesCollection(userId: string) {
    return collection(db, 'users', userId, 'nodes')
  }

  // Node CRUD operations
  async createNode(node: Partial<Node>): Promise<string> {
    const { userId, ...nodeData } = node
    if (!userId) throw new Error('userId is required')

    const nodesRef = this.getUserNodesCollection(userId)
    const docRef = await addDoc(nodesRef, {
      ...nodeData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  }

  async getNode(userId: string, nodeId: string): Promise<Node | null> {
    const nodeRef = doc(this.getUserNodesCollection(userId), nodeId)
    const nodeDoc = await getDoc(nodeRef)

    if (!nodeDoc.exists()) {
      return null
    }

    return {
      id: nodeDoc.id,
      ...nodeDoc.data(),
    } as Node
  }

  async updateNode(userId: string, nodeId: string, updates: Partial<Node>): Promise<void> {
    const nodeRef = doc(this.getUserNodesCollection(userId), nodeId)
    const { id, userId: _, ...updateData } = updates // Remove id and userId from updates

    await updateDoc(nodeRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      lastUpdatedBy: userId,
    })
  }

  async deleteNode(userId: string, nodeId: string): Promise<void> {
    const nodeRef = doc(this.getUserNodesCollection(userId), nodeId)
    await deleteDoc(nodeRef)
  }

  // Batch operations
  async batchUpdateNodes(
    userId: string,
    updates: { id: string; changes: Partial<Node> }[]
  ): Promise<void> {
    const batch = writeBatch(db)

    updates.forEach(({ id, changes }) => {
      const nodeRef = doc(this.getUserNodesCollection(userId), id)
      const { id: _, userId: __, ...updateData } = changes
      batch.update(nodeRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId,
      })
    })

    await batch.commit()
  }

  async batchDeleteNodes(userId: string, nodeIds: string[]): Promise<void> {
    const batch = writeBatch(db)

    nodeIds.forEach(nodeId => {
      const nodeRef = doc(this.getUserNodesCollection(userId), nodeId)
      batch.delete(nodeRef)
    })

    await batch.commit()
  }

  // Query operations
  async getNodes(
    userId: string,
    filter?: {
      type?: string
      tags?: string[]
      completed?: boolean
      searchTerm?: string
      limit?: number
    }
  ): Promise<Node[]> {
    const nodesRef = this.getUserNodesCollection(userId)
    const constraints: QueryConstraint[] = []

    // Apply filters
    if (filter?.type) {
      constraints.push(where('type', '==', filter.type))
    }

    if (filter?.completed !== undefined) {
      constraints.push(where('completed', '==', filter.completed))
    }

    // Default ordering
    constraints.push(orderBy('createdAt', 'desc'))

    if (filter?.limit) {
      constraints.push(limit(filter.limit))
    }

    const q = query(nodesRef, ...constraints)
    const snapshot = await getDocs(q)

    let nodes = snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Node
    )

    // Client-side filtering for complex queries
    if (filter?.tags && filter.tags.length > 0) {
      nodes = nodes.filter(node => node.tags?.some(tag => filter.tags!.includes(tag)))
    }

    if (filter?.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase()
      nodes = nodes.filter(node => {
        if (node.title?.toLowerCase().includes(searchLower)) return true
        if (node.description?.toLowerCase().includes(searchLower)) return true
        if (node.aliases?.some(alias => alias.toLowerCase().includes(searchLower))) return true
        if (node.tags?.some(tag => tag.toLowerCase().includes(searchLower))) return true
        return false
      })
    }

    return nodes
  }

  // Real-time subscriptions
  subscribeToNodes(
    userId: string,
    callback: (nodes: Node[]) => void,
    filter?: { type?: string }
  ): () => void {
    const nodesRef = this.getUserNodesCollection(userId)
    const constraints: QueryConstraint[] = []

    if (filter?.type) {
      constraints.push(where('type', '==', filter.type))
    }

    constraints.push(orderBy('createdAt', 'desc'))

    const q = query(nodesRef, ...constraints)

    const unsubscribe = onSnapshot(q, snapshot => {
      const nodes = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Node
      )

      callback(nodes)
    })

    return unsubscribe
  }

  // Unified Node operations (for backward compatibility)
  async saveUnifiedNode(userId: string, node: any): Promise<string> {
    return this.createNode({ ...node, userId })
  }

  async getUnifiedNodes(userId: string, filters?: any): Promise<any[]> {
    return this.getNodes(userId, filters)
  }

  async updateUnifiedNode(nodeId: string, updates: any): Promise<void> {
    // Extract userId from the node or updates
    const userId = updates.userId || updates.lastUpdatedBy
    if (!userId) throw new Error('userId is required for update')

    return this.updateNode(userId, nodeId, updates)
  }

  async deleteUnifiedNode(nodeId: string): Promise<void> {
    // This method needs userId, but for backward compatibility we'll need to fetch the node first
    throw new Error('deleteUnifiedNode requires refactoring to include userId')
  }

  // Routines operations
  async getRoutineProgress(userId: string): Promise<any | null> {
    try {
      const docRef = doc(db, 'users', userId, 'routines', 'progress')
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Error getting routine progress:', error)
      return null
    }
  }

  async createRoutineProgress(progress: any): Promise<void> {
    const docRef = doc(db, 'users', progress.userId, 'routines', 'progress')
    await setDoc(docRef, {
      ...progress,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async updateRoutineProgress(userId: string, updates: any): Promise<void> {
    const docRef = doc(db, 'users', userId, 'routines', 'progress')
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  async getRoutineEntries(userId: string): Promise<any[]> {
    try {
      const entriesRef = collection(db, 'users', userId, 'routineEntries')
      const q = query(entriesRef, orderBy('date', 'desc'), limit(30))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error('Error getting routine entries:', error)
      return []
    }
  }

  async createRoutineEntry(userId: string, entry: any): Promise<any> {
    const entriesRef = collection(db, 'users', userId, 'routineEntries')
    const docRef = await addDoc(entriesRef, {
      ...entry,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const newDoc = await getDoc(docRef)
    return {
      id: docRef.id,
      ...newDoc.data(),
    }
  }

  async updateRoutineEntry(userId: string, entryId: string, updates: any): Promise<void> {
    const entryRef = doc(db, 'users', userId, 'routineEntries', entryId)
    await updateDoc(entryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }
}

export const firebaseService = new FirebaseService()
