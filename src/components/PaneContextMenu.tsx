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
    position: { x: number; y: number }
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
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof nodeTemplates)[0] | null>(null)

  if (!isOpen) return null

  const handleTemplateClick = (template: (typeof nodeTemplates)[0]) => {
    setSelectedTemplate(template)
    setShowInput(true)
    setInputValue('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && selectedTemplate) {
      if (selectedTemplate.type === 'category') {
        onAddNode(inputValue.trim(), 'category', inputValue.trim().toLowerCase(), flowPosition)
      } else {
        onAddNode(inputValue.trim(), selectedTemplate.type, selectedTemplate.category, flowPosition)
      }
      onClose()
      setShowInput(false)
      setInputValue('')
      setSelectedTemplate(null)
    }
  }

  const handleCancel = () => {
    setShowInput(false)
    setInputValue('')
    setSelectedTemplate(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-64 overflow-hidden"
        style={{
          top: position.y,
          left: position.x,
          maxHeight: '400px',
        }}
      >
        {!showInput ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Node
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Templates */}
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1 px-3">
                Add Node
              </div>
              {nodeTemplates.map(template => {
                const Icon = template.icon
                return (
                  <button
                    key={`${template.type}-${template.category}`}
                    onClick={() => handleTemplateClick(template)}
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
            {/* Input Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {selectedTemplate && (
                  <selectedTemplate.icon className={`w-4 h-4 ${selectedTemplate.color}`} />
                )}
                {selectedTemplate?.label}
              </h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-3">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={
                  selectedTemplate?.type === 'category' ? 'Category name...' : 'Enter text...'
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-brain-600 text-white rounded hover:bg-brain-700 text-sm font-medium"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  )
}
