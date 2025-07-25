import type { Node as ReactFlowNode } from '@xyflow/react'
import type { Node } from '@/types/node'

/**
 * Transform a Node to React Flow format
 * The Node data becomes the data payload of the React Flow node
 */
export function nodeToReactFlow(node: Node): ReactFlowNode<Node> {
  return {
    id: node.id,
    type: node.type || 'default',
    position: node.reactFlow?.position || { x: 0, y: 0 },
    data: node,
    ...(node.reactFlow?.size && {
      width: node.reactFlow.size.width,
      height: node.reactFlow.size.height,
    }),
  }
}

/**
 * Transform a React Flow node back to our Node format
 * Extracts the data and updates reactFlow properties
 */
export function reactFlowToNode(flowNode: ReactFlowNode<Node>): Node {
  const { position, width, height, measured, data, ...rest } = flowNode

  return {
    ...data,
    reactFlow: {
      position,
      ...(width || height || measured
        ? {
            size: {
              width: width || measured?.width || 150,
              height: height || measured?.height || 50,
            },
          }
        : {}),
    },
  }
}

/**
 * Transform a stored node for React Flow (backward compatibility)
 * @deprecated Use nodeToReactFlow instead
 */
export function transformNodeForReactFlow(storedNode: any): ReactFlowNode {
  // Handle old format where reactFlow properties might be at root
  if (storedNode.reactFlow) {
    return nodeToReactFlow(storedNode as Node)
  }

  // Legacy support - if position is at root level
  const { position, width, height, ...data } = storedNode
  const node: Node = {
    ...data,
    reactFlow: position ? { position } : undefined,
  }

  return nodeToReactFlow(node)
}

/**
 * Transform a node for storage (backward compatibility)
 * @deprecated Use the Node type directly
 */
export function transformNodeForStorage(node: ReactFlowNode): Node {
  return reactFlowToNode(node as ReactFlowNode<Node>)
}

/**
 * Transform multiple nodes to React Flow format
 */
export function nodesToReactFlow(nodes: Node[]): ReactFlowNode<Node>[] {
  return nodes.map(nodeToReactFlow)
}

/**
 * Transform multiple React Flow nodes back to Node format
 */
export function reactFlowToNodes(flowNodes: ReactFlowNode<Node>[]): Node[] {
  return flowNodes.map(reactFlowToNode)
}

// Legacy exports for backward compatibility
export const transformNodesForReactFlow = nodesToReactFlow
export const transformNodesForStorage = reactFlowToNodes
