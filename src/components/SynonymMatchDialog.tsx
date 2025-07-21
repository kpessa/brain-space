import { useState } from 'react'
import { X, Ghost, Link2, Plus, FileText, Calendar } from 'lucide-react'
import type { SynonymMatch } from '../services/synonymService'

interface SynonymMatchDialogProps {
  isOpen: boolean
  matches: SynonymMatch[]
  inputText: string
  onCreateNew: () => void
  onCreateInstance: (prototypeNodeId: string) => void
  onCreateGhost: (referencedNodeId: string) => void
  onClose: () => void
}

export function SynonymMatchDialog({
  isOpen,
  matches,
  inputText,
  onCreateNew,
  onCreateInstance,
  onCreateGhost,
  onClose,
}: SynonymMatchDialogProps) {
  const [selectedMatch, setSelectedMatch] = useState<SynonymMatch | null>(null)

  if (!isOpen) return null

  const exactMatches = matches.filter(m => m.matchType === 'exact')
  const fuzzyMatches = matches.filter(m => m.matchType === 'fuzzy')

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Similar Nodes Found</h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {matches.length} node{matches.length !== 1 ? 's' : ''} matching "{inputText}"
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[400px]">
          {/* Matches list */}
          <div className="w-1/2 border-r overflow-y-auto p-4">
            {exactMatches.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Exact Matches</h3>
                <div className="space-y-2 mb-4">
                  {exactMatches.map((match, index) => (
                    <button
                      key={`exact-${index}`}
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedMatch === match
                          ? 'border-brain-500 bg-brain-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{match.node.data.label}</div>
                      {match.matchedSynonym !== match.node.data.label && (
                        <div className="text-xs text-gray-500 mt-1">
                          Matched synonym: "{match.matchedSynonym}"
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <FileText className="w-3 h-3" />
                        {match.entry.title}
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        {new Date(match.entry.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {fuzzyMatches.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Similar Matches</h3>
                <div className="space-y-2">
                  {fuzzyMatches.map((match, index) => (
                    <button
                      key={`fuzzy-${index}`}
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedMatch === match
                          ? 'border-brain-500 bg-brain-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{match.node.data.label}</div>
                      {match.matchedSynonym !== match.node.data.label && (
                        <div className="text-xs text-gray-500 mt-1">
                          Matched synonym: "{match.matchedSynonym}"
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <FileText className="w-3 h-3" />
                        {match.entry.title}
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        {new Date(match.entry.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Options */}
          <div className="w-1/2 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Choose an option:</h3>

            <div className="space-y-3">
              {/* Create new node */}
              <button
                onClick={() => {
                  onCreateNew()
                  onClose()
                }}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Create New Node</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Create an independent node with no connection to existing ones
                    </div>
                  </div>
                </div>
              </button>

              {selectedMatch && (
                <>
                  {/* Create instance */}
                  <button
                    onClick={() => {
                      onCreateInstance(selectedMatch.node.id)
                      onClose()
                    }}
                    className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                        <Link2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Create Instance</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Create a linked instance that shares synonyms with "
                          {selectedMatch.node.data.label}"
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Create ghost */}
                  <button
                    onClick={() => {
                      onCreateGhost(selectedMatch.node.id)
                      onClose()
                    }}
                    className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                        <Ghost className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Create Reference</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Create a ghost reference to "{selectedMatch.node.data.label}"
                        </div>
                      </div>
                    </div>
                  </button>
                </>
              )}

              {!selectedMatch && matches.length > 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Select a match from the left to see more options
                </p>
              )}
            </div>
          </div>
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
