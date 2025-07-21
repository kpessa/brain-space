import { useState } from 'react'
import {
  X,
  Palette,
  Link,
  Trash2,
  GitBranch,
  Ghost,
  Tags,
  Plus as PlusIcon,
  FileText,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronRight,
  Settings2,
  Sparkles,
  MoreVertical,
  Target,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react'
import type { NodeStyle } from '../types/braindump'
import { useBrainDumpStore } from '../store/braindump'
import {
  linearToLog,
  logToLinear,
  simpleToNumeric,
  numericToSimple,
  getQuadrant,
  getQuadrantInfo,
} from '../lib/priorityUtils'
import {
  calculateUrgencyFromDueDate,
  getDueDateDescription,
  formatDate,
  getRelativeDate,
} from '../lib/dateUtils'

interface NodeContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  nodeId: string
  nodeData: any
  onClose: () => void
  onStyleChange: (nodeId: string, style: NodeStyle) => void
  onMakeLink: (nodeId: string) => void
  onDelete?: (nodeId: string) => void
  onLayoutModeChange?: (nodeId: string, layoutMode: 'horizontal' | 'freeform') => void
  onAutoLayout?: (nodeId: string) => void
  onCreateGhost?: (nodeId: string) => void
  onUpdateSynonyms?: (nodeId: string, synonyms: string[]) => void
  onCreateTopicDump?: (nodeId: string) => void
  onDissolveTopicDump?: (nodeId: string) => void
  onAddChild?: (nodeId: string) => void
  onNodeTypeChange?: (nodeId: string, newType: string) => void
  onUpdateNode?: (nodeId: string, data: any) => void
  type?: 'node' | 'pane'
}

