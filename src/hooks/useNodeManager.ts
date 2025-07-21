import { useCallback, useState, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { logger } from '../services/logger'
import type { BrainDumpNode, BrainDumpEdge } from '../types/braindump'

export function useNodeManager() {
  // Helper function to migrate old handle IDs to new simple handle ID system
  const migrateHandleIds = useCallback((edge: Edge): Edge => {
    let sourceHandle = edge.sourceHandle
    let targetHandle = edge.targetHandle
    let migrationApplied = false

    // Handle old multi-handle IDs (e.g., 'right-2' -> 'right-source')
    if (sourceHandle && sourceHandle.includes('-') && !sourceHandle.endsWith('-source')) {
      const base = sourceHandle.split('-')[0]
      sourceHandle = `${base}-source`
      migrationApplied = true
    } else if (sourceHandle && ['top', 'right', 'bottom', 'left'].includes(sourceHandle)) {
      // Old simple handle -> add -source suffix
      sourceHandle = `${sourceHandle}-source`
      migrationApplied = true
    }

    if (targetHandle && targetHandle.includes('-') && !targetHandle.endsWith('-source')) {
      targetHandle = targetHandle.split('-')[0]
      migrationApplied = true
    }

    // Ensure we have valid handle IDs
    if (!sourceHandle || !sourceHandle.endsWith('-source')) {
      sourceHandle = 'right-source' // Default source handle
      migrationApplied = true
    }

    if (
      !targetHandle ||
      (!['top', 'right', 'bottom', 'left'].includes(targetHandle) &&
        !targetHandle.endsWith('-source'))
    ) {
      targetHandle = 'left' // Default target handle
      migrationApplied = true
    }

    // Log migration if handles were changed
    if (migrationApplied) {
      logger.debug('HANDLE_MIGRATION', 'Migrated edge handle IDs', {
        edgeId: edge.id,
        oldSourceHandle: edge.sourceHandle || 'undefined',
        newSourceHandle: sourceHandle,
        oldTargetHandle: edge.targetHandle || 'undefined',
        newTargetHandle: targetHandle,
      })
    }

    return {
      ...edge,
      sourceHandle,
      targetHandle,
    }
  }, [])

  return {
    migrateHandleIds,
  }
}
