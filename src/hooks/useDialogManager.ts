import { useState } from 'react'
import type { Edge } from '@xyflow/react'
import type { BrainDumpNode } from '../types/braindump'

interface DialogStates {
  deleteEdgeDialog: { isOpen: boolean; edge: Edge | null }
  nodeInputDialog: {
    isOpen: boolean
    position: { x: number; y: number } | null
    parentNodeId?: string
  }
  linkNodeDialog: { isOpen: boolean; nodeId: string | null }
  synonymMatchDialog: {
    isOpen: boolean
    matches: any[]
    inputText: string
    position: { x: number; y: number } | null
    type: string
    category: string
  }
  topicDumpDialog: { isOpen: boolean; node: BrainDumpNode | null }
  contextMenu: {
    isOpen: boolean
    position: { x: number; y: number }
    nodeId: string | null
    nodeData: any | null
    type: 'node' | 'pane'
  }
  edgeHoverMenu: {
    isOpen: boolean
    edge: Edge | null
    position: { x: number; y: number }
  }
  jsonEditor: {
    isOpen: boolean
    node: any | null
    nodeId: string | null
  }
}

export function useDialogManager() {
  const [deleteEdgeDialog, setDeleteEdgeDialog] = useState<DialogStates['deleteEdgeDialog']>({
    isOpen: false,
    edge: null,
  })

  const [nodeInputDialog, setNodeInputDialog] = useState<DialogStates['nodeInputDialog']>({
    isOpen: false,
    position: null,
    parentNodeId: undefined,
  })

  const [linkNodeDialog, setLinkNodeDialog] = useState<DialogStates['linkNodeDialog']>({
    isOpen: false,
    nodeId: null,
  })

  const [synonymMatchDialog, setSynonymMatchDialog] = useState<DialogStates['synonymMatchDialog']>({
    isOpen: false,
    matches: [],
    inputText: '',
    position: null,
    type: 'thought',
    category: 'misc',
  })

  const [topicDumpDialog, setTopicDumpDialog] = useState<DialogStates['topicDumpDialog']>({
    isOpen: false,
    node: null,
  })

  const [contextMenu, setContextMenu] = useState<DialogStates['contextMenu']>({
    isOpen: false,
    position: { x: 0, y: 0 },
    nodeId: null,
    nodeData: null,
    type: 'node',
  })

  const [edgeHoverMenu, setEdgeHoverMenu] = useState<DialogStates['edgeHoverMenu']>({
    isOpen: false,
    edge: null,
    position: { x: 0, y: 0 },
  })

  const [jsonEditor, setJsonEditor] = useState<DialogStates['jsonEditor']>({
    isOpen: false,
    node: null,
    nodeId: null,
  })

  return {
    // State
    deleteEdgeDialog,
    nodeInputDialog,
    linkNodeDialog,
    synonymMatchDialog,
    topicDumpDialog,
    contextMenu,
    edgeHoverMenu,
    jsonEditor,

    // Setters
    setDeleteEdgeDialog,
    setNodeInputDialog,
    setLinkNodeDialog,
    setSynonymMatchDialog,
    setTopicDumpDialog,
    setContextMenu,
    setEdgeHoverMenu,
    setJsonEditor,
  }
}
