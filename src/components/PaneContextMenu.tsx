import { useState } from 'react'
import {
  X,
  Plus,
  GitBranch,
  Lightbulb,
  ListTodo,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Shuffle,
  ArrowRight,
  Wand2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

interface PaneContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  flowPosition: { x: number; y: number }
  onClose: () => void
  onAddNode: (
    text: string,
    type: string,
    category: string,
    position: { x: number; y: number },
    nodeData?: any
  ) => void
  onApplyAutoLayout?: () => void
}

const nodeTemplates = [
  {
    type: 'thought',
    category: 'ideas',
    icon: Lightbulb,
    label: 'New Idea',
    color: 'text-blue-600',
  },
  {
    type: 'thought',
    category: 'tasks',
    icon: ListTodo,
    label: 'New Task',
    color: 'text-green-600',
  },
  {
    type: 'thought',
    category: 'questions',
    icon: HelpCircle,
    label: 'New Question',
    color: 'text-yellow-600',
  },
  {
    type: 'thought',
    category: 'insights',
    icon: Sparkles,
    label: 'New Insight',
    color: 'text-purple-600',
  },
  {
    type: 'thought',
    category: 'problems',
    icon: AlertCircle,
    label: 'New Problem',
    color: 'text-red-600',
  },
  {
    type: 'category',
    category: '',
    icon: GitBranch,
    label: 'New Category',
    color: 'text-gray-600',
  },
]

export function PaneContextMenu({
  isOpen,
  position,
  flowPosition,
  onClose,
  onAddNode,
  onApplyAutoLayout,
}: PaneContextMenuProps) {
  const [inputValue, setInputValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof nodeTemplates)[0] | null>(null)
  const [useAI, setUseAI] = useState(true) // Default to true for AI enhancement
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    
    setIsProcessing(true)
    try {
      const { createAIService } = await import('../services/ai')
      const aiService = createAIService()
      const result = await aiService.enhanceNode(inputValue.trim())
      
      // Extract enhanced data
      const nodeData = result.nodeData || {}
      const nodeText = nodeData.title || inputValue.trim()
      
      onAddNode(nodeText, 'thought', 'misc', flowPosition, nodeData)
      
      onClose()
      setInputValue('')
    } catch (error) {
      console.error('Error processing node:', error)
      // Still add the node without enhancement
      onAddNode(inputValue.trim(), 'thought', 'misc', flowPosition)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualSubmit = () => {
    if (!selectedTemplate) return
    
    const nodeText = inputValue.trim() || selectedTemplate.label
    
    if (selectedTemplate.type === 'category') {
      onAddNode(nodeText, 'category', nodeText.toLowerCase(), flowPosition)
    } else {
      onAddNode(nodeText, selectedTemplate.type, selectedTemplate.category, flowPosition)
    }
    
    onClose()
    setInputValue('')
    setSelectedTemplate(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 overflow-hidden"
        style={{
          top: position.y,
          left: position.x,
          maxHeight: '500px',
        }}
      >
        {/* Header with AI Toggle */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Node
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* AI Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-brain-600" />
              <span className="text-sm font-medium">AI Enhancement</span>
            </div>
            <button
              onClick={() => setUseAI(!useAI)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useAI ? 'bg-brain-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useAI ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {useAI ? 'AI creates structured nodes with 1-2 word titles' : 'Manual node creation'}
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {useAI ? (
            // AI Mode - Simple text input
            <form onSubmit={handleAISubmit}>
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Describe what's on your mind... AI will structure it for you."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500 resize-none"
                rows={3}
                autoFocus
                disabled={isProcessing}
              />
              
              <div className="mt-3 text-xs text-gray-500">
                <p>✨ AI will create:</p>
                <ul className="ml-4 mt-1 space-y-0.5">
                  <li>• Ultra-short title (1-2 words)</li>
                  <li>• Smart categorization</li>
                  <li>• Priority & urgency scores</li>
                  <li>• Due dates if mentioned</li>
                </ul>
              </div>
              
              <button
                type="submit"
                disabled={isProcessing || !inputValue.trim()}
                className="w-full mt-4 px-3 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Create Smart Node
                  </>
                )}
              </button>
            </form>
          ) : (
            // Manual Mode - Template selection
            <div>
              {!selectedTemplate ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">Choose node type:</p>
                  <div className="space-y-1">
                    {nodeTemplates.map(template => {
                      const Icon = template.icon
                      return (
                        <button
                          key={`${template.type}-${template.category}`}
                          onClick={() => setSelectedTemplate(template)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-left"
                        >
                          <Icon className={`w-5 h-5 ${template.color}`} />
                          <span className="text-sm font-medium">{template.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <selectedTemplate.icon className={`w-5 h-5 ${selectedTemplate.color}`} />
                    <span className="font-medium">{selectedTemplate.label}</span>
                    <button
                      onClick={() => {
                        setSelectedTemplate(null)
                        setInputValue('')
                      }}
                      className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                    >
                      Change
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={selectedTemplate.type === 'category' ? 'Category name...' : 'Node label...'}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
                    autoFocus
                  />
                  
                  <button
                    onClick={handleManualSubmit}
                    className="w-full mt-3 px-3 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700"
                  >
                    Add {selectedTemplate.label}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}