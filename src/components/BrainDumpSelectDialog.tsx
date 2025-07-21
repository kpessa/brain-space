import { useState } from 'react'
import { X, FileText, Calendar, Search } from 'lucide-react'
import type { BrainDumpEntry } from '../types/braindump'

interface BrainDumpSelectDialogProps {
  isOpen: boolean
  entries: BrainDumpEntry[]
  currentEntryId?: string
  onSelect: (entryId: string) => void
  onClose: () => void
}

export function BrainDumpSelectDialog({
  isOpen,
  entries,
  currentEntryId,
  onSelect,
  onClose,
}: BrainDumpSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  // Filter entries - exclude current entry and apply search
  const filteredEntries = entries.filter(entry => {
    if (entry.id === currentEntryId) return false
    if (!searchQuery) return true
    return entry.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-brain-600" />
            Select Brain Dump to Link
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search brain dumps..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brain-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-4">
          {filteredEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchQuery ? 'No brain dumps match your search' : 'No other brain dumps available'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => {
                    onSelect(entry.id)
                    onClose()
                  }}
                  className="w-full text-left p-3 rounded-lg border-2 border-gray-200 hover:border-brain-500 hover:bg-brain-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{entry.title}</h4>
                    <span className="text-sm text-gray-500">{entry.nodes.length} nodes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
