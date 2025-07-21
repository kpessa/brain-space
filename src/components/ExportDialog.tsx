import { useState } from 'react'
import { X, Download, FileText, FileJson, Copy, Check } from 'lucide-react'
import { Button } from './Button'

interface ExportDialogProps {
  isOpen: boolean
  yamlContent: string
  jsonContent: string
  filename: string
  onClose: () => void
  onExport: (format: 'yaml' | 'json') => void
}

export function ExportDialog({
  isOpen,
  yamlContent,
  jsonContent,
  filename,
  onClose,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const content = format === 'yaml' ? yamlContent : jsonContent

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Export Brain Dump</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format selector */}
        <div className="flex gap-2 p-4 border-b">
          <Button
            variant={format === 'yaml' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormat('yaml')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            YAML (Hierarchical)
          </Button>
          <Button
            variant={format === 'json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormat('json')}
            className="flex items-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            JSON (Complete)
          </Button>
        </div>

        {/* Content preview */}
        <div
          className="flex-1 overflow-auto p-4"
          style={{ minHeight: '300px', maxHeight: '500px' }}
        >
          <pre className="bg-gray-100 border border-gray-300 rounded-lg p-4 font-mono text-sm text-gray-900 whitespace-pre-wrap overflow-x-auto">
            {content || 'No content to display'}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-gray-500">
            {format === 'yaml'
              ? 'Hierarchical view showing node relationships through indentation'
              : 'Complete data including all node properties and connections'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onExport(format)} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download {format.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
