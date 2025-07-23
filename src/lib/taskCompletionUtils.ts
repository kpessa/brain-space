import type { BrainDumpNode, BrainDumpEdge } from '@/types/braindump'

/**
 * Utility functions for handling smart task completion logic
 * with AND/OR subtask relationships
 */

export interface TaskCompletionResult {
  shouldCompleteParent: boolean
  shouldCompleteChildren: boolean
  affectedNodeIds: string[]
  message?: string
}

/**
 * Build parent-child relationships from nodes and edges
 */
export function buildTaskRelationships(nodes: BrainDumpNode[], edges: BrainDumpEdge[]) {
  const parentMap = new Map<string, string>() // child -> parent
  const childrenMap = new Map<string, string[]>() // parent -> children[]
  const nodeMap = new Map<string, BrainDumpNode>() // id -> node

  // Build node lookup map
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
  })

  // Build parent-child relationships from edges
  edges.forEach(edge => {
    parentMap.set(edge.target, edge.source)
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, [])
    }
    childrenMap.get(edge.source)!.push(edge.target)
  })

  return { parentMap, childrenMap, nodeMap }
}

/**
 * Check if a parent task should be completed based on its subtask logic
 */
export function shouldParentComplete(
  parentNode: BrainDumpNode,
  children: string[],
  nodeMap: Map<string, BrainDumpNode>
): boolean {
  const subtaskLogic = parentNode.data.subtaskLogic || 'NONE'

  if (subtaskLogic === 'NONE') {
    return false // Manual completion only
  }

  const childNodes = children.map(id => nodeMap.get(id)).filter(Boolean) as BrainDumpNode[]
  const requiredChildren = childNodes.filter(child => !child.data.isOptional)
  const completedChildren = requiredChildren.filter(child => child.data.taskStatus === 'completed')

  if (subtaskLogic === 'AND') {
    // All required subtasks must be completed
    return requiredChildren.length > 0 && completedChildren.length === requiredChildren.length
  }

  if (subtaskLogic === 'OR') {
    // At least one required subtask must be completed
    return requiredChildren.length > 0 && completedChildren.length > 0
  }

  return false
}

/**
 * Check if children should be completed when parent is completed
 */
export function shouldChildrenComplete(
  parentNode: BrainDumpNode,
  children: string[],
  nodeMap: Map<string, BrainDumpNode>
): string[] {
  const subtaskLogic = parentNode.data.subtaskLogic || 'NONE'

  if (subtaskLogic === 'AND') {
    // When parent with AND logic is completed, complete all incomplete children
    const childNodes = children.map(id => nodeMap.get(id)).filter(Boolean) as BrainDumpNode[]
    return childNodes.filter(child => child.data.taskStatus !== 'completed').map(child => child.id)
  }

  // For OR logic and NONE, don't auto-complete children
  return []
}

/**
 * Evaluate what should happen when a task's completion status changes
 */
export function evaluateTaskCompletion(
  changedNodeId: string,
  newStatus: 'completed' | 'pending' | 'in-progress' | 'deferred',
  nodes: BrainDumpNode[],
  edges: BrainDumpEdge[]
): TaskCompletionResult {
  const { parentMap, childrenMap, nodeMap } = buildTaskRelationships(nodes, edges)
  const changedNode = nodeMap.get(changedNodeId)

  if (!changedNode) {
    return { shouldCompleteParent: false, shouldCompleteChildren: false, affectedNodeIds: [] }
  }

  const result: TaskCompletionResult = {
    shouldCompleteParent: false,
    shouldCompleteChildren: false,
    affectedNodeIds: [changedNodeId],
  }

  // If task is being completed
  if (newStatus === 'completed') {
    // Check if parent should be auto-completed
    const parentId = parentMap.get(changedNodeId)
    if (parentId) {
      const parentNode = nodeMap.get(parentId)
      const siblings = childrenMap.get(parentId) || []

      if (parentNode && shouldParentComplete(parentNode, siblings, nodeMap)) {
        result.shouldCompleteParent = true
        result.affectedNodeIds.push(parentId)
        result.message = `Completed parent "${parentNode.data.label}" because all required subtasks are done`
      }
    }

    // Check if children should be auto-completed
    const children = childrenMap.get(changedNodeId) || []
    const childrenToComplete = shouldChildrenComplete(changedNode, children, nodeMap)

    if (childrenToComplete.length > 0) {
      result.shouldCompleteChildren = true
      result.affectedNodeIds.push(...childrenToComplete)
      result.message = `Completed ${childrenToComplete.length} subtasks because parent "${changedNode.data.label}" was completed`
    }
  }

  // If task is being uncompleted, check if parent should be uncompleted
  if (newStatus !== 'completed') {
    const parentId = parentMap.get(changedNodeId)
    if (parentId) {
      const parentNode = nodeMap.get(parentId)
      const siblings = childrenMap.get(parentId) || []

      if (parentNode && parentNode.data.taskStatus === 'completed') {
        // If parent was auto-completed and now a required child is incomplete, uncheck parent
        const siblingNodes = siblings.map(id => nodeMap.get(id)).filter(Boolean) as BrainDumpNode[]
        const requiredSiblings = siblingNodes.filter(child => !child.data.isOptional)
        const completedSiblings = requiredSiblings.filter(child =>
          child.id === changedNodeId ? false : child.data.taskStatus === 'completed'
        )

        const subtaskLogic = parentNode.data.subtaskLogic || 'NONE'
        if (subtaskLogic === 'AND' && completedSiblings.length < requiredSiblings.length) {
          result.affectedNodeIds.push(parentId)
          result.message = `Uncompleted parent "${parentNode.data.label}" because required subtask was uncompleted`
        }
        if (subtaskLogic === 'OR' && completedSiblings.length === 0) {
          result.affectedNodeIds.push(parentId)
          result.message = `Uncompleted parent "${parentNode.data.label}" because all subtasks are incomplete`
        }
      }
    }
  }

  return result
}

/**
 * Get completion progress for a parent task
 */
export function getSubtaskProgress(
  parentNodeId: string,
  nodes: BrainDumpNode[],
  edges: BrainDumpEdge[]
): { completed: number; total: number; required: number; optional: number } {
  const { childrenMap, nodeMap } = buildTaskRelationships(nodes, edges)
  const children = childrenMap.get(parentNodeId) || []
  const childNodes = children.map(id => nodeMap.get(id)).filter(Boolean) as BrainDumpNode[]

  const required = childNodes.filter(child => !child.data.isOptional)
  const optional = childNodes.filter(child => child.data.isOptional)
  const completedRequired = required.filter(child => child.data.taskStatus === 'completed')
  const completedOptional = optional.filter(child => child.data.taskStatus === 'completed')

  return {
    completed: completedRequired.length + completedOptional.length,
    total: childNodes.length,
    required: required.length,
    optional: optional.length,
  }
}
