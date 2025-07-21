import { useState } from 'react'
import { X, FileText, Sparkles, Calendar } from 'lucide-react'
import type { BrainDumpNode, BrainDumpEntry } from '../types/braindump'

interface TopicBrainDumpDialogProps {
  isOpen: boolean
  node: BrainDumpNode | null
  parentEntry: BrainDumpEntry | null
  onConfirm: (thoughts: string) => void
  onClose: () => void
}

export function TopicBrainDumpDialog({
  isOpen,
  node,
  parentEntry,
  onConfirm,
  onClose,
}: TopicBrainDumpDialogProps) {
  const [thoughts, setThoughts] = useState('')

  if (!isOpen || !node || !parentEntry) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(thoughts)
    setThoughts('')
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brain-600" />
              Create Topic-Focused Brain Dump
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Start a focused brain dump for "{node.data.label}"
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Origin info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brain-100 rounded-lg">
                <FileText className="w-5 h-5 text-brain-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Creating from:</h3>
                <p className="text-sm text-gray-600 mt-1">{node.data.label}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <span>Parent brain dump: {parentEntry.title}</span>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  {new Date(parentEntry.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Thoughts input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Initial thoughts on "{node.data.label}"
            </label>
            <textarea
              value={thoughts}
              onChange={e => setThoughts(e.target.value)}
              placeholder={`What are your thoughts on ${node.data.label}? This will create a new brain dump focused on this topic...`}
              className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brain-500"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              You can add more thoughts later. This creates a dedicated space for exploring this
              topic.
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-brain-50 rounded-lg">
            <h4 className="text-sm font-medium text-brain-700 mb-2">
              Benefits of topic-focused brain dumps:
            </h4>
            <ul className="space-y-1 text-sm text-brain-600">
              <li>• Deep dive into specific topics without distraction</li>
              <li>• Track how your thoughts on this topic evolve over time</li>
              <li>• Build connections between related concepts</li>
              <li>• Create a focused knowledge base for each topic</li>
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(thoughts)
              setThoughts('')
            }}
            className="flex-1 px-4 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition-colors"
          >
            Create Topic Brain Dump
          </button>
        </div>
      </div>
    </>
  )
}