const presetColors = [
  { name: 'Blue', bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  { name: 'Green', bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  { name: 'Purple', bg: '#e9d5ff', border: '#8b5cf6', text: '#6b21a8' },
  { name: 'Red', bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  { name: 'Yellow', bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  { name: 'Gray', bg: '#f3f4f6', border: '#6b7280', text: '#1f2937' },
]

const icons = ['💡', '✅', '❓', '🔍', '⚠️', '📌', '🎯', '💭', '🚀', '⭐', '🔗', '📝']

export default function NodeContextMenu({
  isOpen,
  position,
  nodeId,
  nodeData,
  onClose,
  onStyleChange,
  onMakeLink,
  onDelete,
  onLayoutModeChange,
  onAutoLayout,
  onCreateGhost,
  onUpdateSynonyms,
  onCreateTopicDump,
  onDissolveTopicDump,
  onAddChild,
  onNodeTypeChange,
  onUpdateNode,
}: NodeContextMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    appearance: true,
    behavior: false,
    priority: false,
    dueDate: false,
    advanced: false,
  })
  const [synonymInput, setSynonymInput] = useState('')
  const currentStyle = nodeData.style || {}
  const currentLayoutMode = nodeData.layoutMode || 'freeform'
  const currentSynonyms = nodeData.synonyms || []
  const currentPriorityMode = nodeData.priorityMode || 'simple'
  const currentImportance = nodeData.importance
  const currentUrgency = nodeData.urgency
  const currentDueDate = nodeData.dueDate
  const currentAutoUrgency = nodeData.autoUrgencyFromDueDate ?? false

  if (!isOpen) return null

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleColorSelect = (color: (typeof presetColors)[0]) => {
    onStyleChange(nodeId, {
      ...currentStyle,
      backgroundColor: color.bg,
      borderColor: color.border,
      textColor: color.text,
    })
  }

  const handleIconSelect = (icon: string) => {
    onStyleChange(nodeId, {
      ...currentStyle,
      icon,
    })
  }

  const handleBorderStyleChange = (borderStyle: NodeStyle['borderStyle']) => {
    onStyleChange(nodeId, {
      ...currentStyle,
      borderStyle,
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80"
        style={{
          top: position.y,
          left: position.x,
          maxHeight: '600px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-sm text-gray-800">Node Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded p-1 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content with collapsible sections */}
        <div className="max-h-[500px] overflow-y-auto">
          {/* Appearance Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('appearance')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brain-600" />
                <span className="font-medium text-sm">Appearance</span>
              </div>
              {expandedSections.appearance ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.appearance && (
              <div className="px-4 py-3 space-y-4 bg-gray-50/50">
                {/* Colors */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Colors</label>
                  <div className="grid grid-cols-3 gap-2">
                    {presetColors.map(color => (
                      <button
                        key={color.name}
                        onClick={() => handleColorSelect(color)}
                        className="p-2 rounded-lg border-2 hover:shadow-md transition-all"
                        style={{
                          backgroundColor: color.bg,
                          borderColor: color.border,
                          color: color.text,
                        }}
                      >
                        <span className="text-xs font-medium">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icons */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Icon</label>
                  <div className="grid grid-cols-6 gap-1">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => handleIconSelect(icon)}
                        className={`p-2 text-lg rounded hover:bg-gray-100 ${
                          currentStyle.icon === icon ? 'bg-gray-200' : ''
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Style */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Border Style
                  </label>
                  <div className="flex gap-2">
                    {(['solid', 'dashed', 'dotted'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => handleBorderStyleChange(style)}
                        className={`px-3 py-1 text-xs rounded border ${
                          (currentStyle.borderStyle || 'solid') === style
                            ? 'bg-brain-100 border-brain-500 text-brain-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Behavior Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('behavior')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-brain-600" />
                <span className="font-medium text-sm">Behavior</span>
              </div>
              {expandedSections.behavior ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.behavior && (
              <div className="px-4 py-3 space-y-4 bg-gray-50/50">
                {/* Node Type */}
                {onNodeTypeChange && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">
                      Node Type
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          onNodeTypeChange(nodeId, 'thought')
                          onClose()
                        }}
                        disabled={nodeData.type === 'thought'}
                        className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-start gap-2 text-sm ${
                          nodeData.type === 'thought'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-base">💭</span>
                        <span>Thought</span>
                      </button>

                      <button
                        onClick={() => {
                          onNodeTypeChange(nodeId, 'category')
                          onClose()
                        }}
                        disabled={nodeData.type === 'category'}
                        className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-start gap-2 text-sm ${
                          nodeData.type === 'category'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-base">📁</span>
                        <span>Category</span>
                      </button>

                      <button
                        onClick={() => {
                          onNodeTypeChange(nodeId, 'root')
                          onClose()
                        }}
                        disabled={nodeData.type === 'root'}
                        className={`w-full px-3 py-2 rounded-lg transition-colors flex items-center justify-start gap-2 text-sm ${
                          nodeData.type === 'root'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-base">🌳</span>
                        <span>Root</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Layout Mode */}
                {onLayoutModeChange && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">
                      Layout Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          onLayoutModeChange(nodeId, 'horizontal')
                          onClose()
                        }}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                          currentLayoutMode === 'horizontal'
                            ? 'bg-brain-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <GitBranch className="w-4 h-4 inline mr-1" />
                        Horizontal
                      </button>
                      <button
                        onClick={() => {
                          onLayoutModeChange(nodeId, 'freeform')
                          onClose()
                        }}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                          currentLayoutMode === 'freeform'
                            ? 'bg-brain-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-base mr-1">🔀</span>
                        Freeform
                      </button>
                    </div>
                    {currentLayoutMode === 'horizontal' && onAutoLayout && (
                      <button
                        onClick={() => {
                          onAutoLayout(nodeId)
                          onClose()
                        }}
                        className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Auto-arrange Children
                      </button>
                    )}
                  </div>
                )}

                {/* Add Child */}
                {onAddChild && !nodeData.hasTopicBrainDump && (
                  <div>
                    <button
                      onClick={() => {
                        onAddChild(nodeId)
                        onClose()
                      }}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Child Node
                    </button>
                  </div>
                )}

                {/* Synonyms */}
                {onUpdateSynonyms && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Synonyms</label>
                    {currentSynonyms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {currentSynonyms.map((synonym: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                          >
                            {synonym}
                            <button
                              onClick={() => {
                                const newSynonyms = currentSynonyms.filter(
                                  (_: string, i: number) => i !== index
                                )
                                onUpdateSynonyms(nodeId, newSynonyms)
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <form
                      onSubmit={e => {
                        e.preventDefault()
                        if (synonymInput.trim()) {
                          const newSynonyms = [...currentSynonyms, synonymInput.trim()]
                          onUpdateSynonyms(nodeId, newSynonyms)
                          setSynonymInput('')
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={synonymInput}
                        onChange={e => setSynonymInput(e.target.value)}
                        placeholder="Add synonym..."
                        className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brain-500"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 bg-brain-600 text-white rounded-md hover:bg-brain-700"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Priority Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('priority')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brain-600" />
                <span className="font-medium text-sm">Priority</span>
              </div>
              {expandedSections.priority ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.priority && (
              <div className="px-4 py-3 space-y-4 bg-gray-50/50">
                {/* Priority Mode Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">Mode</label>
                  <button
                    onClick={() => {
                      const newMode = currentPriorityMode === 'simple' ? 'advanced' : 'simple'
                      onUpdateNode?.(nodeId, { priorityMode: newMode })
                    }}
                    className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {currentPriorityMode === 'simple' ? 'Simple' : 'Advanced'}
                  </button>
                </div>

                {currentPriorityMode === 'simple' ? (
                  /* Simple Mode - High/Low Toggles */
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">
                        Importance
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const value = linearToLog(simpleToNumeric(false))
                            onUpdateNode?.(nodeId, { importance: value })
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                            !numericToSimple(currentImportance)
                              ? 'bg-gray-200 border-gray-400 text-gray-800'
                              : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          Low
                        </button>
                        <button
                          onClick={() => {
                            const value = linearToLog(simpleToNumeric(true))
                            onUpdateNode?.(nodeId, { importance: value })
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                            numericToSimple(currentImportance)
                              ? 'bg-blue-200 border-blue-400 text-blue-800'
                              : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          High
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">
                        Urgency
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const value = linearToLog(simpleToNumeric(false))
                            onUpdateNode?.(nodeId, { urgency: value })
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                            !numericToSimple(currentUrgency)
                              ? 'bg-gray-200 border-gray-400 text-gray-800'
                              : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          Low
                        </button>
                        <button
                          onClick={() => {
                            const value = linearToLog(simpleToNumeric(true))
                            onUpdateNode?.(nodeId, { urgency: value })
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                            numericToSimple(currentUrgency)
                              ? 'bg-orange-200 border-orange-400 text-orange-800'
                              : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          High
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Advanced Mode - Number Inputs */
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">
                        Importance (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={logToLinear(currentImportance ?? 5)}
                        onChange={e => {
                          const linearValue = parseFloat(e.target.value)
                          const logValue = linearToLog(linearValue)
                          onUpdateNode?.(nodeId, { importance: logValue })
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span className="font-medium text-gray-700">
                          {Math.max(1, logToLinear(currentImportance ?? 5)).toFixed(1)}
                        </span>
                        <span>10</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">
                        Urgency (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={logToLinear(currentUrgency ?? 5)}
                        onChange={e => {
                          const linearValue = parseFloat(e.target.value)
                          const logValue = linearToLog(linearValue)
                          onUpdateNode?.(nodeId, { urgency: logValue })
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span className="font-medium text-gray-700">
                          {Math.max(1, logToLinear(currentUrgency ?? 5)).toFixed(1)}
                        </span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quadrant Preview */}
                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Quadrant Preview</span>
                  </div>
                  {(() => {
                    const quadrant = getQuadrant(currentImportance, currentUrgency)
                    const info = getQuadrantInfo(quadrant)
                    return (
                      <div className={`p-2 rounded border ${info.color}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{info.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{info.label}</div>
                            <div className="text-xs opacity-75">{info.description}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Due Date Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('dueDate')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brain-600" />
                <span className="font-medium text-sm">Due Date</span>
              </div>
              {expandedSections.dueDate ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.dueDate && (
              <div className="px-4 py-3 space-y-4 bg-gray-50/50">
                {/* Current due date display */}
                {currentDueDate && (
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{formatDate(currentDueDate)}</span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {getDueDateDescription(currentDueDate)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick date options */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const date = getRelativeDate('today')
                        onUpdateNode?.(nodeId, {
                          dueDate: date.toISOString(),
                          urgency: currentAutoUrgency
                            ? calculateUrgencyFromDueDate(date.toISOString())
                            : currentUrgency,
                        })
                      }}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const date = getRelativeDate('tomorrow')
                        onUpdateNode?.(nodeId, {
                          dueDate: date.toISOString(),
                          urgency: currentAutoUrgency
                            ? calculateUrgencyFromDueDate(date.toISOString())
                            : currentUrgency,
                        })
                      }}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => {
                        const date = getRelativeDate('thisWeek')
                        onUpdateNode?.(nodeId, {
                          dueDate: date.toISOString(),
                          urgency: currentAutoUrgency
                            ? calculateUrgencyFromDueDate(date.toISOString())
                            : currentUrgency,
                        })
                      }}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => {
                        const date = getRelativeDate('nextWeek')
                        onUpdateNode?.(nodeId, {
                          dueDate: date.toISOString(),
                          urgency: currentAutoUrgency
                            ? calculateUrgencyFromDueDate(date.toISOString())
                            : currentUrgency,
                        })
                      }}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Next Week
                    </button>
                  </div>
                </div>

                {/* Date input */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Specific Date
                  </label>
                  <input
                    type="date"
                    value={currentDueDate ? currentDueDate.split('T')[0] : ''}
                    onChange={e => {
                      const date = e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined
                      onUpdateNode?.(nodeId, {
                        dueDate: date,
                        urgency:
                          currentAutoUrgency && date
                            ? calculateUrgencyFromDueDate(date)
                            : currentUrgency,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
                  />
                </div>

                {/* Auto-calculate urgency toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <label className="text-sm font-medium text-gray-700">
                    Auto-calculate urgency from due date
                  </label>
                  <button
                    onClick={() => {
                      const newAutoUrgency = !currentAutoUrgency
                      onUpdateNode?.(nodeId, {
                        autoUrgencyFromDueDate: newAutoUrgency,
                        urgency:
                          newAutoUrgency && currentDueDate
                            ? calculateUrgencyFromDueDate(currentDueDate)
                            : currentUrgency,
                      })
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      currentAutoUrgency ? 'bg-brain-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentAutoUrgency ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Clear date button */}
                {currentDueDate && (
                  <button
                    onClick={() => {
                      onUpdateNode?.(nodeId, {
                        dueDate: undefined,
                        autoUrgencyFromDueDate: false,
                      })
                    }}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Clear Due Date
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('advanced')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MoreVertical className="w-4 h-4 text-brain-600" />
                <span className="font-medium text-sm">Advanced</span>
              </div>
              {expandedSections.advanced ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedSections.advanced && (
              <div className="px-4 py-3 space-y-3 bg-gray-50/50">
                {/* Topic Brain Dump */}
                {!nodeData.hasTopicBrainDump && onCreateTopicDump && (
                  <button
                    onClick={() => {
                      onCreateTopicDump(nodeId)
                      onClose()
                    }}
                    className="w-full px-3 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Create Topic Brain Dump
                  </button>
                )}

                {nodeData.hasTopicBrainDump && nodeData.topicBrainDumpId && (
                  <>
                    <button
                      onClick={() => {
                        const { entries, setCurrentEntry } = useBrainDumpStore.getState()
                        const topicEntry = entries.find(e => e.id === nodeData.topicBrainDumpId)
                        if (topicEntry) {
                          setCurrentEntry(topicEntry)
                        }
                        onClose()
                      }}
                      className="w-full px-3 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Go to Topic Brain Dump
                    </button>

                    {onDissolveTopicDump && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to dissolve the topic brain dump for "${nodeData.label}"? All nodes will be merged back into this brain dump.`
                            )
                          ) {
                            onDissolveTopicDump(nodeId)
                            onClose()
                          }
                        }}
                        className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                        Dissolve Topic Dump
                      </button>
                    )}
                  </>
                )}

                {/* Make Link */}
                {onMakeLink && !nodeData.isLink && (
                  <button
                    onClick={() => {
                      onMakeLink(nodeId)
                      onClose()
                    }}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Link className="w-4 h-4" />
                    Make Link Node
                  </button>
                )}

                {/* Create Ghost */}
                {onCreateGhost && !nodeData.isGhost && (
                  <button
                    onClick={() => {
                      onCreateGhost(nodeId)
                      onClose()
                    }}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Ghost className="w-4 h-4" />
                    Copy as Reference
                  </button>
                )}

                {/* Delete */}
                {onDelete && nodeData.type !== 'root' && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to delete this node? This action cannot be undone.'
                            )
                          ) {
                            onDelete(nodeId)
                            onClose()
                          }
                        }}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Node
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
