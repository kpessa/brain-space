import { useState, useEffect, useRef } from 'react'
import { X, Wand2 } from 'lucide-react'
import { createAIService } from '../services/ai'

interface EnhancedInputDialogProps {
  isOpen: boolean
  title: string
  placeholder?: string
  initialValue?: string
  onSubmit: (text: string, nodeData?: any) => void
  onCancel: () => void
  useAI?: boolean // Default to true
}

export function EnhancedInputDialog({
  isOpen,
  title,
  placeholder = 'Enter text...',
  initialValue = '',
  onSubmit,
  onCancel,
  useAI: useAIProp = true,
}: EnhancedInputDialogProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [useAI, setUseAI] = useState(useAIProp)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  useEffect(() => {
    setInputValue(initialValue)
  }, [initialValue])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    if (useAI) {
      setIsProcessing(true)
      try {
        const aiService = createAIService()
        const result = await aiService.enhanceNode(trimmed)
        onSubmit(result.nodeData?.title || trimmed, result.nodeData)
      } catch (error) {
        console.error('AI enhancement failed:', error)
        // Fallback to non-enhanced submission
        onSubmit(trimmed)
      } finally {
        setIsProcessing(false)
      }
    } else {
      onSubmit(trimmed)
    }

    setInputValue('')
  }

  const handleCancel = () => {
    setInputValue('')
    onCancel()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCancel} />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-w-[90vw]">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-brain-600" />
              {title}
            </h3>
            <button 
              onClick={handleCancel} 
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* AI Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {useAI ? '✨ AI will create a smart node' : '📝 Manual entry mode'}
            </span>
            <button
              type="button"
              onClick={() => setUseAI(!useAI)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                useAI ? 'bg-brain-600' : 'bg-gray-300'
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            ref={inputRef as any}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={useAI ? "Describe your thought... AI will organize it" : placeholder}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500 resize-none"
            rows={useAI ? 3 : 1}
            disabled={isProcessing}
          />
          
          {/* AI Benefits */}
          {useAI && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              AI creates: 1-2 word title • Smart type • Priority scores • Due dates
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={isProcessing || !inputValue.trim()}
              className="flex-1 px-4 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Add'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}