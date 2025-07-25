'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useNodesStore } from '@/store/nodeStore'
import { useAuth } from '@/contexts/AuthContext'
import { createAIService } from '@/services/ai'
import type { Node, NodeType } from '@/types/node'
import { 
  Zap, 
  Brain,
  Keyboard,
  Send,
  Loader2,
  Target,
  Folder,
  CheckSquare,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  Search,
  MessageSquare,
  Puzzle
} from 'lucide-react'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

const NODE_TYPE_ICONS: Record<NodeType, React.ReactNode> = {
  goal: <Target className="w-4 h-4" />,
  project: <Folder className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
  option: <Puzzle className="w-4 h-4" />,
  idea: <Lightbulb className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  problem: <AlertTriangle className="w-4 h-4" />,
  insight: <Search className="w-4 h-4" />,
  thought: <MessageSquare className="w-4 h-4" />,
  concern: <AlertTriangle className="w-4 h-4" />
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const { createNode } = useNodesStore()
  const { user } = useAuth()
  const aiService = createAIService()

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInput('')
      setPreview(null)
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || !user || isProcessing) return

    setIsProcessing(true)
    setError(null)

    try {
      let nodeData: Partial<Node> = {
        title: input.substring(0, 100),
        description: input,
        type: 'thought',
        tags: ['quick-add'],
        urgency: 5,
        importance: 5,
        userId: user.uid,
      }

      if (useAI) {
        const result = await aiService.enhanceNode(input)
        
        // Build enhanced node data, excluding undefined values
        nodeData = {
          ...nodeData,
          type: result.nodeData.type as NodeType,
          title: result.nodeData.title || input.substring(0, 100),
          description: result.nodeData.description || input,
          tags: result.nodeData.tags || ['quick-add'],
          urgency: result.nodeData.urgency || 5,
          importance: result.nodeData.importance || 5,
        }
        
        // Only add dueDate if it exists
        if (result.nodeData.dueDate && result.nodeData.dueDate.date) {
          nodeData.dueDate = { type: 'exact', date: result.nodeData.dueDate.date }
        }
        
        setPreview(result.nodeData)
      }

      if (!preview) {
        // Direct submission
        await createNode(nodeData)
        onClose()
      } else {
        // Show preview
        setPreview(nodeData)
      }
    } catch (error) {
      console.error('Failed to process input:', error)
      setError(error instanceof Error ? error.message : 'Failed to process input')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmPreview = async () => {
    if (!preview || !user) return

    try {
      await createNode({
        ...preview,
        userId: user.uid,
      })
      onClose()
    } catch (error) {
      console.error('Failed to create node:', error)
      setError(error instanceof Error ? error.message : 'Failed to create node')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add">
      <div className="space-y-4">
        {!preview ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's on your mind?
              </label>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a thought, idea, task, or question..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brain-500 focus:border-transparent"
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="quickAddUseAI"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="rounded"
                  disabled={isProcessing}
                />
                <label htmlFor="quickAddUseAI" className="text-sm text-gray-700 flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  AI Enhancement
                </label>
              </div>
              
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Keyboard className="w-3 h-3" />
                Press ⌘+Enter to submit
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleSubmit()}
                disabled={isProcessing || !input.trim()}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {useAI ? <Zap className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {useAI ? 'Add with AI' : 'Add Node'}
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          // Preview mode
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {NODE_TYPE_ICONS[preview.type as NodeType] || <Brain className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{preview.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{preview.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brain-100 text-brain-800">
                      {preview.type}
                    </span>
                    {preview.tags?.map((tag: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {(preview.urgency || preview.importance) && (
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {preview.urgency && <span>Urgency: {preview.urgency}/10</span>}
                      {preview.importance && <span>Importance: {preview.importance}/10</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreview(null)}
                className="flex-1"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmPreview}
                className="flex-1"
              >
                Confirm & Create
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}