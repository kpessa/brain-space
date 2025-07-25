import { useState, useEffect } from 'react'
import { Button } from './Button'
import { X, Save, Copy, Check, AlertCircle } from 'lucide-react'
import type { Node } from '../types/node'

interface NodeJsonEditorProps {
  node: Node | any // Accept any node type for flexibility
  isOpen: boolean
  onClose: () => void
  onSave: (updatedNode: any) => void
  title?: string
}

export function NodeJsonEditor({
  node,
  isOpen,
  onClose,
  onSave,
  title = 'Edit Node JSON',
}: NodeJsonEditorProps) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (node && isOpen) {
      // Pretty print the JSON with 2-space indentation
      const formatted = JSON.stringify(node, null, 2)
      setJsonText(formatted)
      setHasChanges(false)
      setError(null)
    }
  }, [node, isOpen])

  const handleJsonChange = (value: string) => {
    setJsonText(value)
    setHasChanges(true)

    // Validate JSON in real-time
    try {
      JSON.parse(value)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText)
      onSave(parsed)
      setHasChanges(false)
      onClose()
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonText(formatted)
      setError(null)
    } catch (e) {
      setError(`Cannot format - Invalid JSON: ${(e as Error).message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={formatJson}>
              Format
            </Button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* JSON Editor */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full flex flex-col gap-2">
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex-1 relative rounded-lg border border-gray-300 overflow-hidden">
              <textarea
                value={jsonText}
                onChange={e => handleJsonChange(e.target.value)}
                className="w-full h-full p-4 pl-16 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brain-500 focus:border-transparent"
                style={{
                  lineHeight: '1.5',
                  tabSize: 2,
                  fontSize: '14px',
                }}
                spellCheck={false}
                placeholder="Enter valid JSON..."
              />

              {/* Line numbers overlay (optional enhancement) */}
              <div className="absolute top-0 left-0 w-12 h-full bg-gray-50 border-r border-gray-200 pointer-events-none">
                <div className="p-4 font-mono text-xs text-gray-400">
                  {jsonText.split('\n').map((_, i) => (
                    <div key={i} className="leading-6">
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Reference */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Quick Reference:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>
                  <code className="bg-gray-100 px-1 rounded">nodeType</code>: The type of node
                  (category, thought, task, etc.)
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">data</code>: All node-specific
                  information
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">metadata</code>: Optional additional
                  metadata
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {hasChanges && <span className="text-amber-600">• Unsaved changes</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!!error || !hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
