import { useState, useEffect } from 'react'
import { X, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuickAdd } from '@/hooks/useQuickAdd'
import { createAIService } from '@/services/ai'

interface EnhancedQuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EnhancedQuickAddModal({ isOpen, onClose }: EnhancedQuickAddModalProps) {
  const [text, setText] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { context, addNode } = useQuickAdd()

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setText('')
      setUseAI(true)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedText = text.trim()
    if (!trimmedText) return

    setIsLoading(true)
    try {
      if (useAI) {
        // Use AI to enhance the node
        const aiService = createAIService()
        const result = await aiService.enhanceNode(trimmedText)
        const nodeData = result.nodeData || {}
        
        // Add node with AI-enhanced data
        await addNode({
          type: nodeData.type || 'thought',
          text: nodeData.title || trimmedText,
          category: nodeData.tags?.[0] || 'misc',
          urgency: nodeData.urgency || context.defaultUrgency,
          importance: nodeData.importance || context.defaultImportance,
          reasoning: nodeData.description || trimmedText,
          dueDate: nodeData.dueDate?.date,
          // Pass along all the enhanced data
          ...nodeData
        })
      } else {
        // Manual mode - just add the node as-is
        await addNode({
          type: 'thought',
          text: trimmedText,
          category: 'misc',
          urgency: context.defaultUrgency,
          importance: context.defaultImportance,
          reasoning: `${context.page} context`,
        })
      }
      onClose()
    } catch (error) {
      console.error('Failed to add node:', error)
      // Fallback to simple add if AI fails
      if (useAI) {
        await addNode({
          type: 'thought',
          text: trimmedText,
          category: 'misc',
          urgency: context.defaultUrgency,
          importance: context.defaultImportance,
          reasoning: `${context.page} context`,
        })
        onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-brain-600" />
                Quick Add
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* AI Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {useAI ? '✨ AI will create a smart node' : '📝 Manual entry mode'}
              </span>
              <button
                type="button"
                onClick={() => setUseAI(!useAI)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  useAI ? 'bg-brain-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    useAI ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Context indicator */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Context: <span className="font-medium capitalize">{context.page}</span>
            </div>

            {/* Text input */}
            <div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={useAI ? "Describe what's on your mind... AI will organize it" : "What's on your mind?"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brain-500 focus:border-transparent resize-none"
                rows={useAI ? 3 : 2}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* AI Benefits */}
            {useAI && (
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                AI creates: 1-2 word title • Smart type • Priority scores • Due dates
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className={cn(
                'px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center gap-2',
                'bg-brain-600 hover:bg-brain-700 disabled:bg-gray-400 dark:disabled:bg-gray-600'
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Add Node'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}